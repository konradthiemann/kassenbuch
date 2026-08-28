import { rm } from "node:fs/promises";

import { afterAll, describe, expect, it } from "vitest";

import { DELETE, GET } from "../app/api/attachments/[id]/route";
import { POST as uploadAttachment } from "../app/api/transactions/[id]/attachments/route";
import { createSessionToken, SESSION_COOKIE_NAME } from "../lib/auth";
import { attachmentFilePath } from "../lib/storage";
import { prisma } from "../lib/prisma";

const authHeaders = { cookie: `${SESSION_COOKIE_NAME}=${createSessionToken()}` };

async function createManualTransaction() {
  return prisma.transaction.create({
    data: {
      type: "EXPENSE",
      amountCents: 100,
      occurredAt: new Date(),
      description: "with receipt",
      source: "manual"
    }
  });
}

function uploadRequest(transactionId: string, file: File): Request {
  const form = new FormData();
  form.set("file", file);
  return new Request(`http://localhost/api/transactions/${transactionId}/attachments`, {
    method: "POST",
    headers: authHeaders,
    body: form
  });
}

describe("attachment upload/download/delete", () => {
  const transactionIds: string[] = [];
  const storageKeys: string[] = [];

  afterAll(async () => {
    await prisma.attachment.deleteMany({ where: { transactionId: { in: transactionIds } } });
    await prisma.transaction.deleteMany({ where: { id: { in: transactionIds } } });
    await Promise.all(storageKeys.map((key) => rm(attachmentFilePath(key), { force: true })));
    await prisma.$disconnect();
  });

  it("rejects an upload without a valid session", async () => {
    const transaction = await createManualTransaction();
    transactionIds.push(transaction.id);

    const res = await uploadAttachment(
      new Request(`http://localhost/api/transactions/${transaction.id}/attachments`, { method: "POST", body: new FormData() }),
      { params: { id: transaction.id } }
    );
    expect(res.status).toBe(401);
  });

  it("rejects a disallowed mime type", async () => {
    const transaction = await createManualTransaction();
    transactionIds.push(transaction.id);

    const file = new File([new Uint8Array([1, 2, 3])], "malware.exe", { type: "application/x-msdownload" });
    const res = await uploadAttachment(uploadRequest(transaction.id, file), { params: { id: transaction.id } });
    expect(res.status).toBe(415);
  });

  it("uploads a PDF, then downloads it byte-for-byte", async () => {
    const transaction = await createManualTransaction();
    transactionIds.push(transaction.id);

    const bytes = new Uint8Array([37, 80, 68, 70]); // "%PDF"
    const file = new File([bytes], "beleg.pdf", { type: "application/pdf" });

    const uploadRes = await uploadAttachment(uploadRequest(transaction.id, file), { params: { id: transaction.id } });
    expect(uploadRes.status).toBe(201);
    const uploaded = (await uploadRes.json()) as { id: string; storageKey: string };
    storageKeys.push(uploaded.storageKey);

    const downloadRes = await GET(
      new Request(`http://localhost/api/attachments/${uploaded.id}`, { headers: authHeaders }),
      { params: { id: uploaded.id } }
    );
    expect(downloadRes.status).toBe(200);
    const downloaded = new Uint8Array(await downloadRes.arrayBuffer());
    expect(downloaded).toEqual(bytes);
  });

  it("soft-deletes an attachment: DB flagged, file kept on disk", async () => {
    const transaction = await createManualTransaction();
    transactionIds.push(transaction.id);

    const file = new File([new Uint8Array([1])], "beleg.jpg", { type: "image/jpeg" });
    const uploadRes = await uploadAttachment(uploadRequest(transaction.id, file), { params: { id: transaction.id } });
    const uploaded = (await uploadRes.json()) as { id: string; storageKey: string };
    storageKeys.push(uploaded.storageKey);

    const deleteRes = await DELETE(
      new Request(`http://localhost/api/attachments/${uploaded.id}`, { method: "DELETE", headers: authHeaders }),
      { params: { id: uploaded.id } }
    );
    expect(deleteRes.status).toBe(204);

    const stored = await prisma.attachment.findUnique({ where: { id: uploaded.id } });
    expect(stored?.deletedAt).not.toBeNull();

    // File selbst bleibt GoBD-bedingt erhalten (nur Soft-Delete in der DB).
    const downloadAfterDelete = await GET(
      new Request(`http://localhost/api/attachments/${uploaded.id}`, { headers: authHeaders }),
      { params: { id: uploaded.id } }
    );
    expect(downloadAfterDelete.status).toBe(404);
  });
});
