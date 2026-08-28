import { NextResponse } from "next/server";

import { isAuthorizedSession } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { readAttachmentFile } from "../../../../lib/storage";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!(await isAuthorizedSession(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const attachment = await prisma.attachment.findUnique({ where: { id: params.id } });
  if (!attachment || attachment.deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bytes = await readAttachmentFile(attachment.storageKey);
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "content-type": attachment.mimeType,
      "content-disposition": `inline; filename="${attachment.filename}"`
    }
  });
}

/** Soft-delete only (GoBD): the file itself stays on disk. */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!(await isAuthorizedSession(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const attachment = await prisma.attachment.findUnique({ where: { id: params.id } });
  if (!attachment || attachment.deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.attachment.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
  return new NextResponse(null, { status: 204 });
}
