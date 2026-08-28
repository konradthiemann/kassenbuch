import { describe, expect, it } from "vitest";

import { GET } from "../app/api/categories/route";
import { createSessionToken, SESSION_COOKIE_NAME } from "../lib/auth";
import { DEFAULT_CATEGORIES } from "../lib/categories";

function authedRequest(): Request {
  const token = createSessionToken();
  return new Request("http://localhost/api/categories", {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` }
  });
}

describe("GET /api/categories", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await GET(new Request("http://localhost/api/categories"));
    expect(res.status).toBe(401);
  });

  it("returns the seeded default categories", async () => {
    const res = await GET(authedRequest());
    expect(res.status).toBe(200);

    const body = (await res.json()) as { name: string; type: string }[];
    for (const expected of DEFAULT_CATEGORIES) {
      expect(body.some((c) => c.name === expected.name && c.type === expected.type)).toBe(true);
    }
  });
});
