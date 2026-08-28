import { NextResponse } from "next/server";

import { isAuthorizedSession } from "../../../../lib/auth";
import { transactionsToCsv } from "../../../../lib/csv";
import { currentMonthRange } from "../../../../lib/period";
import { prisma } from "../../../../lib/prisma";

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
    include: { category: true },
    orderBy: { occurredAt: "asc" }
  });

  const csv = transactionsToCsv(
    transactions.map((t) => ({
      occurredAt: t.occurredAt,
      amountCents: t.amountCents,
      type: t.type,
      categoryName: t.category?.name ?? null,
      description: t.description,
      source: t.source
    }))
  );

  const filename = `kassenbuch_${from.toISOString().slice(0, 10)}_${to.toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`
    }
  });
}
