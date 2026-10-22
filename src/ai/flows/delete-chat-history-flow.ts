'use server';

/**
 * @fileOverview A flow that deletes the chat history.
 *
 * - deleteChatHistory - A function that deletes the chat history.
 * - DeleteChatHistoryInput - The input type for the deleteChatHistory function.
 * - DeleteChatHistoryOutput - The return type for the deleteChatHistory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DeleteChatHistoryInputSchema = z.object({
  confirmation: z
    .boolean()
    .describe('Whether the user has confirmed the deletion of the chat history.'),
});
export type DeleteChatHistoryInput = z.infer<typeof DeleteChatHistoryInputSchema>;

const DeleteChatHistoryOutputSchema = z.object({
  success: z.boolean().describe('Whether the chat history was successfully deleted.'),
});
export type DeleteChatHistoryOutput = z.infer<typeof DeleteChatHistoryOutputSchema>;

export async function deleteChatHistory(input: DeleteChatHistoryInput): Promise<DeleteChatHistoryOutput> {
  return deleteChatHistoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'deleteChatHistoryPrompt',
  input: {schema: DeleteChatHistoryInputSchema},
  output: {schema: DeleteChatHistoryOutputSchema},
  prompt: `You are a helpful assistant that confirms the deletion of chat history.

  The user has requested to delete the chat history. If the user confirms, then you should set success to true. Otherwise, set it to false.

  User confirmation: {{{confirmation}}}
  `,
});

const deleteChatHistoryFlow = ai.defineFlow(
  {
    name: 'deleteChatHistoryFlow',
    inputSchema: DeleteChatHistoryInputSchema,
    outputSchema: DeleteChatHistoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

