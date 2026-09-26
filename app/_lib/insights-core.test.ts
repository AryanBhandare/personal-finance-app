import { describe, expect, it } from "vitest";
import {
  buildSnapshot,
  InsightsSchema,
  normalise,
  ruleBasedInsights,
} from "./insights-core";
import demoData from "@/public/data.json";

const day = (n: number) => `2024-08-${String(n).padStart(2, "0")}T12:00:00Z`;

describe("buildSnapshot", () => {
  it("only counts spending from the latest 30 days against budgets", () => {
    const snapshot = buildSnapshot({
      transactions: [
        { name: "Cafe", category: "Dining Out", date: day(30), amount: -40 },
        { name: "Cafe", category: "Dining Out", date: day(10), amount: -20 },
        // More than 30 days before the latest transaction: ignored.
        {
          name: "Cafe",
          category: "Dining Out",
          date: "2024-06-01T12:00:00Z",
          amount: -500,
        },
      ],
      budgets: [{ category: "Dining Out", maximum: 100 }],
    });

    expect(snapshot.budgets).toEqual([
      { category: "Dining Out", limit: 100, spent_last_30_days: 60 },
    ]);
  });

  it("ignores income and lists unbudgeted categories by spend", () => {
    const snapshot = buildSnapshot({
      transactions: [
        { name: "Salary", category: "General", date: day(30), amount: 3000 },
        { name: "Shop", category: "Groceries", date: day(29), amount: -120.5 },
        { name: "Bus", category: "Transportation", date: day(28), amount: -30 },
      ],
      budgets: [],
    });

    expect(snapshot.unbudgeted_spending_last_30_days).toEqual([
      { category: "Groceries", spent: 120.5 },
      { category: "Transportation", spent: 30 },
    ]);
  });

  it("keeps one entry per recurring bill, using the latest payment", () => {
    const snapshot = buildSnapshot({
      transactions: [
        { name: "Gym", date: day(1), amount: -30, recurring: true },
        { name: "Gym", date: day(29), amount: -35, recurring: true },
      ],
    });

    expect(snapshot.recurring_bills).toEqual([
      { name: "Gym", amount: 35, last_paid: "2024-08-29" },
    ]);
  });
});

describe("ruleBasedInsights", () => {
  it("flags over-budget categories first, with the overspend as savings", () => {
    const result = ruleBasedInsights(
      buildSnapshot({
        balance: { current: 1000, income: 3000, expenses: 1000 },
        transactions: [
          { name: "Salary", date: day(1), amount: 3000 },
          {
            name: "Cafe",
            category: "Dining Out",
            date: day(30),
            amount: -204.25,
          },
        ],
        budgets: [{ category: "Dining Out", maximum: 75 }],
      }),
    );

    expect(result.recommendations[0]).toMatchObject({
      title: "Dining Out is $129.25 over budget",
      priority: "high",
      estimated_monthly_savings: 129.25,
    });
  });

  it("warns when the latest month's spending exceeds income", () => {
    const result = ruleBasedInsights(
      buildSnapshot({
        transactions: [
          { name: "Salary", date: day(1), amount: 1000 },
          { name: "Rent", category: "Bills", date: day(2), amount: -1500 },
        ],
      }),
    );

    expect(result.recommendations[0]).toMatchObject({
      category: "income",
      priority: "high",
      estimated_monthly_savings: 500,
    });
    expect(result.recommendations[0].detail).toContain("Aug 2024");
  });

  it("points out a budget that is nearly used up", () => {
    const result = ruleBasedInsights(
      buildSnapshot({
        transactions: [
          { name: "Salary", date: day(1), amount: 3000 },
          {
            name: "Cinema",
            category: "Entertainment",
            date: day(30),
            amount: -45,
          },
        ],
        budgets: [{ category: "Entertainment", maximum: 50 }],
      }),
    );

    expect(result.recommendations[0].title).toBe(
      "Entertainment budget is 90% used",
    );
  });

  it("returns at most four recommendations that match the schema", () => {
    const result = ruleBasedInsights(buildSnapshot(demoData));

    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeLessThanOrEqual(4);
    expect(() => InsightsSchema.parse(result)).not.toThrow();
  });

  it("gives an encouraging summary when everything is on track", () => {
    const result = ruleBasedInsights(
      buildSnapshot({
        transactions: [
          { name: "Salary", date: day(1), amount: 3000 },
          { name: "Shop", category: "Groceries", date: day(2), amount: -200 },
        ],
        budgets: [{ category: "Groceries", maximum: 400 }],
      }),
    );

    expect(result.summary).toMatch(/within your budgets/);
  });
});

describe("normalise", () => {
  const base = {
    title: "t",
    detail: "d",
    estimated_monthly_savings: null,
  };

  it("lower-cases valid categories and priorities", () => {
    expect(
      normalise({ ...base, category: "Savings", priority: "HIGH" }),
    ).toMatchObject({ category: "savings", priority: "high" });
  });

  it("falls back to safe defaults for unexpected values", () => {
    expect(
      normalise({ ...base, category: "crypto", priority: "urgent" }),
    ).toMatchObject({ category: "spending", priority: "medium" });
  });
});
