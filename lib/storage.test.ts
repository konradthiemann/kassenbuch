import { readFile, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { attachmentFilePath, readAttachmentFile, saveAttachmentFile } from "./storage";

describe("attachment storage", () => {
  const writtenKeys: string[] = [];

  afterEach(async () => {
    await Promise.all(writtenKeys.map((key) => rm(attachmentFilePath(key), { force: true })));
    writtenKeys.length = 0;
  });

  it("writes the file under a random key and preserves the extension", async () => {
    const bytes = Buffer.from("%PDF-1.4 fake receipt");
    const key = await saveAttachmentFile(bytes, "beleg.pdf");
    writtenKeys.push(key);

    expect(key.endsWith(".pdf")).toBe(true);

    const onDisk = await readFile(attachmentFilePath(key));
    expect(onDisk.equals(bytes)).toBe(true);
  });

  it("never reuses a storage key across two uploads with the same filename", async () => {
    const keyA = await saveAttachmentFile(Buffer.from("a"), "receipt.jpg");
    const keyB = await saveAttachmentFile(Buffer.from("b"), "receipt.jpg");
    writtenKeys.push(keyA, keyB);

    expect(keyA).not.toBe(keyB);
  });

  it("reads back exactly what was written", async () => {
    const bytes = Buffer.from("hello receipt");
    const key = await saveAttachmentFile(bytes, "note.txt");
    writtenKeys.push(key);

    const readBack = await readAttachmentFile(key);
    expect(readBack.equals(bytes)).toBe(true);
  });
});
