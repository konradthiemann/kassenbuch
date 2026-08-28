import { describe, expect, it, afterAll } from "vitest";

import { GET, POST } from "../app/api/transactions/route";
import { createSessionToken, SESSION_COOKIE_NAME } from "../lib/auth";
import { prisma } from "../lib/prisma";

const authHeaders = { cookie: `${SESSION_COOKIE_NAME}=${createSessionToken()}` };

function getRequest(query = ""): Request {
  return new Request(`http://localhost/api/transactions${query}`, { headers: authHeaders });
}

function postRequest(body: unknown, headers: Record<string, string> = authHeaders): Request {
  return new Request("http://localhost/api/transactions", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body)
  });
}

describe("/api/transactions", () => {
  const createdIds: string[] = [];

  afterAll(async () => {
    if (createdIds.length > 0) {
      await prisma.transaction.deleteMany({ where: { id: { in: createdIds } } });
    }
    await prisma.$disconnect();
  });

  it("GET rejects an unauthenticated request", async () => {
    const res = await GET(new Request("http://localhost/api/transactions"));
    expect(res.status).toBe(401);
  });

  it("POST creates a manual transaction defaulting to source=manual", async () => {
    const res = await POST(
      postRequest({
        type: "EXPENSE",
        amountCents: 2500,
        occurredAt: new Date().toISOString(),
        description: "Kaffee fuers Buero"
      })
    );

    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; source: string; categorySource: string };
    createdIds.push(body.id);

    expect(body.source).toBe("manual");
    expect(body.categorySource).toBe("UNCATEGORIZED");
  });

  it("POST rejects an invalid payload", async () => {
    const res = await POST(postRequest({ type: "EXPENSE" }));
    expect(res.status).toBe(400);
  });

  it("GET returns transactions within the requested period", async () => {
    const inRange = await prisma.transaction.create({
      data: {
        type: "EXPENSE",
        amountCents: 111,
        occurredAt: new Date("2026-08-15T00:00:00.000Z"),
        description: "in range",
        source: "manual"
      }
    });
    const outOfRange = await prisma.transaction.create({
      data: {
        type: "EXPENSE",
        amountCents: 222,
        occurredAt: new Date("2026-01-15T00:00:00.000Z"),
        description: "out of range",
        source: "manual"
      }
    });
    createdIds.push(inRange.id, outOfRange.id);

    const res = await GET(getRequest("?from=2026-08-01&to=2026-09-01"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string }[];
    const ids = body.map((t) => t.id);

    expect(ids).toContain(inRange.id);
    expect(ids).not.toContain(outOfRange.id);
  });

  it("DELETE removes a manual transaction", async () => {
    const manual = await prisma.transaction.create({
      data: {
        type: "EXPENSE",
        amountCents: 50,
        occurredAt: new Date(),
        description: "to delete",
        source: "manual"
      }
    });

    const { DELETE } = await import("../app/api/transactions/[id]/route");
    const res = await DELETE(new Request(`http://localhost/api/transactions/${manual.id}`, { headers: authHeaders }), {
      params: { id: manual.id }
    });
    expect(res.status).toBe(204);

    const stored = await prisma.transaction.findUnique({ where: { id: manual.id } });
    expect(stored).toBeNull();
  });

  it("DELETE refuses to remove a webhook-sourced transaction", async () => {
    const webhookSourced = await prisma.transaction.create({
      data: {
        type: "EXPENSE",
        amountCents: 50,
        occurredAt: new Date(),
        description: "from railway",
        source: "railway",
        externalId: "protect-me"
      }
    });
    createdIds.push(webhookSourced.id);

    const { DELETE } = await import("../app/api/transactions/[id]/route");
    const res = await DELETE(
      new Request(`http://localhost/api/transactions/${webhookSourced.id}`, { headers: authHeaders }),
      { params: { id: webhookSourced.id } }
    );
    expect(res.status).toBe(403);

    const stored = await prisma.transaction.findUnique({ where: { id: webhookSourced.id } });
    expect(stored).not.toBeNull();
  });
});
