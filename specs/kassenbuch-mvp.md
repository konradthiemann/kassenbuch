# Spec: Kassenbuch MVP

## Problem/Ziel

Konrad meldet ein Kleingewerbe an, um seine Software-Nebenprojekte (Doewe,
Knips, agentic-infra-dashboard, ...) rechtlich sauber zu betreiben. Er kennt
sich mit Buchhaltung nicht aus und möchte keine Buchungen manuell pflegen.
Gleichzeitig verursachen die Apps schon jetzt laufende Kosten (Claude/
Anthropic-API-Aufrufe, Railway-Hosting) und könnten künftig Einnahmen
generieren.

Ziel ist ein eigenständiges Dashboard, das Kosten und (künftig) Einnahmen so
automatisiert wie möglich aus den anderen Apps sammelt, verständlich
darstellt und eine Grundlage für die jährliche Einnahmenüberschussrechnung
(EÜR) liefert — **keine GoBD-zertifizierte Steuersoftware und kein Ersatz für
einen Steuerberater**, sondern eine ehrliche, automatisierte Übersicht.

Bewusst als eigenes Repo (nicht Teil von Doewe): Doewe ist ein
Multi-Tenant-Produkt für fremde Haushalte inkl. öffentlichem Demo-Account;
Konrads eigenes Betriebsvermögen dort mit reinzumischen widerspricht der auch
steuerlich empfohlenen Trennung von Privat- und Betriebsvermögen. Kassenbuch
ist zudem ein eigenständiges Portfolio-Stück.

## User Stories

- Als Kleingewerbetreibender will ich sehen, wie viel meine Apps monatlich an
  Betriebskosten verursachen (Claude API, Railway), ohne Rechnungen manuell
  durchzugehen.
- Als Kleingewerbetreibender will ich, dass Einnahmen automatisch als Buchung
  erfasst werden, sobald eine App darüber Bescheid weiß (z. B. künftig
  Stripe), damit ich nichts vergesse.
- Als Laie in Sachen Buchhaltung will ich, dass eingehende Buchungen
  automatisch einer sinnvollen Kategorie zugeordnet werden, statt jede
  einzeln von Hand einsortieren zu müssen.
- Als Kleinunternehmer (§19 UStG) will ich am Jahresende eine Liste/einen
  Export meiner Einnahmen und Ausgaben, den ich meinem Steuerberater geben
  oder für die EÜR nutzen kann.
- Unterwegs am Handy will ich in wenigen Sekunden den aktuellen Stand
  (Einnahmen/Ausgaben/Gewinn) und die letzten Buchungen sehen, ohne
  Login-Reibung.
- Als Entwickler will ich, dass sich weitere Apps über einen dokumentierten,
  authentifizierten Webhook-Contract anschließen lassen, ohne Kassenbuch
  selbst anzufassen.
- Ich will Belege (Foto/PDF) zu einer Buchung hochladen können, unveränderbar
  abgelegt (GoBD-Grundsatz), statt sie lose im Dateisystem/Postfach zu haben.

## Akzeptanzkriterien

1. **Dashboard:** Zeigt für den gewählten Zeitraum (Standard: laufender
   Monat, umschaltbar auf Jahr) Summe Einnahmen, Summe Ausgaben und
   Gewinn/Verlust in EUR (intern immer Integer-Cents, nie Float).
2. **Buchungsliste:** Alle Buchungen mit Datum, Betrag, Kategorie, Quelle
   (App-Name/"manuell"), Kategorisierungs-Herkunft und Beleg-Link (falls
   vorhanden), neueste zuerst.
3. **Manuelle Buchung:** Ein mobil bedienbares Formular erlaubt jederzeit das
   Anlegen einer Buchung (Betrag, Datum, Kategorie, Beschreibung, optionaler
   Beleg-Upload).
4. **Kosten-Webhook:** `POST /api/webhooks/costs` nimmt mit
   Bearer-Auth (`KASSENBUCH_SERVICE_TOKEN`) Kosten-Events entgegen
   (Payload: Quelle, Betrag-Cents, Zeitpunkt, Beschreibung, `externalId`).
   Erneute Zustellung derselben `externalId` erzeugt **keine** Dublette
   (Idempotenz).
5. **Railway-Kosten (Pull statt Push):** Ein periodischer Job (z. B. täglich)
   liest Hosting-Kosten über die Railway Public API und bucht sie je Projekt
   als Ausgabe — kein Webhook von den einzelnen Apps nötig.
