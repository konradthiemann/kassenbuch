import Anthropic from "@anthropic-ai/sdk";

import { DEFAULT_CATEGORIES } from "./categories";

export type CategorizationResult = { source: "claude"; categoryName: string } | { source: "uncategorized" };

/**
 * Identity-linked Anthropic API keys (the current default the Console
 * issues) require an explicit anthropic-workspace-id header per request —
 * plain workspace/legacy keys don't need it, hence optional.
 */
export function anthropicDefaultHeaders(): Record<string, string> | undefined {
  const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID;
  return workspaceId ? { "anthropic-workspace-id": workspaceId } : undefined;
}

/**
 * Auto-categorizes an incoming transaction via Claude. Without
 * ANTHROPIC_API_KEY this is a no-op stub (uncategorized) — same fallback
 * pattern as Doewe's receipt-scan route, so the feature is fully optional.
 */
export async function categorizeTransaction(input: {
  description: string;
  type: "INCOME" | "EXPENSE";
  source: string;
}): Promise<CategorizationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { source: "uncategorized" };

  const candidates = DEFAULT_CATEGORIES.filter((c) => c.type === input.type).map((c) => c.name);

  try {
    const client = new Anthropic({ apiKey, defaultHeaders: anthropicDefaultHeaders() });
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 20,
      messages: [
        {
          role: "user",
          content: `Ordne diese Buchung genau einer dieser Kategorien zu: ${candidates.join(", ")}.\nQuelle: ${input.source}\nBeschreibung: ${input.description}\nAntworte NUR mit dem exakten Kategorienamen, ohne weitere Erklaerung.`
        }
      ]
    });

    const textBlock = message.content.find((block) => block.type === "text");
    const categoryName = textBlock && "text" in textBlock ? textBlock.text.trim() : "";

    if (candidates.includes(categoryName)) {
      return { source: "claude", categoryName };
    }
    return { source: "uncategorized" };
  } catch (error) {
    console.error("Claude categorization failed:", error);
    return { source: "uncategorized" };
  }
}
