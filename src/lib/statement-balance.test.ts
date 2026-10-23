import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Transaction } from './types';
import { calculateStatementBalances } from './statement-balance';

const accountId = 'pnb-test-account';
const date = '2026-06-02T00:00:00.000Z';
const sourceRows: Array<Pick<Transaction, 'description' | 'amount' | 'type' | 'balanceAfter'>> = [
  { description: 'Debit 145', amount: -145, type: 'debit', balanceAfter: 7598.81 },
  { description: 'Debit 131', amount: -131, type: 'debit', balanceAfter: 7743.81 },
  { description: 'Debit 380', amount: -380, type: 'debit', balanceAfter: 7874.81 },
  { description: 'Debit 8000', amount: -8000, type: 'debit', balanceAfter: 8254.81 },
  { description: 'Credit 12000', amount: 12000, type: 'credit', balanceAfter: 16254.81 },
  { description: 'Debit 235', amount: -235, type: 'debit', balanceAfter: 4254.81 },
];
const makeTransactions = (withBalances: boolean): Transaction[] => sourceRows.map((row, index) => ({
  id: String(index), accountId, date, description: row.description, amount: row.amount, type: row.type,
  ...(withBalances && row.balanceAfter !== undefined ? { balanceAfter: row.balanceAfter } : {}),
}));
const getBalances = (transactions: Transaction[], accountBalance = 7598.81) => calculateStatementBalances(
  transactions, accountId, accountBalance, new Date('2026-06-02T00:00:00.000Z'), new Date('2026-06-02T23:59:59.999Z'),
).map(tx => [tx.description, tx.balance]);
const expected = [
  ['Debit 145', 7598.81], ['Debit 131', 7743.81], ['Debit 380', 7874.81],
  ['Debit 8000', 8254.81], ['Credit 12000', 16254.81], ['Debit 235', 4254.81],
];

describe('PNB statement running balances', () => {
  it('uses each balance extracted from the statement as the source of truth', () => {
    assert.deepEqual(getBalances(makeTransactions(true)), expected);
  });
  it('reconstructs the screenshot sequence from a valid closing balance when source balances are absent', () => {
    assert.deepEqual(getBalances(makeTransactions(false)), expected);
  });
  it('reconstructs missing row balances backwards from the nearest statement balance anchor', () => {
    const rows = makeTransactions(false);
    rows[0].balanceAfter = 7598.81;
    assert.deepEqual(getBalances(rows), expected);
  });
  it('does not replay transactions before the selected date range in legacy data', () => {
    const rows = makeTransactions(false).map((tx, index) => ({ ...tx, date: new Date(Date.parse(date) + index * 86400000).toISOString() }));
    // Closing balance 7598.81 is after the last (latest-date) source row.
    const result = calculateStatementBalances(rows, accountId, 7598.81, new Date('2026-06-05T00:00:00.000Z'), new Date('2026-06-06T23:59:59.999Z'));
    assert.deepEqual(result.map(tx => tx.balance), [7833.81, -4166.19]);
  });
  it('excludes transactions belonging to another account', () => {
    const rows = makeTransactions(true);
    rows.push({ id: 'other', accountId: 'other-account', date, description: 'Other account', amount: 99999, type: 'credit', balanceAfter: 99999 });
    assert.deepEqual(getBalances(rows), expected);
  });
  it('returns only rows inside the requested date range while retaining their statement balances', () => {
    const rows = makeTransactions(true).map((tx, index) => ({ ...tx, date: new Date(Date.parse(date) + index * 86400000).toISOString() }));
    const result = calculateStatementBalances(rows, accountId, 7598.81, new Date('2026-06-04T00:00:00.000Z'), new Date('2026-06-05T23:59:59.999Z'));
    assert.deepEqual(result.map(tx => tx.balance), [8254.81, 7874.81]);
  });
});
