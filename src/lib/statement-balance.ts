import type { Transaction } from '@/lib/types';

export type TransactionWithBalance = Transaction & { balance: number };

type IndexedTransaction = { tx: Transaction; index: number; time: number };

const deltaPaise = (tx: Transaction): number => {
  const amountPaise = Math.round(Math.abs(tx.amount) * 100);
  return tx.type === 'debit' ? -amountPaise : amountPaise;
};

const validBalancePaise = (tx: Transaction): number | undefined => {
  if (typeof tx.balanceAfter !== 'number' || !Number.isFinite(tx.balanceAfter)) return undefined;
  return Math.round(tx.balanceAfter * 100);
};

/**
 * Calculate balances for the statement screen. Prefer balances extracted from
 * the bank statement itself; use those as anchors for rows without source data.
 * If no source balances exist (legacy/manual data), rewind from account.balance
 * and calculate using integer paise to avoid floating-point drift.
 */
export function calculateStatementBalances(
  transactions: Transaction[],
  accountId: string,
  accountBalance: number,
  fromDate: Date,
  toDate: Date,
): TransactionWithBalance[] {
  const fromTime = fromDate.getTime();
  const toTime = toDate.getTime();
  if (!Number.isFinite(fromTime) || !Number.isFinite(toTime) || fromTime > toTime) return [];

  // The PNB statement import preserves source order (newest first) for rows
  // that share a date. Reverse that order only while calculating chronologically.
  const chronological: IndexedTransaction[] = transactions
    .map((tx, index) => ({ tx, index, time: new Date(tx.date).getTime() }))
    .filter(({ tx, time }) => tx.accountId === accountId && Number.isFinite(time))
    .sort((a, b) => a.time - b.time || b.index - a.index);

  if (!chronological.length) return [];

  const balances: Array<number | undefined> = chronological.map(({ tx }) => validBalancePaise(tx));
  const hasSourceBalances = balances.some(value => value !== undefined);

  if (hasSourceBalances) {
    // Fill missing rows from the nearest earlier source balance, or work
    // backwards from the nearest later source balance when no earlier anchor exists.
    for (let i = 0; i < chronological.length; i++) {
      if (balances[i] !== undefined) continue;
      let previous = i - 1;
      while (previous >= 0 && balances[previous] === undefined) previous--;
      if (previous >= 0) {
        let balance = balances[previous] as number;
        for (let j = previous + 1; j <= i; j++) balance += deltaPaise(chronological[j].tx);
        balances[i] = balance;
        continue;
      }
      let next = i + 1;
      while (next < chronological.length && balances[next] === undefined) next++;
      if (next < chronological.length) {
        let balance = balances[next] as number;
        for (let j = next; j > i; j--) balance -= deltaPaise(chronological[j].tx);
        balances[i] = balance;
      }
    }
    // If the imported history has no balance anchor near a leading segment,
    // leave the fallback to the account closing balance below.
    if (balances.some(value => value === undefined)) {
      const fallback = Math.round(accountBalance * 100) - chronological
        .filter(({ time }) => time >= fromTime)
        .reduce((sum, item) => sum + deltaPaise(item.tx), 0);
      let running = fallback;
      for (let i = 0; i < chronological.length; i++) {
        if (chronological[i].time < fromTime) continue;
        if (balances[i] === undefined) {
          running += deltaPaise(chronological[i].tx);
          balances[i] = running;
        } else {
          running = balances[i] as number;
        }
      }
    }
  } else {
    // Legacy transactions do not contain source running balances.
    const openingBalance = Math.round(accountBalance * 100) - chronological
      .filter(({ time }) => time >= fromTime)
      .reduce((sum, item) => sum + deltaPaise(item.tx), 0);
    let running = openingBalance;
    for (let i = 0; i < chronological.length; i++) {
      // openingBalance is already the balance immediately before fromDate;
      // do not replay transactions that happened before the selected period.
      if (chronological[i].time < fromTime) continue;
      running += deltaPaise(chronological[i].tx);
      balances[i] = running;
    }
  }

  const result = chronological
    .map((item, index) => ({ ...item.tx, balance: (balances[index] ?? 0) / 100, _sourceIndex: item.index, _time: item.time }))
    .filter(item => item._time >= fromTime && item._time <= toTime)
    // Show newest rows first, preserving the original imported order on date ties.
    .sort((a, b) => b._time - a._time || a._sourceIndex - b._sourceIndex)
    .map(({ _sourceIndex, _time, ...tx }) => tx);

  return result;
}
