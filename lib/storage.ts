import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function attachmentDir(): string {
  return process.env.ATTACHMENTS_DIR ?? "./data/uploads";
}

export function attachmentFilePath(storageKey: string): string {
  return path.join(attachmentDir(), storageKey);
}

/**
 * GoBD-Grundsatz "unveraenderbar": jeder Upload bekommt einen neuen
 * zufaelligen Key, es gibt keinen Ueberschreib-Pfad.
 */
export async function saveAttachmentFile(bytes: Buffer, originalFilename: string): Promise<string> {
  await mkdir(attachmentDir(), { recursive: true });
  const extension = path.extname(originalFilename);
  const storageKey = `${randomUUID()}${extension}`;
  await writeFile(attachmentFilePath(storageKey), bytes);
  return storageKey;
}

export async function readAttachmentFile(storageKey: string): Promise<Buffer> {
  return readFile(attachmentFilePath(storageKey));
}
