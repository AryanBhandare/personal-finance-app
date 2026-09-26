import { z } from "zod";

// Pure insight logic: the response schema, the snapshot sent to AI
// providers, and the rule-based fallback. Kept free of server-only imports
// so it can be unit tested.

export const CATEGORIES = [
  "budget",
  "savings",
  "bills",
  "spending",
  "income",
] as const;
export const PRIORITIES = ["high", "medium", "low"] as const;

// Enums are plain strings in the schema (not every provider enforces them),
// then normalised below so one odd value can't fail the whole response.
export const InsightsSchema = z.object({
  summary: z.string(),
  recommendations: z.array(
    z.object({
      title: z.string(),
      detail: z.string(),
      category: z.string().describe(`One of: ${CATEGORIES.join(", ")}`),
      priority: z.string().describe(`One of: ${PRIORITIES.join(", ")}`),
      estimated_monthly_savings: z.number().nullable(),
    }),
  ),
});

export type ParsedInsights = z.infer<typeof InsightsSchema>;

export type Recommendation = {
  title: string;
  detail: string;
  category: (typeof CATEGORIES)[number];
  priority: (typeof PRIORITIES)[number];
  estimated_monthly_savings: number | null;
};

export type InsightsSource = "claude" | "gemini" | "openrouter" | "rules";

export type InsightsResult =
  | {
      ok: true;
      summary: string;
      recommendations: Recommendation[];
      generatedAt: string;
      source: InsightsSource;
      notice?: string;
    }
  | { ok: false; error: string };

export type Trx = {
  name: string;
  category?: string;
  date: string;
  amount: number;
  recurring?: boolean;
};
export type Budget = { category: string; maximum: number };
export type Pot = { name: string; target: number; total: number };
export type Snapshot = ReturnType<typeof buildSnapshot>;

export const round = (n: number) => Math.round(n * 100) / 100;

export function normalise(rec: ParsedInsights["recommendations"][number]) {
  const category = rec.category.toLowerCase();
  const priority = rec.priority.toLowerCase();
  return {
    ...rec,
    category: (CATEGORIES as readonly string[]).includes(category)
      ? (category as Recommendation["category"])
      : "spending",
    priority: (PRIORITIES as readonly string[]).includes(priority)
      ? (priority as Recommendation["priority"])
      : "medium",
  } satisfies Recommendation;
}

