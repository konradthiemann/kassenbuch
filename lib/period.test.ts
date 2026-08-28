import { describe, expect, it } from "vitest";

import { currentMonthRange } from "./period";

describe("currentMonthRange", () => {
  it("returns the first and first-of-next-month instant for a mid-month date", () => {
    const { from, to } = currentMonthRange(new Date("2026-08-15T12:00:00.000Z"));
    expect(from.toISOString()).toBe("2026-08-01T00:00:00.000Z");
    expect(to.toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });

  it("handles December correctly (year rollover)", () => {
    const { from, to } = currentMonthRange(new Date("2026-12-25T00:00:00.000Z"));
    expect(from.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(to.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
});
