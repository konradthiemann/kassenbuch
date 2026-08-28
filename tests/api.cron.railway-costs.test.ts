import { afterAll, afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "../app/api/cron/railway-costs/route";
import { prisma } from "../lib/prisma";

const CRON_SECRET = process.env.CRON_SECRET ?? "";

function request(token = CRON_SECRET): Request {
  return new Request("http://localhost/api/cron/railway-costs", {
    headers: token ? { authorization: `Bearer ${token}` } : {}
  });
}

describe("GET /api/cron/railway-costs", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  afterAll(async () => {
    await prisma.transaction.deleteMany({ where: { source: "railway", externalId: { startsWith: "in_test" } } });
    await prisma.$disconnect();
  });

  it("rejects requests without a valid cron token", async () => {
    const res = await GET(request("wrong"));
    expect(res.status).toBe(401);
  });

  it("skips gracefully when RAILWAY_API_TOKEN is unset", async () => {
    const original = process.env.RAILWAY_API_TOKEN;
    delete process.env.RAILWAY_API_TOKEN;

    const res = await GET(request());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { skipped: boolean };
    expect(body.skipped).toBe(true);

    if (original) process.env.RAILWAY_API_TOKEN = original;
  });

  it("skips gracefully when RAILWAY_WORKSPACE_ID is unset", async () => {
    process.env.RAILWAY_API_TOKEN = "fake-token-for-test";
    const original = process.env.RAILWAY_WORKSPACE_ID;
    delete process.env.RAILWAY_WORKSPACE_ID;

    const res = await GET(request());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { skipped: boolean };
    expect(body.skipped).toBe(true);

    delete process.env.RAILWAY_API_TOKEN;
    if (original) process.env.RAILWAY_WORKSPACE_ID = original;
  });

  it("books a paid invoice as an expense and ignores non-paid ones", async () => {
    process.env.RAILWAY_API_TOKEN = "fake-token-for-test";
    process.env.RAILWAY_WORKSPACE_ID = "fake-workspace-for-test";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            workspace: {
              customer: {
                invoices: [
                  {
                    invoiceId: "in_test_paid",
                    total: 919,
                    status: "paid",
                    periodStart: "2026-07-14T10:30:03.000Z",
                    periodEnd: "2026-08-14T10:30:03.000Z"
                  },
                  {
                    invoiceId: "in_test_open",
                    total: 500,
                    status: "open",
                    periodStart: "2026-08-14T10:30:03.000Z",
                    periodEnd: "2026-09-14T10:30:03.000Z"
                  }
                ]
              }
            }
          }
        })
      })
    );

    const res = await GET(request());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { processed: number };
    expect(body.processed).toBe(1);

    const booked = await prisma.transaction.findUnique({
      where: { source_externalId: { source: "railway", externalId: "in_test_paid" } }
    });
    expect(booked?.amountCents).toBe(919);
    expect(booked?.type).toBe("EXPENSE");

    const notBooked = await prisma.transaction.findUnique({
      where: { source_externalId: { source: "railway", externalId: "in_test_open" } }
    });
    expect(notBooked).toBeNull();

    delete process.env.RAILWAY_API_TOKEN;
    delete process.env.RAILWAY_WORKSPACE_ID;
  });
});
