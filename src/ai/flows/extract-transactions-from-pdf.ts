import * as pdfjsLib from 'pdfjs-dist';
import { Transaction } from '@/lib/types';

// Configure the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function extractTransactionsFromPdf(pdfDataUri: string): Promise<Transaction[]> {
    try {
        const loadingTask = pdfjsLib.getDocument(pdfDataUri);
        const pdf = await loadingTask.promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + ' ';
        }

        // Simple regex-based parsing to extract transactions. 
        // NOTE: This assumes a specific PNB PDF format. 
        // In a real app, this would need to be robust to the actual PNB PDF structure.
        const transactions: Transaction[] = [];
        
        // Example regex: matching date, description, amount
        // This is highly dependent on the PDF structure
        const regex = /(\d{2}\/\d{2}\/\d{4})\s+(.*?)\s+(-?\d+\.\d{2})/g;
        let match;
        
        while ((match = regex.exec(fullText)) !== null) {
            transactions.push({
                id: `txn-${Date.now()}-${transactions.length}`,
                accountId: 'unknown',
                date: new Date(match[1].split('/').reverse().join('-')).toISOString(),
                description: match[2].trim(),
                amount: parseFloat(match[3]),
                type: parseFloat(match[3]) >= 0 ? 'credit' : 'debit',
            });
        }
        
        return transactions;
    } catch (error) {
        console.error("PDF Parsing Error:", error);
        throw new Error("Failed to parse PDF text content.");
    }
}
