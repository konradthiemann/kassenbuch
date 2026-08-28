import { afterAll, describe, expect, it } from "vitest";

import { GET } from "../app/api/summary/route";
import { createSessionToken, SESSION_COOKIE_NAME } from "../lib/auth";
import { prisma } from "../lib/prisma";

const authHeaders = { cookie: `${SESSION_COOKIE_NAME}=${createSessionToken()}` };

describe("GET /api/summary", () => {
  const createdIds: string[] = [];

  afterAll(async () => {
    await prisma.transaction.deleteMany({ where: { id: { in: createdIds } } });
    await prisma.$disconnect();
  });

  it("rejects an unauthenticated request", async () => {
    const res = await GET(new Request("http://localhost/api/summary"));
    expect(res.status).toBe(401);
  });

  it("aggregates income and expenses for the requested period", async () => {
    const income = await prisma.transaction.create({
      data: { type: "INCOME", amountCents: 2000, occurredAt: new Date("2026-08-05"), description: "in", source: "manual" }
    });
    const expense = await prisma.transaction.create({
      data: { type: "EXPENSE", amountCents: 700, occurredAt: new Date("2026-08-06"), description: "out", source: "manual" }
    });
    createdIds.push(income.id, expense.id);

    const res = await GET(
      new Request("http://localhost/api/summary?from=2026-08-01&to=2026-09-01", { headers: authHeaders })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { incomeCents: number; expenseCents: number; profitCents: number };
    expect(body.incomeCents).toBeGreaterThanOrEqual(2000);
    expect(body.expenseCents).toBeGreaterThanOrEqual(700);
    expect(body.profitCents).toBe(body.incomeCents - body.expenseCents);
  });
});
