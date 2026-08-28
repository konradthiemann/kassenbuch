import { describe, expect, it } from "vitest";

import { categorizeTransaction } from "./categorize";

describe("categorizeTransaction", () => {
  it("falls back to uncategorized when ANTHROPIC_API_KEY is unset", async () => {
    const original = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const result = await categorizeTransaction({
      description: "Railway hosting invoice",
      type: "EXPENSE",
      source: "railway"
    });

    expect(result).toEqual({ source: "uncategorized" });

    if (original) process.env.ANTHROPIC_API_KEY = original;
  });
});
