import { describe, expect, it } from "vitest";

import { summarize } from "./summary";

describe("summarize", () => {
  it("sums income and expenses separately and computes profit", () => {
    const result = summarize([
      { type: "INCOME", amountCents: 10000 },
      { type: "EXPENSE", amountCents: 3000 },
      { type: "EXPENSE", amountCents: 500 }
    ]);

    expect(result).toEqual({ incomeCents: 10000, expenseCents: 3500, profitCents: 6500 });
  });

  it("returns all zeros for an empty list", () => {
    expect(summarize([])).toEqual({ incomeCents: 0, expenseCents: 0, profitCents: 0 });
  });

  it("allows a negative profit when expenses exceed income", () => {
    const result = summarize([
      { type: "INCOME", amountCents: 100 },
      { type: "EXPENSE", amountCents: 900 }
    ]);
    expect(result.profitCents).toBe(-800);
  });
});
