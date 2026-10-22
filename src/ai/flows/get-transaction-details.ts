'use server';

/**
 * @fileOverview A Genkit flow for retrieving transaction details based on user query.
 * 
 * - getTransactionDetails - A function that retrieves transaction details.
 * - GetTransactionDetailsInput - The input type for the getTransactionDetails function.
 * - GetTransactionDetailsOutput - The return type for the getTransactionDetails function.
 * @deprecated This flow is now part of the more comprehensive agent-chat-flow.ts
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetTransactionDetailsInputSchema = z.object({
  transactionQuery: z
    .string()
    .describe('The query to use to find transaction details.'),
  transactions: z.array(z.object({
    id: z.string(),
    date: z.string(),
    description: z.string(),
    amount: z.number(),
    type: z.string()
  })).describe('Array of transactions to search through.'),
});
export type GetTransactionDetailsInput = z.infer<typeof GetTransactionDetailsInputSchema>;

const GetTransactionDetailsOutputSchema = z.object({
  transactionDetails: z.string().describe('Details of the transactions found.'),
});
export type GetTransactionDetailsOutput = z.infer<typeof GetTransactionDetailsOutputSchema>;

export async function getTransactionDetails(input: GetTransactionDetailsInput): Promise<GetTransactionDetailsOutput> {
  return getTransactionDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getTransactionDetailsPrompt',
  input: {schema: GetTransactionDetailsInputSchema},
  output: {schema: GetTransactionDetailsOutputSchema},
  prompt: `You are a banking customer service agent.
  Based on the user's query, extract the relevant transaction details from the provided transactions.
  If no relevant transactions are found, respond with a message saying that no transactions were found.

  User Query: {{{transactionQuery}}}

  Transactions: {{transactions}}
  `,
});

const getTransactionDetailsFlow = ai.defineFlow(
  {
    name: 'getTransactionDetailsFlow',
    inputSchema: GetTransactionDetailsInputSchema,
    outputSchema: GetTransactionDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
