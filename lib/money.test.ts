import { describe, expect, it } from "vitest";

import { formatEuroCents } from "./money";

describe("formatEuroCents", () => {
  it("formats whole euro amounts with German thousands separators", () => {
    expect(formatEuroCents(150000)).toBe("1.500,00 €");
  });

  it("formats cents", () => {
    expect(formatEuroCents(499)).toBe("4,99 €");
  });

  it("formats negative amounts with a minus sign", () => {
    expect(formatEuroCents(-499)).toBe("-4,99 €");
  });

  it("formats zero", () => {
    expect(formatEuroCents(0)).toBe("0,00 €");
  });
});
