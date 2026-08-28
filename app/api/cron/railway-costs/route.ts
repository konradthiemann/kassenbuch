/**
 * GET /api/cron/railway-costs — pulled (not pushed): reads paid Railway
 * invoices via the Railway public GraphQL API and books each as an expense.
 * Meant to be triggered daily by a scheduled GitHub Actions workflow
 * (Bearer CRON_SECRET), see .github/workflows/cron-railway-costs.yml.
 * Without RAILWAY_API_TOKEN this is a no-op — same optional-feature
 * pattern as the Claude categorization stub.
 */
import { TransactionType } from "@prisma/client";
import { NextResponse } from "next/server";

import { fetchRailwayInvoices } from "../../../../lib/railway";
import { isAuthorizedCron } from "../../../../lib/serviceAuth";
import { ingestTransactionEvent } from "../../../../lib/webhookIngest";

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiToken = process.env.RAILWAY_API_TOKEN;
  const workspaceId = process.env.RAILWAY_WORKSPACE_ID;
  if (!apiToken || !workspaceId) {
    return NextResponse.json({ skipped: true, reason: "RAILWAY_API_TOKEN or RAILWAY_WORKSPACE_ID not set" });
  }

  const invoices = await fetchRailwayInvoices(apiToken, workspaceId);
  const paidInvoices = invoices.filter((invoice) => invoice.status === "paid");

  const results = [];
  for (const invoice of paidInvoices) {
    const { created } = await ingestTransactionEvent(
      {
        source: "railway",
        externalId: invoice.invoiceId,
        amountCents: invoice.totalCents,
        occurredAt: invoice.periodEnd,
        description: `Railway Invoice ${invoice.periodStart.slice(0, 10)} – ${invoice.periodEnd.slice(0, 10)}`,
        category: "Hosting & Infrastruktur"
      },
      TransactionType.EXPENSE
    );
    results.push({ invoiceId: invoice.invoiceId, created });
  }

  return NextResponse.json({ processed: results.length, results });
}
