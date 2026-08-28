import { formatEuroCents } from "@/lib/money";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-amount-hero font-semibold tabular-nums">Kassenbuch</h1>
        <p className="mt-1 text-ink-muted">Kleingewerbe-Buchhaltung, automatisiert.</p>
      </header>

      <section className="rounded-card border border-line bg-surface p-4 shadow-sm">
        <p className="text-ink-muted text-sm">Kontostand (Platzhalter)</p>
        <p className="text-amount-hero tabular-nums">{formatEuroCents(0)}</p>
      </section>
    </main>
  );
}
