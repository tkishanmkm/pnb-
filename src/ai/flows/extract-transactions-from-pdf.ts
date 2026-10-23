import type { Transaction } from '@/lib/types';

// Load PDF.js only when extraction is requested; eager worker initialization
// can crash iOS browsers before Settings renders.
async function loadPdfJs() {
  const pdfjsLib = await import('pdfjs-dist');
  if (typeof window !== 'undefined') {
    // Resolve against the active origin so iOS Safari/Chrome doesn't interpret
    // the worker URL relative to a nested route or query string.
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('/pdf.worker.min.mjs', window.location.origin).href;
  }
  return pdfjsLib;
}

async function openPdfDocument(pdfjsLib: typeof import('pdfjs-dist'), bytes: Uint8Array) {
  // Avoid eval-based font compilation and use browser fonts where available;
  // both settings are safer across WebKit and do not weaken PDF parsing.
  return pdfjsLib.getDocument({ data: bytes, useSystemFonts: true, isEvalSupported: false, useWorkerFetch: false }).promise;
}
// Scanned/image-only PDFs need OCR; unsupported layouts are reported.

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
  const pdfjsLib = await loadPdfJs();
  const pdf = await openPdfDocument(pdfjsLib, bytes);
  const page = await pdf.getPage(1);
  const content = await page.getTextContent();
  const text = content.items
    .map(item => 'str' in item && typeof item.str === 'string' ? item.str : '')
    .join(' ');
  const match = text.match(/Statement\s+of\s+Account\s*:?\s*([0-9]{6,})/i);
  return match?.[1] ?? null;
}

export interface ExtractedStatementDetails {
  accountNumber: string | null;
  accountHolder: string;
  customerAddress: string;
  customerCity: string;
  customerPin: string;
  branchName: string;
  branchAddress: string;
  branchCity: string;
  branchPin: string;
  ifsc: string;
  micrCode: string;
  customerId: string;
  ckycNumber: string;
  nominee: string;
  accountType: 'Savings' | 'Current';
  closingBalance: number | null;
}

