'use server';
/**
 * @fileOverview Summarizes a chat thread for quick catch-up.
 *
 * - summarizeChatThread - A function to summarize a chat thread.
 * - SummarizeChatThreadInput - The input type for the summarizeChatThread function.
 * - SummarizeChatThreadOutput - The return type for the summarizeChatThread function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SummarizeChatThreadInputSchema = z.object({
  chatThread: z.string().describe('The complete chat thread to summarize.'),
});
export type SummarizeChatThreadInput = z.infer<typeof SummarizeChatThreadInputSchema>;

const SummarizeChatThreadOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the chat thread.'),
});
export type SummarizeChatThreadOutput = z.infer<typeof SummarizeChatThreadOutputSchema>;

export async function summarizeChatThread(input: SummarizeChatThreadInput): Promise<SummarizeChatThreadOutput> {
  return summarizeChatThreadFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeChatThreadPrompt',
  input: {
    schema: z.object({
      chatThread: z.string().describe('The complete chat thread to summarize.'),
    }),
  },
  output: {
    schema: z.object({
      summary: z.string().describe('A concise summary of the chat thread.'),
    }),
  },
  prompt: `Summarize the following chat thread. Be concise and focus on the main points discussed.  Do not be conversational.

Chat Thread:
{{chatThread}}`,
});

const summarizeChatThreadFlow = ai.defineFlow<
  typeof SummarizeChatThreadInputSchema,
  typeof SummarizeChatThreadOutputSchema
>({
  name: 'summarizeChatThreadFlow',
  inputSchema: SummarizeChatThreadInputSchema,
  outputSchema: SummarizeChatThreadOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
