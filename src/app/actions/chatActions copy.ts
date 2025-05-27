'use server';

import { geminiClient } from '@/lib/gemini/client'; // Import the initialized client
import type { MessageData } from '@/lib/types';
// Use the stable SDK import
import {
    GoogleGenerativeAI, // Keep this if needed elsewhere, but likely geminiClient handles it
    HarmCategory,
    HarmBlockThreshold,
    type GenerateContentRequest, // This type might not be directly used if using model.generateContent
    type Content,
    type Part,
} from "@google/generative-ai";

const MODEL_NAME = "gemini-1.5-pro-latest"; // Use a stable model, ensure it's available

// Define a simplified history structure suitable for Server Actions
interface SimpleHistoryMessage {
    role: 'user' | 'model';
    content: Array<{ text: string }>; // Keep content structure
}

// Define input/output types for clarity, using the simplified history
export interface GenerateChatInput {
    prompt: string;
    history: SimpleHistoryMessage[]; // Use the simplified history type
}

export interface GenerateChatOutput {
    response?: string; // Make response optional
    error?: string;    // Add an error field
}

// Function to map the simplified history to Gemini's Content format
function mapHistoryToGeminiContent(history: SimpleHistoryMessage[]): Content[] {
    // Filter out any potential system messages if the model doesn't support them directly
    // The history is already simplified, just map it
    return history
        .filter(msg => msg.role === 'user' || msg.role === 'model')
        .map((msg): Content => {
            // Gemini expects roles 'user' or 'model'
            const role = msg.role === 'model' ? 'model' : 'user';
            // Ensure content is mapped to the Part[] structure
            const parts: Part[] = msg.content.map(part => ({ text: part.text }));
            return { role, parts };
        });
}

// Utility functions for rate limiting and retry logic
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
): Promise<T> {
    let retryCount = 0;
    let lastError: any;

    while (retryCount < maxRetries) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            
            // Check if it's a rate limit error (429)
            if (error.message?.includes('429')) {
                // Get retry delay from error response if available
                const retryDelay = error.message.match(/retryDelay":"(\d+)s"/)?.[1];
                const waitTime = retryDelay 
                    ? parseInt(retryDelay) * 1000 
                    : initialDelay * Math.pow(2, retryCount);
                
                console.log(`Rate limit hit, retrying in ${waitTime/1000}s... (Attempt ${retryCount + 1}/${maxRetries})`);
                await delay(waitTime);
                retryCount++;
                continue;
            }
            
            // For other errors, throw immediately
            throw error;
        }
    }
    
    throw lastError;
}

