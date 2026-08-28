import { NextResponse } from "next/server";

import { isAuthorizedSession } from "../../../../../lib/auth";
import { ATTACHMENT_MAX_SIZE_BYTES, isAllowedAttachmentMimeType } from "../../../../../lib/attachments";
import { prisma } from "../../../../../lib/prisma";
import { saveAttachmentFile } from "../../../../../lib/storage";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isAuthorizedSession(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transaction = await prisma.transaction.findUnique({ where: { id: params.id } });
  if (!transaction) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!isAllowedAttachmentMimeType(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  }
  if (file.size > ATTACHMENT_MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const storageKey = await saveAttachmentFile(bytes, file.name);

  const attachment = await prisma.attachment.create({
    data: {
      transactionId: transaction.id,
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      storageKey
    }
  });

  return NextResponse.json(attachment, { status: 201 });
}
