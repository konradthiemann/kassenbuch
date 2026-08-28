"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token })
    });

    setLoading(false);
    if (!res.ok) {
      setError("Zugangs-Token ist falsch.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-bg px-4">
      <div className="text-center">
        <h1 className="text-amount-hero font-semibold tabular-nums">Kassenbuch</h1>
        <p className="mt-1 text-ink-muted">Kleingewerbe-Buchhaltung, automatisiert.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-3">
        <input
          type="password"
          autoFocus
          placeholder="Zugangs-Token"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          className="rounded-field border border-line bg-surface px-4 py-3 text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={loading || token.length === 0}
          className="rounded-field bg-brand px-4 py-3 font-medium text-brand-on transition-colors disabled:opacity-50"
        >
          {loading ? "Wird geprueft…" : "Anmelden"}
        </button>
      </form>
    </main>
  );
}
