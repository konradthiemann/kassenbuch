import { NextResponse } from "next/server";

import { isAuthorizedSession } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

/**
 * Only manual entries can be deleted — webhook-sourced transactions
 * (source !== "manual") stay put to keep the automated record intact; fix
 * mistakes at the source app instead.
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!(await isAuthorizedSession(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transaction = await prisma.transaction.findUnique({ where: { id: params.id } });
  if (!transaction) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (transaction.source !== "manual") {
    return NextResponse.json({ error: "Only manual transactions can be deleted" }, { status: 403 });
  }

  await prisma.transaction.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