export async function generateGeminiChatMessage(input: GenerateChatInput): Promise<GenerateChatOutput> {
    console.log('[generateGeminiChatMessage] Received input:', { promptLength: input.prompt.length, historyLength: input.history.length });

    // === Crucial Check: Verify geminiClient is initialized ===
    if (!geminiClient) {
        const errorMsg = "Gemini AI client not initialized. Check GOOGLE_GENAI_API_KEY environment variable and server logs.";
        console.error(`🔴 [generateGeminiChatMessage] ${errorMsg}`);
        return { error: "AI service configuration error. API Key likely missing or invalid." };
    }
    console.log("🟢 [generateGeminiChatMessage] Gemini client appears available.");

    // Configuration based on user's code snippet, adjusted for safety/validity
    const generationConfig = {
        // temperature: 2, // Temperature must be between 0 and 1.0 for Gemini. Setting to 1.0 for high creativity.
        temperature: 1.0,
        // topK: 1, // Optional: Adjust as needed
        // topP: 1, // Optional: Adjust as needed
        // maxOutputTokens: 8192, // Optional: Increased token limit if needed
    };

    // Tools configuration (Ensure this is valid for the stable SDK if needed)
    // const tools = [
    //    { googleSearch: {
    //     name: "googleSearch",
    //     description: "Search the web using Google",
    //     parameters: {
    //         type: "object",
    //         properties: {
    //             query: {
    //                 type: "string",
    //                 description: "The search query"
    //             }
    //         },
    //         required: ["query"]
    //     }
    // }

    //     }, // Enable Google Search tool - check if API/format is correct for @google/generative-ai
    // ];

    const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    try {
        // Map internal history format to Gemini's Content[] format
        const geminiHistory = mapHistoryToGeminiContent(input.history);

        // Construct the full content array including the new prompt
        const contents: Content[] = [
            ...geminiHistory,
            { role: 'user', parts: [{ text: input.prompt }] }
        ];

        console.log(`[generateGeminiChatMessage] Calling Gemini model: ${MODEL_NAME} with ${contents.length} content entries.`);

        const model = geminiClient.getGenerativeModel({
            model: MODEL_NAME,
            safetySettings: safetySettings,
            generationConfig: generationConfig,
            // tools: tools,

            // Pass tools configuration if applicable and valid for the SDK
            // tools: tools,
        });

        // Wrap the API call with retry logic
        const result = await withRetry(
            async () => {
                console.log("[generateGeminiChatMessage] Calling model.generateContent...");
                const res = await model.generateContent({ contents });
                console.log("[generateGeminiChatMessage] model.generateContent finished.");
                return res;
            }
        );

        // --- Response Handling ---
        if (!result || !result.response) {
             console.warn("[generateGeminiChatMessage] No response object received from Gemini model.", { result });
             // Check for specific blocking reasons if available in the result structure
             const blockReason = result?.response?.promptFeedback?.blockReason;
             if (blockReason) {
                  console.warn(`[generateGeminiChatMessage] Request blocked due to: ${blockReason}`);
                  return { error: `Sorry, your request was blocked due to safety settings (${blockReason}).` };
             }
             // Check for function calls (tool use) - this example doesn't explicitly handle tool *output* yet
             const functionCalls = result?.response?.functionCalls;
             if (functionCalls && functionCalls.length > 0) {
                  console.log("[generateGeminiChatMessage] Model requested function calls:", functionCalls);
                  // TODO: Implement logic to handle function calls if needed.
                  return { response: "[Tool call detected, but response processing not implemented yet]" };
             }

             return { error: "AI failed to generate a response (empty response object)." };
         }

         const response = result.response;
         const responseText = response.text();

        if (!responseText) {
           console.warn("[generateGeminiChatMessage] Gemini response text is empty.", { response });
            const blockReason = response?.promptFeedback?.blockReason;
             if (blockReason) {
                  console.warn(`[generateGeminiChatMessage] Content blocked in response text due to: ${blockReason}`);
                  return { error: `Sorry, the response was blocked due to safety settings (${blockReason}).` };
             }
           return { error: "AI generated an empty response." };
        }

        console.log('[generateGeminiChatMessage] Successfully generated response (first 50 chars):', responseText.substring(0, 50) + "...");
        return { response: responseText };

    } catch (error: any) {
        console.error('🔴 [generateGeminiChatMessage] Error calling Gemini API:', {
            message: error.message || 'Unknown error',
            details: error.details || error.cause || 'No additional details',
            stack: error.stack, // Optional: log stack trace for detailed debugging
        });

        // Provide more specific user-facing error messages
        let userErrorMessage = "Sorry, I couldn't generate a response due to an internal error.";
        if (error.message) {
            if (error.message.includes('API key not valid') || error.message.includes('PERMISSION_DENIED') || error.status === 403) {
                userErrorMessage = "AI service configuration error (API Key invalid or permissions denied).";
            } else if (error.message.includes('quota') || error.status === 429) {
                userErrorMessage = "AI service request limit reached. Please try again later.";
            } else if (error.message.includes('UnsupportedUserLocation')) {
                userErrorMessage = "AI service is not available in your region.";
            } else if (error.message.includes('Invalid model name') || error.status === 404) {
                 userErrorMessage = `Configured AI model (${MODEL_NAME}) not found or invalid.`;
            } else if (error.message.includes('Invalid')) {
                 userErrorMessage = `Invalid request sent to AI service: ${error.message.split('.')[0]}.`;
            } else if (JSON.stringify(error).includes('SAFETY')) {
                 userErrorMessage = "Sorry, your request or the response was blocked due to safety settings.";
            }
        }

        return { error: userErrorMessage };
    }
}
