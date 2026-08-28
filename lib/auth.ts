import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "kb_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 Tage
export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getAuthSecret()).update(payload).digest("hex");
}

/** Constant-time comparison of two hex/utf8 strings of potentially different length. */
export function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

/** Solo-user session token: `<issuedAtMs>.<hmac>`, no per-user identity needed. */
export function createSessionToken(issuedAt: number = Date.now()): string {
  const payload = String(issuedAt);
  return `${payload}.${sign(payload)}`;
}

export function isValidSessionToken(token: string | undefined | null, now: number = Date.now()): boolean {
  if (!token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  if (!safeEqual(sign(payload), signature)) return false;

  const issuedAt = Number(payload);
  if (!Number.isFinite(issuedAt)) return false;
  return now - issuedAt < SESSION_TTL_MS;
}

/** Compares against the LOGIN_TOKEN env var used on the solo login page. */
export function isValidLoginToken(candidate: string): boolean {
  const expected = process.env.LOGIN_TOKEN;
  if (!expected) return false;
  return safeEqual(candidate, expected);
}
