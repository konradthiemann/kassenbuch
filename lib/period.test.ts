import { describe, expect, it } from "vitest";

import { currentMonthRange, shiftMonthRange } from "./period";

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

describe("shiftMonthRange", () => {
  it("moves one month forward", () => {
    const range = currentMonthRange(new Date("2026-08-15T00:00:00.000Z"));
    const next = shiftMonthRange(range, 1);
    expect(next.from.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(next.to.toISOString()).toBe("2026-10-01T00:00:00.000Z");
  });

  it("moves one month back across a year boundary", () => {
    const range = currentMonthRange(new Date("2026-01-15T00:00:00.000Z"));
    const prev = shiftMonthRange(range, -1);
    expect(prev.from.toISOString()).toBe("2025-12-01T00:00:00.000Z");
    expect(prev.to.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });
});