export async function extractStatementDetailsFromPdf(pdfDataUri: string): Promise<ExtractedStatementDetails> {
  const base64 = pdfDataUri.includes(',') ? pdfDataUri.slice(pdfDataUri.indexOf(',') + 1) : pdfDataUri;
  const bytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0));
  const pdfjsLib = await loadPdfJs();
  const pdf = await openPdfDocument(pdfjsLib, bytes);
  const lines: string[] = [];
  const allRows: Array<{ page: number; y: number; cells: Array<{ text: string; x: number; y: number }> }> = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const items = content.items
      .map(item => {
        if (!('str' in item) || typeof item.str !== 'string' || !('transform' in item) || !Array.isArray(item.transform)) return null;
        const transform = item.transform as number[];
        return { text: item.str.trim(), x: transform[4] ?? 0, y: transform[5] ?? 0 };
      })
      .filter((item): item is { text: string; x: number; y: number } => Boolean(item && item.text));
    const rows: Array<{ y: number; cells: Array<{ text: string; x: number; y: number }> }> = [];
    for (const item of items) {
      let row = rows.find(candidate => Math.abs(candidate.y - item.y) <= 2);
      if (!row) { row = { y: item.y, cells: [] }; rows.push(row); }
      row.cells.push(item);
    }
    rows.sort((a, b) => b.y - a.y).forEach(row => {
      const sortedCells = row.cells.sort((a, b) => a.x - b.x);
      const line = sortedCells.map(cell => cell.text).join(' ').replace(/\s+/g, ' ').trim();
      if (line) lines.push(line);
      allRows.push({ page: pageNumber, y: row.y, cells: sortedCells.map(cell => ({ text: cell.text, x: cell.x, y: cell.y })) });
    });
  }
  const text = lines.join('\n');
  const branchStartIndex = lines.findIndex(line => /branch details/i.test(line));
  const branchStart = Math.max(0, branchStartIndex);
  const customerStart = lines.findIndex(line => /customer details/i.test(line));
  const statementStart = lines.findIndex(line => /statement of account/i.test(line));
  const get = (labels: string[], section: 'branch' | 'customer' | 'all' = 'all') => {
    const from = section === 'branch' ? branchStart : section === 'customer' && customerStart >= 0 ? customerStart : 0;
    const to = section === 'branch' && customerStart > from ? customerStart : section === 'customer' && statementStart > from ? statementStart : lines.length;
    for (const line of lines.slice(from, to)) {
      for (const label of labels) {
        const escaped = label.replace(/[.*+?^()|[\]\\]/g, '\\$&');
        const match = line.match(new RegExp('(?:^|\\s)' + escaped + '\\s*[:\\-]?\\s*(.*?)\\s*$', 'i'));
        if (match && match[1] && match[1].trim()) {
          const value = match[1].trim().replace(/\s{2,}/g, ' ');
          if (!/^(?:branch details|customer details|statement of account)$/i.test(value)) return value;
        }
      }
    }
    return '';
  };
  const accountMatch = text.match(/(?:Statement\s+of\s+Account|Account\s+(?:Number|No\.?))\s*:?\s*([0-9][0-9\s-]{5,})/i);
  const customerPin = get(['Pin', 'PIN Code', 'Pin Code'], 'customer').match(/\d{6}/);
  const branchPin = get(['Pin', 'PIN Code', 'Pin Code'], 'branch').match(/\d{6}/);
  const ifsc = text.match(/\bIFSC(?:\s+Code)?\s*[:\-]?\s*([A-Z]{4}0[A-Z0-9]{6})\b/i);
  const micr = text.match(/\bMICR(?:\s+Code)?\s*[:\-]?\s*(\d{9})\b/i);
  const balanceMatch = text.match(/(?:closing|available|ledger|account)\s+balance(?:\s+as\s+on\s+[^:\n]+)?\s*[:\-]?\s*(?:INR|Rs\.?|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i)
    || text.match(/balance\s+at\s+the\s+end\s+of\s+the\s+statement\s*[:\-]?\s*(?:INR|Rs\.?|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i);
  const explicitBalance = balanceMatch?.[1] ? Number(balanceMatch[1].replace(/,/g, '')) : null;
  const balanceHeader = allRows.find(row =>
    row.cells.some(cell => /\bbalance\b/i.test(cell.text)) &&
    row.cells.some(cell => /\bdate\b/i.test(cell.text))
  );
  const balanceColumnX = balanceHeader?.cells.find(cell => /\bbalance\b/i.test(cell.text))?.x;
  const rowBalances = balanceColumnX === undefined ? [] : allRows.flatMap(row => {
    const dateCell = row.cells.find(cell => parseDate(cell.text) !== null);
    if (!dateCell) return [];
    const numericCells = row.cells.map(cell => {
      const normalized = cell.text.replace(/,/g, '').replace(/(?:CR|DR)$/i, '').trim();
      return { cell, value: /^-?\d+(?:\.\d{1,2})?$/.test(normalized) ? Number(normalized) : null };
    }).filter((item): item is { cell: { text: string; x: number; y: number }; value: number } =>
      item.value !== null && Number.isFinite(item.value) && item.cell.x >= balanceColumnX - 45
    ).sort((a, b) => Math.abs(a.cell.x - balanceColumnX) - Math.abs(b.cell.x - balanceColumnX));
    return numericCells.length ? [{ date: parseDate(dateCell.text) || dateCell.text, balance: numericCells[0].value }] : [];
  });
  const latestBalance = rowBalances.sort((a, b) => b.date.localeCompare(a.date))[0]?.balance ?? null;
  const balance = explicitBalance !== null && Number.isFinite(explicitBalance) ? explicitBalance : latestBalance;
  return {
    accountNumber: accountMatch?.[1]?.replace(/\D/g, '') ?? null,
    accountHolder: get(['Customer Name', 'Account Holder Name', 'Name of Customer'], 'customer'),
    customerAddress: get(['Customer Address', 'Communication Address', 'Mailing Address', 'Address'], 'customer'),
    customerCity: get(['Customer City', 'City'], 'customer'),
    customerPin: customerPin?.[0] ?? '',
    branchName: get(['Branch Name'], 'branch'),
    branchAddress: get(['Branch Address'], 'branch'),
    branchCity: get(['Branch City', 'City'], 'branch'),
    branchPin: branchPin?.[0] ?? '',
    ifsc: ifsc?.[1] ?? '',
    micrCode: micr?.[1] ?? '',
    customerId: get(['Customer ID', 'Customer Id', 'CIF ID', 'CIF Number'], 'customer'),
    ckycNumber: get(['CKYC Number', 'CKYC No'], 'customer'),
    nominee: get(['Nominee Name', 'Nominee'], 'customer'),
    accountType: /\bcurrent\s+account\b/i.test(text) ? 'Current' : 'Savings',
    closingBalance: balance !== null && Number.isFinite(balance) ? balance : null,
  };
}

export async function extractTransactionsFromPdf(pdfDataUri: string, accountId = 'unknown'): Promise<Transaction[]> {
  try {
    const base64 = pdfDataUri.includes(',') ? pdfDataUri.slice(pdfDataUri.indexOf(',') + 1) : pdfDataUri;
    const bytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0));
    const pdfjsLib = await loadPdfJs();
  const pdf = await openPdfDocument(pdfjsLib, bytes);
    const transactions: Transaction[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const items = content.items
        .map(item => {
          if (!('str' in item) || typeof item.str !== 'string' ||
              !('transform' in item) || !Array.isArray(item.transform)) return null;
          const transform = item.transform as number[];
          return { text: item.str.trim(), x: transform[4] ?? 0, y: transform[5] ?? 0 };
        })
        .filter((item): item is { text: string; x: number; y: number } => item !== null && item.text.length > 0)
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
              .filter(text => text && !/^page\s+\d+$/i.test(text) && !/^date:/i.test(text))
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
