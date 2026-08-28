import { describe, expect, it } from "vitest";

import { createSessionToken, isValidLoginToken, isValidSessionToken } from "./auth";

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
