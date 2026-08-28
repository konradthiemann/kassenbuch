import { describe, expect, it } from "vitest";

import { POST as login } from "../app/api/auth/login/route";
import { POST as logout } from "../app/api/auth/logout/route";
import { isValidSessionToken, SESSION_COOKIE_NAME } from "../lib/auth";

function loginRequest(token: string): Request {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token })
  });
}

describe("POST /api/auth/login", () => {
  it("sets a valid session cookie for the correct login token", async () => {
    const res = await login(loginRequest(process.env.LOGIN_TOKEN ?? ""));
    expect(res.status).toBe(200);

    const cookie = res.cookies.get(SESSION_COOKIE_NAME);
    expect(cookie).toBeDefined();
    expect(await isValidSessionToken(cookie?.value)).toBe(true);
  });

  it("rejects a wrong login token without setting a cookie", async () => {
    const res = await login(loginRequest("wrong"));
    expect(res.status).toBe(401);
    expect(res.cookies.get(SESSION_COOKIE_NAME)).toBeUndefined();
  });

  it("rejects an empty payload", async () => {
    const res = await login(new Request("http://localhost/api/auth/login", { method: "POST", body: "{}" }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the session cookie", async () => {
    const res = await logout();
    const cookie = res.cookies.get(SESSION_COOKIE_NAME);
    expect(cookie?.value).toBe("");
  });
});