export function buildSnapshot(data: {
  balance?: { current: number; income: number; expenses: number };
  transactions?: Trx[];
  budgets?: Budget[];
  pots?: Pot[];
}) {
  const transactions = [...(data.transactions ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  // Budgets are monthly, so compare them against the latest 30 days of
  // activity rather than all-time totals.
  const latest = transactions[0] ? new Date(transactions[0].date).getTime() : 0;
  const windowStart = latest - 30 * 24 * 60 * 60 * 1000;

  const spentByCategory = new Map<string, number>();
  for (const trx of transactions) {
    if (
      trx.amount < 0 &&
      trx.category &&
      new Date(trx.date).getTime() >= windowStart
    ) {
      spentByCategory.set(
        trx.category,
        (spentByCategory.get(trx.category) ?? 0) + Math.abs(trx.amount),
      );
    }
  }

  const recurring = new Map<string, Trx>();
  for (const trx of transactions) {
    if (trx.recurring && !recurring.has(trx.name)) recurring.set(trx.name, trx);
  }

  const budgets = data.budgets ?? [];

  return {
    today: new Date().toISOString().slice(0, 10),
    balance: data.balance,
    budgets: budgets.map((b) => ({
      category: b.category,
      limit: b.maximum,
      spent_last_30_days: round(spentByCategory.get(b.category) ?? 0),
    })),
    unbudgeted_spending_last_30_days: Array.from(spentByCategory.entries())
      .filter(([cat]) => !budgets.some((b) => b.category === cat))
      .map(([category, spent]) => ({ category, spent: round(spent) }))
      .sort((a, b) => b.spent - a.spent),
    pots: (data.pots ?? []).map((p) => ({
      name: p.name,
      saved: p.total,
      target: p.target,
    })),
    recurring_bills: Array.from(recurring.values()).map((t) => ({
      name: t.name,
      amount: Math.abs(t.amount),
      last_paid: t.date.slice(0, 10),
    })),
    recent_transactions: transactions.slice(0, 40).map((t) => ({
      name: t.name,
      category: t.category,
      amount: t.amount,
      date: t.date.slice(0, 10),
    })),
  };
}

export function ruleBasedInsights(snapshot: Snapshot): ParsedInsights {
  const recs: ParsedInsights["recommendations"] = [];
  const { balance, budgets, pots, recurring_bills } = snapshot;

  if (balance && balance.expenses > balance.income) {
    recs.push({
      title: "You're spending more than you earn",
      detail: `Expenses of $${round(balance.expenses)} are above income of $${round(balance.income)}. Look at your largest categories below for places to cut back.`,
      category: "income",
      priority: "high",
      estimated_monthly_savings: round(balance.expenses - balance.income),
    });
  }

  const overBudget = budgets
    .filter((b) => b.limit > 0 && b.spent_last_30_days > b.limit)
    .sort(
      (a, b) =>
        b.spent_last_30_days - b.limit - (a.spent_last_30_days - a.limit),
    );
  for (const b of overBudget.slice(0, 2)) {
    const over = round(b.spent_last_30_days - b.limit);
    recs.push({
      title: `${b.category} is $${over} over budget`,
      detail: `You've spent $${b.spent_last_30_days} against a $${b.limit} limit in the last 30 days. Trim spending here or raise the limit to something realistic.`,
      category: "budget",
      priority: "high",
      estimated_monthly_savings: over,
    });
  }

  const nearLimit = budgets.find(
    (b) =>
      b.limit > 0 &&
      b.spent_last_30_days <= b.limit &&
      b.spent_last_30_days / b.limit >= 0.8,
  );
  if (nearLimit) {
    const pct = Math.round(
      (nearLimit.spent_last_30_days / nearLimit.limit) * 100,
    );
    recs.push({
      title: `${nearLimit.category} budget is ${pct}% used`,
      detail: `Only $${round(nearLimit.limit - nearLimit.spent_last_30_days)} left of your $${nearLimit.limit} ${nearLimit.category} budget. Hold off on extra spending here for now.`,
      category: "budget",
      priority: "medium",
      estimated_monthly_savings: null,
    });
  }

  const topUnbudgeted = snapshot.unbudgeted_spending_last_30_days[0];
  if (topUnbudgeted && topUnbudgeted.spent >= 50) {
    recs.push({
      title: `Set a budget for ${topUnbudgeted.category}`,
      detail: `You spent $${topUnbudgeted.spent} on ${topUnbudgeted.category} in the last 30 days without a budget. A limit makes this easier to keep in check.`,
      category: "spending",
      priority: "medium",
      estimated_monthly_savings: null,
    });
  }

  const behindPot = pots
    .filter((p) => p.target > 0 && p.saved / p.target < 0.5)
    .sort((a, b) => a.saved / a.target - b.saved / b.target)[0];
  if (behindPot) {
    const pct = Math.round((behindPot.saved / behindPot.target) * 100);
    recs.push({
      title: `Top up your ${behindPot.name} pot`,
      detail: `It's ${pct}% of the way to its $${behindPot.target} target. Moving a fixed amount in each month keeps it on track.`,
      category: "savings",
      priority: "low",
      estimated_monthly_savings: null,
    });
  }

  const priciestBill = [...recurring_bills].sort(
    (a, b) => b.amount - a.amount,
  )[0];
  if (priciestBill) {
    recs.push({
      title: `Review your ${priciestBill.name} bill`,
      detail: `At $${round(priciestBill.amount)} it's your largest recurring bill. Check whether a cheaper plan or cancelling makes sense.`,
      category: "bills",
      priority: "low",
      estimated_monthly_savings: null,
    });
  }

  const onTrack =
    overBudget.length === 0 && balance && balance.expenses <= balance.income;
  return {
    summary: onTrack
      ? "You're within your budgets overall. A few small tweaks could help you save more."
      : "Some of your spending is running ahead of your plan. Start with the high-priority items below.",
    recommendations: recs.slice(0, 4),
  };
}
