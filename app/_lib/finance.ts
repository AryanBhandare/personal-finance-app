type Trx = { amount: number; date: string };

export type MonthlyTotals = {
  /** "2024-08" */
  month: string;
  /** "Aug 2024" */
  label: string;
  income: number;
  expenses: number;
  net: number;
};

const round = (n: number) => Math.round(n * 100) / 100;

// Income and spending for the most recent month that has transactions.
// Using the latest active month (rather than today's month) keeps the
// figures meaningful for accounts whose activity isn't current, like the
// demo data. Months are computed in UTC so they don't shift by time zone.
export function latestMonthTotals(
  transactions: Trx[] | undefined,
  now: Date = new Date(),
): MonthlyTotals {
  const txs = transactions ?? [];
  const month = txs.length
    ? txs
        .map((t) => t.date.slice(0, 7))
        .sort()
        .at(-1)!
    : now.toISOString().slice(0, 7);

  let income = 0;
  let expenses = 0;
  for (const t of txs) {
    if (t.date.slice(0, 7) !== month) continue;
    if (t.amount > 0) income += t.amount;
    else expenses += -t.amount;
  }

  const [year, mm] = month.split("-").map(Number);
  const label = new Date(Date.UTC(year, mm - 1, 1)).toLocaleString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  return {
    month,
    label,
    income: round(income),
    expenses: round(expenses),
    net: round(income - expenses),
  };
}
