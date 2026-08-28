"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { formatEuroCents } from "../lib/money";

type CategoryDto = { id: string; name: string; type: "INCOME" | "EXPENSE" };
type AttachmentDto = { id: string; filename: string };
type TransactionDto = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amountCents: number;
  occurredAt: string;
  description: string;
  source: string;
  categorySource: "MANUAL" | "CLAUDE" | "UNCATEGORIZED";
  category: CategoryDto | null;
  attachments: AttachmentDto[];
};
type SummaryDto = { incomeCents: number; expenseCents: number; profitCents: number };

type Props = {
  initialFrom: string;
  initialTo: string;
  initialSummary: SummaryDto;
  initialTransactions: TransactionDto[];
  categories: CategoryDto[];
};

const monthFormatter = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" });
const dateFormatter = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });

function addMonthsIso(iso: string, delta: number): { from: string; to: string } {
  const date = new Date(iso);
  const from = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1));
  const to = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta + 1, 1));
  return { from: from.toISOString(), to: to.toISOString() };
}

export default function Dashboard({ initialFrom, initialTo, initialSummary, initialTransactions, categories }: Props) {
  const router = useRouter();
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [summary, setSummary] = useState(initialSummary);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [loading, setLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  async function reload(nextFrom: string, nextTo: string) {
    setLoading(true);
    const query = `?from=${encodeURIComponent(nextFrom)}&to=${encodeURIComponent(nextTo)}`;
    const [summaryRes, transactionsRes] = await Promise.all([fetch(`/api/summary${query}`), fetch(`/api/transactions${query}`)]);
    if (summaryRes.ok) setSummary(await summaryRes.json());
    if (transactionsRes.ok) setTransactions(await transactionsRes.json());
    setFrom(nextFrom);
    setTo(nextTo);
    setLoading(false);
  }

  async function shiftMonth(delta: number) {
    const next = addMonthsIso(from, delta);
    await reload(next.from, next.to);
  }

  async function handleDelete(id: string) {
    if (!confirm("Diese Buchung wirklich loeschen?")) return;
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (res.ok) await reload(from, to);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="mx-auto min-h-screen max-w-md pb-28">
      <header className="sticky top-0 z-header flex items-center justify-between bg-bg/95 px-4 py-4 backdrop-blur">
        <div>
          <h1 className="text-amount-lg font-semibold">Kassenbuch</h1>
          <div className="mt-1 flex items-center gap-2 text-ink-muted">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Vorheriger Monat"
              className="rounded-field px-1.5 py-0.5 hover:bg-surface-2"
            >
              ‹
            </button>
            <span className="min-w-[9ch] text-center capitalize">{monthFormatter.format(new Date(from))}</span>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Naechster Monat"
              className="rounded-field px-1.5 py-0.5 hover:bg-surface-2"
            >
              ›
            </button>
          </div>
        </div>
        <button type="button" onClick={handleLogout} className="text-sm text-ink-muted hover:text-ink">
          Abmelden
        </button>
      </header>

      <section className="grid grid-cols-3 gap-2 px-4">
        <SummaryTile label="Einnahmen" valueCents={summary.incomeCents} tone="income" />
        <SummaryTile label="Ausgaben" valueCents={summary.expenseCents} tone="expense" />
        <SummaryTile label="Gewinn" valueCents={summary.profitCents} tone={summary.profitCents >= 0 ? "income" : "expense"} />
      </section>

      <div className="px-4 pt-4">
        <a
          href={`/api/transactions/export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`}
          className="text-sm text-brand underline underline-offset-2"
        >
          CSV exportieren
        </a>
      </div>

      <section className="mt-4 flex flex-col gap-2 px-4">
        {loading && <p className="py-8 text-center text-ink-faint">Lade…</p>}
        {!loading && transactions.length === 0 && (
          <p className="py-8 text-center text-ink-faint">Noch keine Buchungen in diesem Monat.</p>
        )}
        {transactions.map((t) => (
          <article
            key={t.id}
            className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-3 shadow-card"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{t.description}</p>
              <p className="text-sm text-ink-muted">
                {dateFormatter.format(new Date(t.occurredAt))} · {t.category?.name ?? "Unkategorisiert"}
                {t.source !== "manual" && ` · ${t.source}`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`text-amount tabular-nums ${t.type === "INCOME" ? "text-income" : "text-expense"}`}
              >
                {t.type === "INCOME" ? "+" : "−"}
                {formatEuroCents(t.amountCents)}
              </span>
              {t.source === "manual" && (
                <button
                  type="button"
                  onClick={() => handleDelete(t.id)}
                  aria-label="Buchung loeschen"
                  className="rounded-field p-1 text-ink-faint hover:bg-danger-soft hover:text-danger"
                >
                  ✕
                </button>
              )}
            </div>
          </article>
        ))}
      </section>

      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        aria-label="Neue Buchung"
        className="fixed bottom-6 right-1/2 z-nav flex h-14 w-14 translate-x-[9.5rem] items-center justify-center rounded-full bg-brand text-2xl text-brand-on shadow-fab transition-transform active:scale-95"
      >
        +
      </button>

      {sheetOpen && (
        <NewTransactionSheet
          categories={categories}
          onClose={() => setSheetOpen(false)}
          onCreated={async () => {
            setSheetOpen(false);
            await reload(from, to);
          }}
        />
      )}
    </main>
  );
}

function SummaryTile({ label, valueCents, tone }: { label: string; valueCents: number; tone: "income" | "expense" }) {
  return (
    <div className="rounded-card border border-line bg-surface px-3 py-3 shadow-card">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className={`text-amount-lg tabular-nums ${tone === "income" ? "text-income" : "text-expense"}`}>
        {formatEuroCents(valueCents)}
      </p>
    </div>
  );
}

function NewTransactionSheet({
  categories,
  onClose,
  onCreated
}: {
  categories: CategoryDto[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleCategories = categories.filter((c) => c.type === type);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const amountCents = Math.round(Number(amount.replace(",", ".")) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      setError("Bitte einen gueltigen Betrag eingeben.");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type,
        amountCents,
        occurredAt: new Date(occurredAt).toISOString(),
        description,
        categoryId: categoryId || undefined
      })
    });

    if (!res.ok) {
      setSaving(false);
      setError("Buchung konnte nicht gespeichert werden.");
      return;
    }

    const created = (await res.json()) as { id: string };

    if (file) {
      const form = new FormData();
      form.set("file", file);
      await fetch(`/api/transactions/${created.id}/attachments`, { method: "POST", body: form });
    }

    setSaving(false);
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-modal flex items-end justify-center bg-ink/40" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-t-2xl border-t border-line bg-surface px-4 pb-8 pt-4 shadow-raised"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line-strong" />

        <div className="mb-4 flex overflow-hidden rounded-field border border-line">
          <button
            type="button"
            onClick={() => {
              setType("EXPENSE");
              setCategoryId("");
            }}
            className={`flex-1 py-2 text-sm font-medium ${type === "EXPENSE" ? "bg-expense-soft text-expense" : "text-ink-muted"}`}
          >
            Ausgabe
          </button>
          <button
            type="button"
            onClick={() => {
              setType("INCOME");
              setCategoryId("");
            }}
            className={`flex-1 py-2 text-sm font-medium ${type === "INCOME" ? "bg-income-soft text-income" : "text-ink-muted"}`}
          >
            Einnahme
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            inputMode="decimal"
            placeholder="Betrag in Euro"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="rounded-field border border-line bg-surface px-4 py-3 text-amount-lg tabular-nums focus:border-brand focus:outline-none"
          />
          <input
            type="text"
            placeholder="Beschreibung"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="rounded-field border border-line bg-surface px-4 py-3 focus:border-brand focus:outline-none"
          />
          <input
            type="date"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            required
            className="rounded-field border border-line bg-surface px-4 py-3 focus:border-brand focus:outline-none"
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-field border border-line bg-surface px-4 py-3 focus:border-brand focus:outline-none"
          >
            <option value="">Kategorie automatisch/leer lassen</option>
            {visibleCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <label className="flex flex-col gap-1 text-sm text-ink-muted">
            Beleg (optional)
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp,image/heic"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="mt-2 flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-field border border-line py-3 text-ink-muted">
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-field bg-brand py-3 font-medium text-brand-on disabled:opacity-50"
            >
              {saving ? "Speichert…" : "Speichern"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
