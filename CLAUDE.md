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

## Deploy (Railway)
- Projekt `kassenbuch` (Workspace "Konrad Thiemann's Projects"), zwei Services:
  `kassenbuch-web` (Next.js, an GitHub-Repo `konradthiemann/kassenbuch`
  Branch `main` gebunden — Railways eigene GitHub-Integration deployt bei
  jedem Push automatisch, kein GH-Actions-Deploy-Job nötig) und `Postgres`.
- Volume an `kassenbuch-web` gemounted auf `/data` (Belege, siehe
  `lib/storage.ts`/`ATTACHMENTS_DIR`).
- **Wichtig:** `NODE_ENV` **nicht** als Service-Variable setzen — npm
  überspringt sonst devDependencies beim Install, was `next build`
  bricht (Tailwind/PostCSS werden dort gebraucht). Deswegen liegen
  build-relevante Pakete (tailwindcss, postcss, autoprefixer, typescript,
  eslint/eslint-config-next) bewusst in `dependencies`, nicht
  `devDependencies`.
- Service-Variablen (`AUTH_SECRET`, `LOGIN_TOKEN`, `KASSENBUCH_SERVICE_TOKEN`,
  `CRON_SECRET`, `DATABASE_URL` als Railway-Referenzvariable
  `${{Postgres.DATABASE_URL}}`, `ATTACHMENTS_DIR=/data/uploads`) via
  `railway variable set --service kassenbuch-web`. `ANTHROPIC_API_KEY`
  und `RAILWAY_API_TOKEN` sind optional (siehe README).
- **Migrationen/Seed gegen Prod:** `railway run` injiziert nur Env-Vars lokal,
  proxied aber KEIN Netzwerk — `postgres.railway.internal` ist von außerhalb
  Railways nicht erreichbar. Stattdessen einen Tunnel aufmachen:
  `railway ssh keys add` (einmalig, liest den Key automatisch aus dem
  SSH-Agent — ein Pfad über `--key <path>` scheitert, auch wenn die Datei
  existiert), dann `railway connect Postgres --tunnel-only --port 15432`
  im Hintergrund, danach `DATABASE_URL="postgresql://...@127.0.0.1:15432/railway"
  npx prisma migrate deploy` (bzw. `npx tsx prisma/seed.ts`) gegen den Tunnel.
- **Railway-API-Tokens für den Kosten-Cron:** Account-Tokens
  (`apiTokenCreate`-Mutation oder railway.app -> Account Settings -> Tokens)
  können das GraphQL-Feld `me` nicht auflösen ("Not Authorized") - das geht
  nur mit einer interaktiven User-Session. `lib/railway.ts` nutzt deshalb
  `workspace(workspaceId: $workspaceId)`, wozu zusätzlich
  `RAILWAY_WORKSPACE_ID` (aus `railway status --json` -> `workspaceId`)
  gesetzt sein muss.
- **Anthropic-Keys für die Auto-Kategorisierung:** ein Key vom Typ
  "Persönlich"/"Alle Arbeitsbereiche" ist identity-linked und verlangt einen
  `anthropic-workspace-id`-Header (`ANTHROPIC_WORKSPACE_ID`) - die
  Workspace-ID ist in der Console aber nirgends als Klartext sichtbar
  (auch nicht per Hover/Klick aufs ⓘ). Deutlich einfacher: beim
  Key-Erstellen den Arbeitsbereich auf einen konkreten Workspace (z. B.
  "Default") statt "Alle Arbeitsbereiche" einschränken - dann ist der Key
  an genau einen Workspace gebunden und `ANTHROPIC_WORKSPACE_ID` entfällt.
- Tägliche Railway-Kosten-Cron: `.github/workflows/cron-railway-costs.yml`
  (GH-Secrets `KASSENBUCH_APP_URL`, `CRON_SECRET`).

## Analyse-Qualität: Fakten vs. Annahmen
Vor jeder Empfehlung: alle betroffenen Dateien lesen, Aussagen als Belegt /
Vermutung / Unbekannt kennzeichnen, Korrekturen offen kommunizieren (siehe
Workspace-`CLAUDE.md`).
