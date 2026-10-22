
'use server';

/**
 * @fileOverview A flow to extract transactions from a PDF bank statement and add them to the application state.
 *
 * - extractTransactionsFromPdf - A function that handles the PDF transaction extraction process.
 * - ExtractTransactionsFromPdfInput - The input type for the extractTransactionsFromPdf function.
 * - ExtractTransactionsFromPdfOutput - The return type for the extractTransactionsFromPdf function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTransactionsFromPdfInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF bank statement as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  transactionHistory: z.array(z.object({
    id: z.string(),
    date: z.string(),
    description: z.string(),
    amount: z.number(),
    type: z.string()
  })).optional().describe('The existing transaction history, to avoid duplicates.'),
  startDate: z.string().optional().describe('The start date of the transaction history to update, if provided, only update transactions after this date.'),
  endDate: z.string().optional().describe('The end date of the transaction history to update, if provided, only update transactions before this date.')
});
export type ExtractTransactionsFromPdfInput = z.infer<typeof ExtractTransactionsFromPdfInputSchema>;

const SingleTransactionSchema = z.object({
    id: z.string().optional(),
    date: z.string().optional(),
    description: z.string().optional(),
    amount: z.number().optional(),
    type: z.string().optional()
});

const ExtractTransactionsFromPdfOutputSchema = z.array(SingleTransactionSchema);
export type ExtractTransactionsFromPdfOutput = z.infer<typeof ExtractTransactionsFromPdfOutputSchema>;

export async function extractTransactionsFromPdf(
  input: ExtractTransactionsFromPdfInput
): Promise<ExtractTransactionsFromPdfOutput> {
  return extractTransactionsFromPdfFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractTransactionsFromPdfPrompt',
  input: {schema: ExtractTransactionsFromPdfInputSchema},
  output: {schema: ExtractTransactionsFromPdfOutputSchema},
  prompt: `You are an expert in extracting transaction data from bank statements. You will receive a bank statement in PDF format as a data URI. Your task is to extract all transaction details from the PDF and return them as a JSON array of transaction objects.

Each transaction object MUST have the following fields:
- id: A unique identifier for the transaction (you MUST generate this, e.g., "transaction-1", "transaction-2", etc.).
- date: The date of the transaction. If the time is available, return it in YYYY-MM-DDTHH:mm:ss format. If time is not available, return only the date in YYYY-MM-DD format. All dates and times should be in Indian Standard Time (IST, GMT+5:30).
- description: A description of the transaction.
- amount: The transaction amount (as a number, positive for credits, negative for debits).
- type: The type of transaction. You MUST set this to "credit" if the amount is positive, and "debit" if the amount is negative.

CRITICAL: Ensure every single transaction object in the output array has all five required fields: id, date, description, amount, and type. If you encounter a malformed or incomplete entry in the source document, you MUST discard it and not include it in the output.

If startDate and/or endDate are provided, only extract transactions within that date range (inclusive). Do not include transactions outside of the specified date range.

If existing transactionHistory is provided, make sure that the extracted transactions are merged with the existing history without including duplicates.

PDF Data: {{media url=pdfDataUri}}
Existing Transaction History: {{transactionHistory}}
Start Date: {{startDate}}
End Date: {{endDate}}`,
});

const extractTransactionsFromPdfFlow = ai.defineFlow(
  {
    name: 'extractTransactionsFromPdfFlow',
    inputSchema: ExtractTransactionsFromPdfInputSchema,
    outputSchema: ExtractTransactionsFromPdfOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);

    if (!output) {
        return [];
    }
    
    // Data sanitization and validation step
    const sanitizedOutput = output.map((tx, index) => {
        // Ensure all required fields are present
        const id = tx.id || `transaction-${Date.now()}-${index}`;
        const date = tx.date || new Date().toISOString();
        const description = tx.description || 'No description';
        const amount = tx.amount ?? 0;
        const type = tx.type || (amount >= 0 ? 'credit' : 'debit');

        return { id, date, description, amount, type };
    }).filter(tx => tx.amount !== 0); // Filter out transactions with no amount, likely parsing errors

    return sanitizedOutput;
  }
);
