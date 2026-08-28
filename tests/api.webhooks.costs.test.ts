import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { POST } from "../app/api/webhooks/costs/route";
import { prisma } from "../lib/prisma";

const SERVICE_TOKEN = process.env.KASSENBUCH_SERVICE_TOKEN ?? "";

function request(body: unknown, token = SERVICE_TOKEN): Request {
  return new Request("http://localhost/api/webhooks/costs", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
}

describe("POST /api/webhooks/costs", () => {
  const createdIds: string[] = [];

  afterAll(async () => {
    if (createdIds.length > 0) {
      await prisma.transaction.deleteMany({ where: { id: { in: createdIds } } });
    }
    await prisma.$disconnect();
  });

  it("rejects requests without a valid Bearer token", async () => {
    const res = await POST(request({ source: "railway" }, "wrong-token"));
    expect(res.status).toBe(401);
  });

  it("rejects an invalid payload", async () => {
    const res = await POST(request({ source: "railway" }));
    expect(res.status).toBe(400);
  });

  it("creates an expense transaction from a valid cost event", async () => {
    const externalId = randomUUID();
    const res = await POST(
      request({
        source: "railway",
        externalId,
        amountCents: 1234,
        occurredAt: new Date().toISOString(),
        description: "Railway usage invoice"
      })
    );

    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; type: string; amountCents: number };
    createdIds.push(body.id);

    expect(body.type).toBe("EXPENSE");
    expect(body.amountCents).toBe(1234);

    const stored = await prisma.transaction.findUnique({ where: { id: body.id } });
    expect(stored?.externalId).toBe(externalId);
    expect(stored?.categorySource).toBe("UNCATEGORIZED");
  });

  it("is idempotent for repeated delivery of the same externalId", async () => {
    const externalId = randomUUID();
    const payload = {
      source: "railway",
      externalId,
      amountCents: 500,
      occurredAt: new Date().toISOString(),
      description: "Duplicate delivery test"
    };

    const first = await POST(request(payload));
    const firstBody = (await first.json()) as { id: string };
    createdIds.push(firstBody.id);

    const second = await POST(request(payload));
    const secondBody = (await second.json()) as { id: string };

    expect(second.status).toBe(200);
    expect(secondBody.id).toBe(firstBody.id);

    const count = await prisma.transaction.count({ where: { source: "railway", externalId } });
    expect(count).toBe(1);
  });

  it("books an explicit category hint when it matches a known expense category", async () => {
    const externalId = randomUUID();
    const res = await POST(
      request({
        source: "railway",
        externalId,
        amountCents: 999,
        occurredAt: new Date().toISOString(),
        description: "Hosting invoice",
        category: "Hosting & Infrastruktur"
      })
    );

    const body = (await res.json()) as { id: string };
    createdIds.push(body.id);

    const stored = await prisma.transaction.findUnique({ where: { id: body.id }, include: { category: true } });
    expect(stored?.category?.name).toBe("Hosting & Infrastruktur");
    expect(stored?.categorySource).toBe("MANUAL");
  });
});
