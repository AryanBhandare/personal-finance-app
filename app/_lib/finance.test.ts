import { describe, expect, it } from "vitest";
import { latestMonthTotals } from "./finance";
import demoData from "@/public/data.json";

describe("latestMonthTotals", () => {
  it("totals income and spending for the latest month with activity", () => {
    const totals = latestMonthTotals([
      { amount: 100, date: "2024-07-30T10:00:00Z" },
      { amount: 250.5, date: "2024-08-02T10:00:00Z" },
      { amount: -40.25, date: "2024-08-10T10:00:00Z" },
      { amount: -9.75, date: "2024-08-31T23:30:00Z" },
    ]);

    expect(totals).toEqual({
      month: "2024-08",
      label: "Aug 2024",
      income: 250.5,
      expenses: 50,
      net: 200.5,
    });
  });

  it("matches the demo transactions", () => {
    const totals = latestMonthTotals(demoData.transactions);

    expect(totals.month).toBe("2024-08");
    expect(totals.income).toBe(311.25);
    expect(totals.expenses).toBe(665.3);
    expect(totals.net).toBe(-354.05);
  });

  it("falls back to the current month with zero totals when empty", () => {
    const totals = latestMonthTotals([], new Date("2026-09-26T12:00:00Z"));

    expect(totals).toMatchObject({
      label: "Sep 2026",
      income: 0,
      expenses: 0,
      net: 0,
    });
  });
});
