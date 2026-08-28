import { describe, expect, it } from "vitest";

import {
  createSessionToken,
  isAuthorizedSession,
  isValidLoginToken,
  isValidSessionToken,
  SESSION_COOKIE_NAME
} from "./auth";

describe("session tokens", () => {
  it("accepts a freshly issued token", () => {
    const token = createSessionToken();
    expect(isValidSessionToken(token)).toBe(true);
  });

  it("rejects a missing token", () => {
    expect(isValidSessionToken(null)).toBe(false);
    expect(isValidSessionToken(undefined)).toBe(false);
    expect(isValidSessionToken("")).toBe(false);
  });

  it("rejects a tampered signature", () => {
    const token = createSessionToken();
    const [payload] = token.split(".");
    expect(isValidSessionToken(`${payload}.deadbeef`)).toBe(false);
  });

  it("rejects an expired token", () => {
    const issuedAt = Date.now() - 31 * 24 * 60 * 60 * 1000; // 31 Tage alt
    const token = createSessionToken(issuedAt);
    expect(isValidSessionToken(token)).toBe(false);
  });

  it("rejects a malformed token", () => {
    expect(isValidSessionToken("not-a-real-token")).toBe(false);
  });
});

describe("isAuthorizedSession", () => {
  function requestWithCookie(cookie: string | null): Request {
    const headers = new Headers();
    if (cookie) headers.set("cookie", cookie);
    return new Request("http://localhost/api/transactions", { headers });
  }

  it("accepts a request carrying a valid session cookie", () => {
    const token = createSessionToken();
    expect(isAuthorizedSession(requestWithCookie(`${SESSION_COOKIE_NAME}=${token}`))).toBe(true);
  });

  it("accepts the session cookie alongside unrelated cookies", () => {
    const token = createSessionToken();
    expect(isAuthorizedSession(requestWithCookie(`foo=bar; ${SESSION_COOKIE_NAME}=${token}; baz=qux`))).toBe(true);
  });

  it("rejects a missing cookie header", () => {
    expect(isAuthorizedSession(requestWithCookie(null))).toBe(false);
  });

  it("rejects an invalid session cookie", () => {
    expect(isAuthorizedSession(requestWithCookie(`${SESSION_COOKIE_NAME}=garbage`))).toBe(false);
  });
});

describe("isValidLoginToken", () => {
  it("accepts the configured LOGIN_TOKEN", () => {
    expect(isValidLoginToken(process.env.LOGIN_TOKEN ?? "")).toBe(true);
  });

  it("rejects an incorrect token", () => {
    expect(isValidLoginToken("wrong-token")).toBe(false);
  });

  it("rejects a token of different length without throwing", () => {
    expect(isValidLoginToken("x")).toBe(false);
  });
});
