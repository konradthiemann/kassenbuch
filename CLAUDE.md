# Kassenbuch

## Zweck
Automatisierte Kleingewerbe-Buchhaltung (Kosten-/Einnahmen-Übersicht) für
Konrads eigene Apps — kein Ersatz für eine GoBD-zertifizierte Steuersoftware.
Sammelt Kosten (Claude/Anthropic API, Railway-Hosting) und Einnahmen
automatisiert per Webhook/Pull-API aus den anderen Repos im Workspace.
Next.js App Router, Deploy auf Railway (PostgreSQL). Spec:
[`specs/kassenbuch-mvp.md`](specs/kassenbuch-mvp.md).

## Befehle
```bash
npm run dev          # Next.js dev server
npm run lint          # ESLint
npm run typecheck      # TypeScript (noEmit)
npm run test             # Vitest
npm run build              # Production build
npm run db:push              # Prisma generate + db push
```

## Verzeichnisstruktur
```
app/              # Next.js App Router (Pages + app/api/ Route Handlers)
lib/              # prisma.ts (Singleton), money.ts, Domain-Utilities + *.test.ts
prisma/           # Schema, Migrations (Models folgen im Plan-Schritt)
specs/            # Spec-Driven-Development-Specs (Konrad-Review-Gate vor Plan)
```

## Tech Stack
- **Framework:** Next.js 14 — App Router, Server Components by default
- **ORM:** Prisma + PostgreSQL (prod: Railway)
- **Styling:** Tailwind CSS — Design-Token-System (bg/surface/ink/brand/income/expense/...)
  analog zu Doewes Referenz-Setup, eigene Markenfarbe. Mobile-first: primäre
  Nutzung ist unterwegs am Handy.
- **Validation:** Zod an allen Systemgrenzen (Webhook-Payloads, API-Routen)
- **Tests:** Vitest

## Coding-Konventionen
- TypeScript strict; kein `any`; Rückgabetypen an exportierten Funktionen.
- Geld immer als Integer-Cents (`amountCents`), nie als Float — siehe `lib/money.ts`.
- API Route Handlers: HTTP-Verb-Funktionen aus `route.ts` exportieren.
- `'use client'` nur wenn nötig; Server Components by default.

## Webhook-/Service-Auth
Eingehende Kosten-/Einnahmen-Events von anderen Apps (Doewe, Knips, ...)
laufen über Bearer-Token gegen `KASSENBUCH_SERVICE_TOKEN` — Pattern analog zu
Doewes `DOEWE_SERVICE_TOKEN`/`CRON_SECRET` (siehe `Doewe/CLAUDE.md`). Kein
Session-Auth für diese Routen. Konkrete Endpunkte/Payload-Contracts: Teil des
Plan-Schritts, siehe Spec.

## Quality-Gates
Alle drei müssen grün sein, bevor ein Feature als fertig gilt:
```bash
npm run lint
npm run typecheck
npm run test
```

## Analyse-Qualität: Fakten vs. Annahmen
Vor jeder Empfehlung: alle betroffenen Dateien lesen, Aussagen als Belegt /
Vermutung / Unbekannt kennzeichnen, Korrekturen offen kommunizieren (siehe
Workspace-`CLAUDE.md`).
