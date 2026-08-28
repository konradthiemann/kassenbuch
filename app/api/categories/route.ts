import { NextResponse } from "next/server";

import { isAuthorizedSession } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export async function GET(req: Request) {
  if (!isAuthorizedSession(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(categories);
}
