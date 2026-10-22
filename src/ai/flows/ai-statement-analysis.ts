
'use server';

/**
 * @fileOverview A Genkit flow for analyzing a user's bank statement transactions.
 *
 * - analyzeStatement - A function that analyzes transaction history within a date range.
 * - AnalyzeStatementInput - The input type for the analyzeStatement function.
 * - AnalyzeStatementOutput - The return type for the analyzeStatement function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type {Transaction} from '@/lib/types';

const AnalyzeStatementInputSchema = z.object({
  transactionHistory: z.custom<Transaction[]>(),
  startDate: z.string().describe('The start date of the analysis period.'),
  endDate: z.string().describe('The end date of the analysis period.'),
});
export type AnalyzeStatementInput = z.infer<typeof AnalyzeStatementInputSchema>;

const AnalyzeStatementOutputSchema = z.object({
  summary: z.string().describe("A concise summary of the user's spending habits for the period, including total debits, total credits, and top spending categories."),
  insights: z.string().describe('Actionable financial insights based on the transaction history. This could include tips on saving, identifying unusual spending, or potential subscriptions to cancel. Provide at least 2-3 distinct insights.'),
});
export type AnalyzeStatementOutput = z.infer<typeof AnalyzeStatementOutputSchema>;

export async function analyzeStatement(
  input: AnalyzeStatementInput
): Promise<AnalyzeStatementOutput> {
  return analyzeStatementFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeStatementPrompt',
  input: {schema: AnalyzeStatementInputSchema},
  output: {schema: AnalyzeStatementOutputSchema},
  prompt: `You are a helpful financial analyst AI for Punjab National Bank. Your goal is to provide a clear and insightful analysis of a user's bank statement.

Analyze the following transactions for the period from {{startDate}} to {{endDate}}.

Transactions:
{{#each transactionHistory}}
- Date: {{date}}, Amount: {{amount}}, Description: {{description}}, Category: {{category}}, Type: {{type}}
{{/each}}

Based on this data, provide:
1.  **Summary**: A brief overview of their financial activity. Mention total money spent (debits), total money received (credits), and the top 2-3 spending categories by amount.
2.  **Insights**: Provide 2-3 actionable, helpful insights. For example, you could identify recurring subscriptions they might want to review, point out unusually high spending in a category, or suggest ways to save based on their habits. Keep the tone helpful and not judgmental.
`,
});

const analyzeStatementFlow = ai.defineFlow(
  {
    name: 'analyzeStatementFlow',
    inputSchema: AnalyzeStatementInputSchema,
    outputSchema: AnalyzeStatementOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("The AI model did not return a valid analysis.");
    }
    return output;
  }
);
