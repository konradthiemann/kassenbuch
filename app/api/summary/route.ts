import { NextResponse } from "next/server";

import { isAuthorizedSession } from "../../../lib/auth";
import { currentMonthRange } from "../../../lib/period";
import { prisma } from "../../../lib/prisma";
import { summarize } from "../../../lib/summary";

export async function GET(req: Request) {
  if (!(await isAuthorizedSession(req))) {
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
    select: { type: true, amountCents: true }
  });

  return NextResponse.json({ from: from.toISOString(), to: to.toISOString(), ...summarize(transactions) });
}
