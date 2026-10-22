import * as pdfjsLib from 'pdfjs-dist';
import type { Transaction } from '@/lib/types';

// Browser-side PDF text extraction. No AI model or server API is used.
// Scanned/image-only PDFs need OCR, which is not implemented in this parser.
pdfjsLib.GlobalWorkerOptions.workerSrc = typeof window === 'undefined'
  ? new URL('../../../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url).toString()
  : new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

const DATE_PATTERN = /^(\d{2}[/-]\d{2}[/-]\d{4}|\d{4}[/-]\d{2}[/-]\d{2})$/;
const AMOUNT_PATTERN = /^\(?-?\d[\d,]*(?:\.\d{1,2})?\)?$/;

function parseDate(value: string): string | null {
  const trimmed = value.trim();
  if (!DATE_PATTERN.test(trimmed)) return null;
  const parts = trimmed.split(/[/-]/).map(Number);
  const [year, month, day] = parts[0] > 31 ? parts : [parts[2], parts[1], parts[0]];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date.toISOString();
}

function parseAmount(value: string): number | null {
  if (!AMOUNT_PATTERN.test(value)) return null;
  const parsed = Number(value.replace(/,/g, '').replace(/[()]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseReference(description: string): string | undefined {
  const patterns = [
    /\bUPI\/(?:CR|DR)\/([A-Z0-9-]{8,})/i,
    /\bIMPS[A-Z-]*\/([A-Z0-9-]{8,})/i,
    /\bNEFT[A-Z-]*\/([A-Z0-9-]{8,})/i,
    /\bRTGS\s+(?:TO|FROM)\s+([0-9]{8,})/i,
    /\bATM(?:\s+WDR)?\s+([0-9]{8,})/i,
  ];
  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match?.[1]) return match[1];
  }
  return undefined;
}

export async function extractStatementAccountNumberFromPdf(pdfDataUri: string): Promise<string | null> {
  const base64 = pdfDataUri.includes(',') ? pdfDataUri.slice(pdfDataUri.indexOf(',') + 1) : pdfDataUri;
  const bytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0));
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  const page = await pdf.getPage(1);
  const content = await page.getTextContent();
  const text = content.items
    .filter((item: any) => typeof item.str === 'string')
    .map((item: any) => item.str)
    .join(' ');
  const match = text.match(/Statement\\s+of\\s+Account\\s*:?\\s*([0-9]{6,})/i);
  return match?.[1] ?? null;
}

export async function extractTransactionsFromPdf(pdfDataUri: string, accountId = 'unknown'): Promise<Transaction[]> {
  try {
    const base64 = pdfDataUri.includes(',') ? pdfDataUri.slice(pdfDataUri.indexOf(',') + 1) : pdfDataUri;
    const bytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0));
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
    const transactions: Transaction[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const items = content.items
        .filter((item: any) => typeof item.str === 'string' && Array.isArray(item.transform))
        .map((item: any) => ({ text: item.str.trim(), x: item.transform[4], y: item.transform[5] }))
        .filter(item => item.text.length > 0)
        .sort((a, b) => Math.abs(b.y - a.y) > 2 ? b.y - a.y : a.x - b.x);

      const rows: Array<{ y: number; cells: typeof items }> = [];
      for (const item of items) {
        let row = rows.find(candidate => Math.abs(candidate.y - item.y) <= 2);
        if (!row) { row = { y: item.y, cells: [] }; rows.push(row); }
        row.cells.push(item);
      }

      let currentTransaction: Transaction | undefined;
      let lastTransactionRowY: number | undefined;

      for (const row of rows) {
        const cells = row.cells.sort((a, b) => a.x - b.x);
        const dateIndex = cells.findIndex(cell => Boolean(parseDate(cell.text)));
        if (dateIndex < 0) {
          // Bank statements commonly wrap long remarks onto the next visual line.
          // Append only nearby text from the remarks column; never carry it across
          // transaction rows or page boundaries.
          if (currentTransaction && lastTransactionRowY !== undefined &&
              Math.abs(row.y - lastTransactionRowY) <= 12) {
            const continuation = cells
              .filter(cell => cell.x >= 330)
              .map(cell => cell.text)
              .filter(text => text && !/^page\\s+\\d+$/i.test(text) && !/^date:/i.test(text))
              .join(' ')
              .trim();
            if (continuation) {
              currentTransaction.description = `${currentTransaction.description} ${continuation}`.trim();
              lastTransactionRowY = row.y;
            }
          }
          continue;
        }
        const date = parseDate(cells[dateIndex].text);
        if (!date) continue;
        const trailing = cells.slice(dateIndex + 1).map(cell => cell.text);
        const typeIndex = trailing.findIndex(value => /^(CR|DR|CREDIT|DEBIT)$/i.test(value));
        const amountCandidates = trailing.map((value, index) => ({ value, index, amount: parseAmount(value) }))
          .filter(candidate => candidate.amount !== null);
        if (!amountCandidates.length) continue;
        const amountCell = typeIndex >= 0
          ? amountCandidates.find(candidate => candidate.index < typeIndex) ?? amountCandidates[0]
          : amountCandidates[0];
        if (amountCell.amount === null) continue;
        const description = trailing.filter((value, index) =>
          index !== amountCell.index && !/^(CR|DR|CREDIT|DEBIT)$/i.test(value) && parseAmount(value) === null
        ).join(' ').trim();
        if (!description) continue;
        const direction = typeIndex >= 0 ? trailing[typeIndex].toLowerCase() : '';
        const debit = direction === 'dr' || direction === 'debit' || (!direction && amountCell.amount < 0);
        const amount = Math.abs(amountCell.amount) * (debit ? -1 : 1);
        // Keep repeated same-day payments: identical descriptions and amounts can be
        // legitimate separate bank transactions, not extraction duplicates.
        const transaction: Transaction = {
          id: `pdf-${pageNumber}-${transactions.length}-${date.slice(0, 10)}`,
          accountId, date, description, amount, type: debit ? 'debit' : 'credit', reference: parseReference(description),
        };
        transactions.push(transaction);
        currentTransaction = transaction;
        lastTransactionRowY = row.y;
      }
    }
    if (!transactions.length) {
      throw new Error('No transaction rows could be confidently parsed. This PDF may be scanned, encrypted, or use an unsupported layout; OCR is not available yet.');
    }
    return transactions.sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    console.error('PDF Parsing Error:', error);
    if (error instanceof Error && error.message.startsWith('No transaction rows')) throw error;
    throw new Error('Could not read this PDF. Check that it is not password-protected or corrupted.');
  }
}
