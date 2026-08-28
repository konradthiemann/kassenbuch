// Web Crypto API only (no `node:crypto`) — this module is imported by
// middleware.ts, which runs on the Next.js Edge runtime and can't bundle
// Node built-ins. crypto.subtle is available in both the Edge runtime and
// Node 22+, so this stays a single, universal implementation.

export const SESSION_COOKIE_NAME = "kb_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 Tage
export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;

let signingKey: Promise<CryptoKey> | null = null;

function getSigningKey(): Promise<CryptoKey> {
  if (!signingKey) {
    const secret = process.env.AUTH_SECRET;
    if (!secret) throw new Error("AUTH_SECRET is not set");
    signingKey = crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
  }
  return signingKey;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(payload: string): Promise<string> {
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toHex(signature);
}

/** Solo-user session token: `<issuedAtMs>.<hmac>`, no per-user identity needed. */
export async function createSessionToken(issuedAt: number = Date.now()): Promise<string> {
  const payload = String(issuedAt);
  return `${payload}.${await sign(payload)}`;
}

export async function isValidSessionToken(token: string | undefined | null, now: number = Date.now()): Promise<boolean> {
  if (!token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature || !/^[0-9a-f]+$/i.test(signature) || signature.length % 2 !== 0) return false;

  const key = await getSigningKey();
  const signatureBytes = new Uint8Array(signature.length / 2);
  for (let i = 0; i < signatureBytes.length; i += 1) {
    signatureBytes[i] = parseInt(signature.slice(i * 2, i * 2 + 2), 16);
  }

  const valid = await crypto.subtle.verify("HMAC", key, signatureBytes, new TextEncoder().encode(payload));
  if (!valid) return false;

  const issuedAt = Number(payload);
  if (!Number.isFinite(issuedAt)) return false;
  return now - issuedAt < SESSION_TTL_MS;
}

function getSessionCookie(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const prefix = `${SESSION_COOKIE_NAME}=`;
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  if (!match) return null;

  return decodeURIComponent(match.slice(prefix.length));
}

/** Guards session-authenticated app routes (transactions, categories, attachments, ...). */
export async function isAuthorizedSession(req: Request): Promise<boolean> {
  return isValidSessionToken(getSessionCookie(req));
}

/** Constant-time string comparison — manual XOR-accumulate, no crypto API needed. */
export function safeEqual(a: string, b: string): boolean {
  const bytesA = new TextEncoder().encode(a);
  const bytesB = new TextEncoder().encode(b);
  if (bytesA.length !== bytesB.length) return false;

  let diff = 0;
  for (let i = 0; i < bytesA.length; i += 1) {
    diff |= bytesA[i] ^ bytesB[i];
  }
  return diff === 0;
}

/** Compares against the LOGIN_TOKEN env var used on the solo login page. */
export function isValidLoginToken(candidate: string): boolean {
  const expected = process.env.LOGIN_TOKEN;
  if (!expected) return false;
  return safeEqual(candidate, expected);
}
