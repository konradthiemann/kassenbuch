import { describe, expect, it } from "vitest";

import { anthropicDefaultHeaders, categorizeTransaction } from "./categorize";

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

describe("anthropicDefaultHeaders", () => {
  it("sends anthropic-workspace-id when ANTHROPIC_WORKSPACE_ID is set", () => {
    const original = process.env.ANTHROPIC_WORKSPACE_ID;
    process.env.ANTHROPIC_WORKSPACE_ID = "wrkspc_123";

    expect(anthropicDefaultHeaders()).toEqual({ "anthropic-workspace-id": "wrkspc_123" });

    if (original) process.env.ANTHROPIC_WORKSPACE_ID = original;
    else delete process.env.ANTHROPIC_WORKSPACE_ID;
  });

  it("returns undefined when ANTHROPIC_WORKSPACE_ID is unset (plain workspace/legacy keys)", () => {
    const original = process.env.ANTHROPIC_WORKSPACE_ID;
    delete process.env.ANTHROPIC_WORKSPACE_ID;

    expect(anthropicDefaultHeaders()).toBeUndefined();

    if (original) process.env.ANTHROPIC_WORKSPACE_ID = original;
  });
});