6. **Claude/Anthropic-Kosten:** Quellen-Apps (aktuell Doewes
   `receipt-scan`-Route) melden nach einem kostenpflichtigen Aufruf
   Token-Anzahl/geschätzte Kosten per Kosten-Webhook. Fehlt das Tracking in
   der Quelle, bleibt der Posten schlicht leer — kein Fehlerzustand.
7. **Einnahmen-Webhook (vorbereitet, nicht live):**
   `POST /api/webhooks/income` ist spezifiziert und dokumentiert
   (Stripe-Event-Contract), aber v1 hat keinen echten Absender — Doewe/Knips
   haben noch keine Stripe-Integration.
8. **Kategorisierung:** Jede Buchung hat ein Feld
   `categorySource: manual | claude | uncategorized`. Automatische
   Kategorisierung läuft, wenn `ANTHROPIC_API_KEY` gesetzt ist; ohne Key
   Stub-Verhalten (`uncategorized`, kein Fehler) — analog zu Doewes
   `receipt-scan`-Fallback.
9. **Unveränderliche Belege (GoBD):** Hochgeladene Belege lassen sich nicht
   überschreiben; Löschen ist nur als Soft-Delete mit Audit-Log-Eintrag
   möglich, nie ein Hard-Delete aus der UI.
10. **Export:** Buchungen eines Zeitraums lassen sich als CSV (Datum, Betrag,
    Kategorie, Beschreibung, Quelle) herunterladen — Grundlage für
    Steuerberater/EÜR, kein automatisiertes Steuer-Filing.
11. **Zugriff:** Solo-Login (nur Konrad), kein öffentlicher Zugriff, kein
    Multi-Tenant.
12. **Mobile-first:** Dashboard und Buchungsliste sind auf 375px-Breite ohne
    horizontales Scrollen nutzbar; "Buchung ansehen" und "neue Buchung
    anlegen" sind mit dem Daumen erreichbar (Bottom-Nav/FAB, wie bei Doewe).
13. **Kosten-Rahmen:** Hosting bleibt im Railway-Hobby-/kostenfreien Rahmen;
    einzige laufende Kosten sind optionale Anthropic-API-Aufrufe zur
    Kategorisierung (per fehlendem Key jederzeit abschaltbar).

## Out of Scope (v1)

- Umsatzsteuervoranmeldung/-erklärung (entfällt für Kleinunternehmer nach
  §19 UStG ohnehin).
- Automatisierte EÜR-Erstellung oder direktes Steuer-Filing beim Finanzamt.
- Rechnungsstellung/Rechnungsnummern-Verwaltung — nur Erfassung von
  Einnahmen, keine Rechnungs-UI.
- Live-Stripe-Integration (Contract ja, echter Absender nein — abhängig von
  Doewes/Knips' eigenem Payment-Rollout, siehe ROADMAP).
- Multi-Tenant, mehrere Nutzer, Rollen/Rechte.
- Native Mobile App (nur responsives Web/PWA).
- Bankkonto-Abgleich (PSD2/Kontoauszug-Import) — Daten kommen aus
  App-Quellen, nicht aus echten Kontobewegungen.

## Offene Fragen

- Konkrete Kategorienliste für Kleingewerbe-Ausgaben/Einnahmen (Hosting,
  API-Kosten, Software-Lizenzen, Bürobedarf, App-Einnahmen je Quelle, ...) —
  final mit Konrad bzw. Steuerberater abstimmen.
- Soll Kassenbuch die Aufbewahrungsfrist für Belege aktiv tracken
  (Erinnerung, ab wann Löschung zulässig wäre), oder reicht "nie
  automatisch löschen" als Policy?
- Deploy-Domain (z. B. `kassenbuch.konradthiemann.de`)?
- Soll ein Jahresabschluss-Export direkt per E-Mail an einen
  Steuerberater-Kontakt gehen, oder reicht reiner Download?
- Rechtsform-Klärung (Kleinunternehmer §19 UStG vs. Regelbesteuerung) läuft
  bei Konrad noch über die Gewerbeanmeldung — diese Spec geht von
  Kleinunternehmer aus, das Datenmodell sollte ein optionales USt-Feld aber
  nicht hart ausschließen, falls sich das später ändert.
