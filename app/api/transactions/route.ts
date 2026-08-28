import { CategorySource } from "@prisma/client";
import { NextResponse } from "next/server";

import { isAuthorizedSession } from "../../../lib/auth";
import { categorizeTransaction } from "../../../lib/categorize";
import { currentMonthRange } from "../../../lib/period";
import { prisma } from "../../../lib/prisma";
import { createTransactionSchema } from "./schema";

export async function GET(req: Request) {
  if (!isAuthorizedSession(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");
  const defaultRange = currentMonthRange();

  const from = fromParam ? new Date(fromParam) : defaultRange.from;
  const to = toParam ? new Date(toParam) : defaultRange.to;

  const transactions = await prisma.transaction.findMany({
    where: { occurredAt: { gte: from, lt: to } },
    include: { category: true, attachments: { where: { deletedAt: null } } },
    orderBy: { occurredAt: "desc" }
  });

  return NextResponse.json(transactions);
}

export async function POST(req: Request) {
  if (!isAuthorizedSession(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = createTransactionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  let categoryId: string | null = null;
  let categorySource: CategorySource = CategorySource.UNCATEGORIZED;

  if (input.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (category) {
      categoryId = category.id;
      categorySource = CategorySource.MANUAL;
    }
  } else {
    const result = await categorizeTransaction({ description: input.description, type: input.type, source: "manual" });
    if (result.source === "claude") {
      const category = await prisma.category.findUnique({
        where: { name_type: { name: result.categoryName, type: input.type } }
      });
      if (category) {
        categoryId = category.id;
        categorySource = CategorySource.CLAUDE;
      }
    }
  }

  const transaction = await prisma.transaction.create({
    data: {
      type: input.type,
      amountCents: input.amountCents,
      occurredAt: new Date(input.occurredAt),
      description: input.description,
      source: "manual",
      categoryId,
      categorySource
    },
    include: { category: true }
  });

  return NextResponse.json(transaction, { status: 201 });
}
