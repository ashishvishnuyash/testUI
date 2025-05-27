// This file implements the Genkit flow for improving a given prompt.
// It defines the input and output schemas for the flow, and the flow itself.
// The flow takes a prompt as input and returns an improved version of the prompt.

'use server';

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const ImprovePromptInputSchema = z.object({
  prompt: z.string().describe('The prompt to be improved.'),
});

export type ImprovePromptInput = z.infer<typeof ImprovePromptInputSchema>;

const ImprovePromptOutputSchema = z.object({
  improvedPrompt: z.string().describe('The improved prompt.'),
});

export type ImprovePromptOutput = z.infer<typeof ImprovePromptOutputSchema>;

export async function improvePrompt(input: ImprovePromptInput): Promise<ImprovePromptOutput> {
  return improvePromptFlow(input);
}

const improvePromptPrompt = ai.definePrompt({
  name: 'improvePromptPrompt',
  input: {
    schema: z.object({
      prompt: z.string().describe('The prompt to be improved.'),
    }),
  },
  output: {
    schema: z.object({
      improvedPrompt: z.string().describe('The improved prompt.'),
    }),
  },
  prompt: `You are an AI prompt engineer. Your task is to improve the given prompt to get better results from an AI model.

Original Prompt: {{{prompt}}}

Improved Prompt:`,
});

const improvePromptFlow = ai.defineFlow<
  typeof ImprovePromptInputSchema,
  typeof ImprovePromptOutputSchema
>({
  name: 'improvePromptFlow',
  inputSchema: ImprovePromptInputSchema,
  outputSchema: ImprovePromptOutputSchema,
},
async input => {
  const {output} = await improvePromptPrompt(input);
  return output!;
});
