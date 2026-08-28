import Dashboard from "../components/Dashboard";
import { currentMonthRange } from "../lib/period";
import { prisma } from "../lib/prisma";
import { summarize } from "../lib/summary";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { from, to } = currentMonthRange();

  const [transactions, categories] = await Promise.all([
    prisma.transaction.findMany({
      where: { occurredAt: { gte: from, lt: to } },
      include: { category: true, attachments: { where: { deletedAt: null } } },
      orderBy: { occurredAt: "desc" }
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <Dashboard
      initialFrom={from.toISOString()}
      initialTo={to.toISOString()}
      initialSummary={summarize(transactions)}
      initialTransactions={transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amountCents: t.amountCents,
        occurredAt: t.occurredAt.toISOString(),
        description: t.description,
        source: t.source,
        categorySource: t.categorySource,
        category: t.category ? { id: t.category.id, name: t.category.name, type: t.category.type } : null,
        attachments: t.attachments.map((a) => ({ id: a.id, filename: a.filename }))
      }))}
      categories={categories.map((c) => ({ id: c.id, name: c.name, type: c.type }))}
    />
  );
}
