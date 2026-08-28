import { NextResponse } from "next/server";
import { z } from "zod";

import { createSessionToken, isValidLoginToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "../../../../lib/auth";

const loginSchema = z.object({ token: z.string().min(1) });

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!isValidLoginToken(parsed.data.token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS
  });
  return res;
}
