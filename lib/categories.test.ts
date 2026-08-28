import { afterAll, describe, expect, it } from "vitest";

import { DEFAULT_CATEGORIES, ensureDefaultCategories } from "./categories";
import { prisma } from "./prisma";

describe("ensureDefaultCategories", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates every default category exactly once", async () => {
    await ensureDefaultCategories();
    await ensureDefaultCategories();

    const rows = await prisma.category.findMany({
      where: { name: { in: DEFAULT_CATEGORIES.map((c) => c.name) } }
    });

    expect(rows).toHaveLength(DEFAULT_CATEGORIES.length);
  });

  it("keeps expense and income categories distinct", async () => {
    const expenseCount = DEFAULT_CATEGORIES.filter((c) => c.type === "EXPENSE").length;
    const incomeCount = DEFAULT_CATEGORIES.filter((c) => c.type === "INCOME").length;

    expect(expenseCount).toBeGreaterThan(0);
    expect(incomeCount).toBeGreaterThan(0);
  });
});
