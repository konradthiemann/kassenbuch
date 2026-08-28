/**
 * POST /api/webhooks/income — income event contract (e.g. future Stripe
 * payouts from Doewe/Knips). Same auth/idempotency/shape as
 * /api/webhooks/costs, just booked as INCOME. Prepared ahead of any real
 * caller: neither Doewe nor Knips has a live Stripe integration yet
 * (see specs/kassenbuch-mvp.md, AC7).
 */
import { TransactionType } from "@prisma/client";
import { NextResponse } from "next/server";

import { isAuthorizedService } from "../../../../lib/serviceAuth";
import { ingestTransactionEvent } from "../../../../lib/webhookIngest";
import { transactionEventSchema } from "../schema";

export async function POST(req: Request) {
  if (!isAuthorizedService(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = transactionEventSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const { transaction, created } = await ingestTransactionEvent(parsed.data, TransactionType.INCOME);
  return NextResponse.json(transaction, { status: created ? 201 : 200 });
}
