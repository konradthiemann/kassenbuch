# Kassenbuch

Automatisierte Kleingewerbe-Buchhaltung für Konrads eigene Apps. Sammelt
Kosten (Claude/Anthropic API, Railway-Hosting) und Einnahmen automatisiert
per Webhook/API aus den anderen Repos im Workspace und stellt sie in einem
mobile-first Dashboard dar — als Kosten-/Einnahmen-Übersicht, nicht als
GoBD-zertifizierte Steuersoftware. Details: [`specs/kassenbuch-mvp.md`](specs/kassenbuch-mvp.md).

## Stack

- Next.js 14 (App Router) + TypeScript, strict
- Prisma + PostgreSQL (lokal: eigene Postgres-Instanz oder Docker, prod: Railway)
- Tailwind CSS — Design-Token-System analog zu [Doewe](../Doewe) (Referenz-Setup)
- Vitest für Tests

## Getting Started

```bash
npm install
cp .env.example .env.local   # Werte eintragen
npm run db:push              # Prisma-Schema anwenden (sobald Models existieren)
npm run dev
```

## Scripts

```bash
npm run dev         # Next.js dev server
npm run lint         # ESLint
npm run typecheck    # TypeScript (noEmit)
npm run test          # Vitest
npm run build          # Production build
npm run db:push         # Prisma-Schema pushen (generate + db push)
```

## Status

Repo-Scaffold + Spec. Datenmodell, Webhook-Contracts und UI folgen im
Plan-Schritt nach Freigabe der Spec — siehe [`specs/kassenbuch-mvp.md`](specs/kassenbuch-mvp.md).
