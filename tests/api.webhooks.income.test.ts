import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { POST } from "../app/api/webhooks/income/route";
import { prisma } from "../lib/prisma";

const SERVICE_TOKEN = process.env.KASSENBUCH_SERVICE_TOKEN ?? "";

function request(body: unknown, token = SERVICE_TOKEN): Request {
  return new Request("http://localhost/api/webhooks/income", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
}

describe("POST /api/webhooks/income", () => {
  const createdIds: string[] = [];

  afterAll(async () => {
    if (createdIds.length > 0) {
      await prisma.transaction.deleteMany({ where: { id: { in: createdIds } } });
    }
    await prisma.$disconnect();
  });

  it("rejects requests without a valid Bearer token", async () => {
    const res = await POST(request({ source: "doewe" }, "wrong-token"));
    expect(res.status).toBe(401);
  });

  it("creates an income transaction from a valid event", async () => {
    const externalId = randomUUID();
    const res = await POST(
      request({
        source: "doewe",
        externalId,
        amountCents: 4200,
        occurredAt: new Date().toISOString(),
        description: "Stripe payout",
        category: "App-Einnahmen"
      })
    );

    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; type: string };
    createdIds.push(body.id);

    expect(body.type).toBe("INCOME");

    const stored = await prisma.transaction.findUnique({ where: { id: body.id }, include: { category: true } });
    expect(stored?.category?.name).toBe("App-Einnahmen");
  });
});
