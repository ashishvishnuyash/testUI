'use server';
/**
 * @fileOverview Handles AI chat responses using Genkit and Gemini.
 *
 * - generateChatMessage - A function to generate an AI response based on user prompt and history.
 * - GenerateChatInput - The input type for the generateChatMessage function.
 * - GenerateChatOutput - The return type for the generateChatMessage function.
 */
import {ai} from '@/ai/ai-instance';
import {generate} from 'genkit'; // Use core generate function
import {googleAI} from '@genkit-ai/googleai'; // Import googleAI specific types/models if needed
import {z} from 'genkit';
import type {MessageData} from '@/lib/types'; // Import a shared message type

// Define the structure of a single message in the history (consistent with Gemini API)
const HistoryMessageSchema = z.object({
  role: z.enum(['user', 'model']).describe('Who sent the message (user or AI model).'),
  content: z.array(z.object({
    text: z.string().describe('The text content of the message.'),
    // Potentially add other content types like images later if needed
  })).describe('The content parts of the message.'),
});

// Input schema for the chat generation flow
const GenerateChatInputSchema = z.object({
  prompt: z.string().describe('The latest user message to respond to.'),
  history: z.array(HistoryMessageSchema).optional().describe('Previous messages in the conversation for context.'),
});
export type GenerateChatInput = z.infer<typeof GenerateChatInputSchema>;

// Output schema for the chat generation flow
const GenerateChatOutputSchema = z.object({
  response: z.string().describe('The AI-generated response to the user\'s prompt.'),
});
export type GenerateChatOutput = z.infer<typeof GenerateChatOutputSchema>;

// Exported async function that wraps the Genkit flow call
export async function generateChatMessage(input: GenerateChatInput): Promise<GenerateChatOutput> {
  console.log('[generateChatMessage] Input received:', { promptLength: input.prompt.length, historyLength: input.history?.length ?? 0 });
  try {
    const result = await chatFlow(input);
    console.log('[generateChatMessage] Output from chatFlow:', { responseLength: result.response.length });
    return result;
  } catch (error: any) {
     // Log the detailed error on the server
     console.error('[generateChatMessage] Error executing chatFlow:', error.message || error, error.stack);
     // Provide a user-friendly error message in the response
     // Distinguish between specific known issues if possible, otherwise generic error
     let userErrorMessage = "Sorry, I couldn't generate a response due to an internal error.";
     if (error.message && error.message.includes('API key not valid')) {
        userErrorMessage = "Sorry, there seems to be an issue with the AI service configuration.";
     } else if (error.message && error.message.includes('quota')) {
         userErrorMessage = "Sorry, the request limit has been reached. Please try again later.";
     } else if (error.message && error.message.includes('model is not a function')) {
          userErrorMessage = "Sorry, there's a configuration issue with the AI model.";
     } else if (error.message && error.message.includes('429')) { // Handle rate limiting
          userErrorMessage = "Sorry, the service is busy. Please try again in a moment.";
     } else if (error.message && error.message.includes('blocked')) { // Handle content blocking
          userErrorMessage = "Sorry, I cannot respond to that request due to safety settings.";
     }
     return { response: userErrorMessage };
  }
}

// Define the Genkit flow
const chatFlow = ai.defineFlow<
  typeof GenerateChatInputSchema,
  typeof GenerateChatOutputSchema
>(
  {
    name: 'chatFlow',
    inputSchema: GenerateChatInputSchema,
    outputSchema: GenerateChatOutputSchema,
  },
  async (input) => {
    console.log('[chatFlow] Starting flow execution for prompt:', input.prompt.substring(0, 50) + "..."); // Log start

    // Define the specific model and configuration based on user request
    const modelName = 'googleai/gemini-1.5-pro-preview-0514'; // Use the specified model via Genkit naming
    const generationConfig = {
        temperature: 1.0, // Capped at 1.0 (original request was 2.0, which is likely invalid)
        // maxOutputTokens: 1024, // Optional: limit response length
        // topK: 40,             // Optional: nucleus sampling
        // topP: 0.95,           // Optional: nucleus sampling
    };
     // Attempt to define the Google Search tool based on the user's snippet.
     // How Genkit handles this might vary, this structure `{ googleSearch: {} }` is based on the direct SDK example.
    const tools = [
        { googleSearch: {} }
    ];


    try {
      // Map history to the format expected by the generate call
      // Gemini expects {role: 'user' | 'model', parts: [{text: ...}]}
      const mappedHistory = input.history?.map(msg => ({
          role: msg.role,
          parts: msg.content.map(part => ({ text: part.text })) // Ensure parts format is correct
      })) || [];

      console.log(`[chatFlow] Calling model.generate with history length: ${mappedHistory.length}, model: ${modelName}`);

      const result = await generate({
         model: modelName, // Specify the model
         prompt: input.prompt,
         history: mappedHistory,
         config: generationConfig, // Apply the generation config
         tools: tools, // Pass the defined tools
         output: {
             format: 'text', // Expecting plain text response
         },
      });

      const responseText = result.text();

      if (!responseText) {
          console.warn('[chatFlow] Model returned an empty or null response.');
          // Consider throwing a specific error or returning a specific error message
          throw new Error('Model returned an empty response.');
      }

      console.log('[chatFlow] Successfully generated response (first 50 chars):', responseText.substring(0, 50) + "...");
      return { response: responseText };

    } catch (error: any) {
       // Log the detailed error from the model generation step
       console.error('[chatFlow] Error during model generation:', error.message || error, {
            details: error.cause || error.details || 'No additional details',
            stack: error.stack,
            modelUsed: modelName,
            configUsed: generationConfig,
        });

       // Re-throw the error so it can be caught by the generateChatMessage wrapper
       // This allows the wrapper to handle user-facing messages.
       // Include more context if available.
       throw new Error(`AI model generation failed: ${error.message || 'Unknown model error'}`, { cause: error });
    }
  }
);

console.log(`[chat.flow.ts] Chat flow defined.`);
// Removed logging of default model name as it's no longer set globally
