import { prisma } from "./prisma";

export const DEFAULT_CATEGORIES = [
  { name: "Hosting & Infrastruktur", type: "EXPENSE" as const },
  { name: "API-Kosten (Claude)", type: "EXPENSE" as const },
  { name: "Software & Lizenzen", type: "EXPENSE" as const },
  { name: "Buerobedarf", type: "EXPENSE" as const },
  { name: "Sonstige Betriebsausgaben", type: "EXPENSE" as const },
  { name: "App-Einnahmen", type: "INCOME" as const },
  { name: "Sonstige Einnahmen", type: "INCOME" as const }
];

/** Idempotent: safe to call on every deploy/seed run. */
export async function ensureDefaultCategories(): Promise<void> {
  for (const category of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { name_type: { name: category.name, type: category.type } },
      update: {},
      create: category
    });
  }
}
