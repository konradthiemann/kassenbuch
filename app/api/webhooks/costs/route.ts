/**
 * POST /api/webhooks/costs — other apps (Doewe, Knips, ...) or the Railway
 * cost cron report a cost event here. Bearer-auth via
 * KASSENBUCH_SERVICE_TOKEN. Idempotent on (source, externalId): repeated
 * delivery of the same event returns the existing transaction instead of
 * creating a duplicate.
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

  const { transaction, created } = await ingestTransactionEvent(parsed.data, TransactionType.EXPENSE);
  return NextResponse.json(transaction, { status: created ? 201 : 200 });
}
