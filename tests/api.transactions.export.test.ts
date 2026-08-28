import { afterAll, describe, expect, it } from "vitest";

import { GET } from "../app/api/transactions/export/route";
import { createSessionToken, SESSION_COOKIE_NAME } from "../lib/auth";
import { prisma } from "../lib/prisma";

const authHeaders = { cookie: `${SESSION_COOKIE_NAME}=${createSessionToken()}` };

describe("GET /api/transactions/export", () => {
  const createdIds: string[] = [];

  afterAll(async () => {
    await prisma.transaction.deleteMany({ where: { id: { in: createdIds } } });
    await prisma.$disconnect();
  });

  it("rejects an unauthenticated request", async () => {
    const res = await GET(new Request("http://localhost/api/transactions/export"));
    expect(res.status).toBe(401);
  });

  it("returns a CSV attachment containing transactions in the requested period", async () => {
    const transaction = await prisma.transaction.create({
      data: {
        type: "EXPENSE",
        amountCents: 750,
        occurredAt: new Date("2026-08-10T00:00:00.000Z"),
        description: "export-test",
        source: "manual"
      }
    });
    createdIds.push(transaction.id);

    const res = await GET(
      new Request("http://localhost/api/transactions/export?from=2026-08-01&to=2026-09-01", { headers: authHeaders })
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    expect(res.headers.get("content-disposition")).toContain("attachment");

    const body = await res.text();
    expect(body).toContain("export-test");
    expect(body.startsWith("Datum;Betrag;Kategorie;Beschreibung;Quelle")).toBe(true);
  });
});
