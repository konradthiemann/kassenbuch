export type SummaryInput = { type: "INCOME" | "EXPENSE"; amountCents: number };
export type Summary = { incomeCents: number; expenseCents: number; profitCents: number };

export function summarize(transactions: SummaryInput[]): Summary {
  let incomeCents = 0;
  let expenseCents = 0;

  for (const t of transactions) {
    if (t.type === "INCOME") incomeCents += t.amountCents;
    else expenseCents += t.amountCents;
  }

  return { incomeCents, expenseCents, profitCents: incomeCents - expenseCents };
}
