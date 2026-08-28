import { CategorySource, Transaction, TransactionType } from "@prisma/client";

import { categorizeTransaction } from "./categorize";
import { prisma } from "./prisma";

export type TransactionEventInput = {
  source: string;
  externalId: string;
  amountCents: number;
  occurredAt: string;
  description: string;
  category?: string;
};

/**
 * Idempotent ingestion shared by the costs (EXPENSE) and income (INCOME)
 * webhooks: same shape, same dedup-on-(source, externalId), same
 * category-hint-or-Claude-or-uncategorized resolution.
 */
export async function ingestTransactionEvent(
  event: TransactionEventInput,
  type: TransactionType
): Promise<{ transaction: Transaction; created: boolean }> {
  const existing = await prisma.transaction.findUnique({
    where: { source_externalId: { source: event.source, externalId: event.externalId } }
  });
  if (existing) {
    return { transaction: existing, created: false };
  }

  let categoryId: string | null = null;
  let categorySource: CategorySource = CategorySource.UNCATEGORIZED;

  if (event.category) {
    const category = await prisma.category.findUnique({
      where: { name_type: { name: event.category, type } }
    });
    if (category) {
      categoryId = category.id;
      categorySource = CategorySource.MANUAL;
    }
  } else {
    const result = await categorizeTransaction({ description: event.description, type, source: event.source });
    if (result.source === "claude") {
      const category = await prisma.category.findUnique({
        where: { name_type: { name: result.categoryName, type } }
      });
      if (category) {
        categoryId = category.id;
        categorySource = CategorySource.CLAUDE;
      }
    }
  }

  const transaction = await prisma.transaction.create({
    data: {
      type,
      amountCents: event.amountCents,
      occurredAt: new Date(event.occurredAt),
      description: event.description,
      source: event.source,
      externalId: event.externalId,
      categoryId,
      categorySource
    }
  });

  return { transaction, created: true };
}
