import { describe, expect, it } from "vitest";

import { isAuthorizedCron, isAuthorizedService } from "./serviceAuth";

function requestWith(header: string | null): Request {
  const headers = new Headers();
  if (header) headers.set("authorization", header);
  return new Request("http://localhost/api/webhooks/costs", { headers });
}

describe("isAuthorizedService", () => {
  it("accepts the configured KASSENBUCH_SERVICE_TOKEN as a Bearer token", () => {
    const token = process.env.KASSENBUCH_SERVICE_TOKEN ?? "";
    expect(isAuthorizedService(requestWith(`Bearer ${token}`))).toBe(true);
  });

  it("rejects a wrong token", () => {
    expect(isAuthorizedService(requestWith("Bearer wrong"))).toBe(false);
  });

  it("rejects a missing Authorization header", () => {
    expect(isAuthorizedService(requestWith(null))).toBe(false);
  });

  it("rejects a non-Bearer scheme", () => {
    expect(isAuthorizedService(requestWith("Basic abc123"))).toBe(false);
  });
});

describe("isAuthorizedCron", () => {
  it("accepts the configured CRON_SECRET as a Bearer token", () => {
    const token = process.env.CRON_SECRET ?? "";
    expect(isAuthorizedCron(requestWith(`Bearer ${token}`))).toBe(true);
  });

  it("rejects a wrong token", () => {
    expect(isAuthorizedCron(requestWith("Bearer wrong"))).toBe(false);
  });
});
