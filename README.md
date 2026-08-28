# Kassenbuch

Automatisierte Kleingewerbe-Buchhaltung für Konrads eigene Apps. Sammelt
Kosten (Claude/Anthropic API, Railway-Hosting) und Einnahmen automatisiert
per Webhook/API aus den anderen Repos im Workspace und stellt sie in einem
mobile-first Dashboard dar — als Kosten-/Einnahmen-Übersicht, nicht als
GoBD-zertifizierte Steuersoftware. Details: [`specs/kassenbuch-mvp.md`](specs/kassenbuch-mvp.md).

Live: https://kassenbuch-web-production.up.railway.app (Solo-Login)

## Features

- Dashboard: Einnahmen/Ausgaben/Gewinn je Monat, mobile-first (375px+)
- Manuelle Buchung inkl. Beleg-Upload, CSV-Export je Zeitraum
- `POST /api/webhooks/costs` / `/income` — Bearer-Auth
  (`KASSENBUCH_SERVICE_TOKEN`), idempotent über `(source, externalId)`
- `GET /api/cron/railway-costs` — zieht bezahlte Railway-Rechnungen
  periodisch als Ausgaben (Bearer `CRON_SECRET`)
- Optionale automatische Kategorisierung per Claude (Haiku), Stub-Fallback
  ohne `ANTHROPIC_API_KEY`
- Belege unveränderbar abgelegt (GoBD): kein Überschreiben, nur Soft-Delete

## Stack

- Next.js 14 (App Router) + TypeScript, strict
- Prisma + PostgreSQL (lokal: Docker, prod: Railway)
- Tailwind CSS — Design-Token-System analog zu [Doewe](../Doewe) (Referenz-Setup), automatisches Dark Mode via `prefers-color-scheme`
- Vitest für Tests (72 Tests)

## Getting Started

```bash
npm install
cp .env.example .env.local   # Werte eintragen (siehe Kommentare in der Datei)
docker compose up -d          # lokale Postgres auf Port 5433
npm run db:migrate:dev        # Schema anwenden
npm run prisma:seed           # Default-Kategorien anlegen
npm run dev
```

## Scripts

```bash
npm run dev              # Next.js dev server
npm run lint              # ESLint
npm run typecheck          # TypeScript (noEmit)
npm run test                 # Vitest
npm run build                  # Production build
npm run db:push                  # Prisma-Schema pushen (lokal, schnelle Iteration)
npm run db:migrate:dev              # Neue Migration erzeugen + anwenden (lokal)
npm run prisma:migrate:deploy          # Migrationen in Prod anwenden
npm run prisma:seed                      # Default-Kategorien seeden
```

## Optionale Tokens

- `ANTHROPIC_API_KEY` — aktiviert automatische Kategorisierung eingehender
  Buchungen per Claude Haiku. Ohne Key: Buchungen landen als
  "unkategorisiert", kein Fehler (Stub-Fallback wie bei Doewes
  `receipt-scan`).
- `RAILWAY_API_TOKEN` — aktiviert `GET /api/cron/railway-costs` (zieht echte,
  bezahlte Railway-Rechnungen als Ausgabe). Ohne Token: No-op.

## Status

MVP live: Backend (Webhooks, Auth, Transaktionen, Belege, CSV-Export,
Railway-Cost-Cron), Dashboard-UI, Deploy auf Railway. Offen: Live-Anbindung
von Doewe/Knips an die Webhooks (beide haben noch kein Stripe/eigenes
Kosten-Tracking), siehe [`specs/kassenbuch-mvp.md`](specs/kassenbuch-mvp.md)
"Offene Fragen".
