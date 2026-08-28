import { describe, expect, it } from "vitest";

import { transactionsToCsv } from "./csv";

describe("transactionsToCsv", () => {
  it("writes a header and one semicolon-separated row per transaction", () => {
    const csv = transactionsToCsv([
      {
        occurredAt: new Date("2026-08-15T00:00:00.000Z"),
        amountCents: 1250,
        type: "EXPENSE",
        categoryName: "Hosting & Infrastruktur",
        description: "Railway invoice",
        source: "railway"
      }
    ]);

    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("Datum;Betrag;Kategorie;Beschreibung;Quelle");
    expect(lines[1]).toBe("2026-08-15;-12,50;Hosting & Infrastruktur;Railway invoice;railway");
  });

  it("formats income as a positive amount", () => {
    const csv = transactionsToCsv([
      {
        occurredAt: new Date("2026-08-01T00:00:00.000Z"),
        amountCents: 5000,
        type: "INCOME",
        categoryName: null,
        description: "App revenue",
        source: "manual"
      }
    ]);

    expect(csv.split("\r\n")[1]).toBe("2026-08-01;50,00;;App revenue;manual");
  });

  it("quotes a description containing a semicolon", () => {
    const csv = transactionsToCsv([
      {
        occurredAt: new Date("2026-08-01T00:00:00.000Z"),
        amountCents: 100,
        type: "EXPENSE",
        categoryName: null,
        description: "Kaffee; Snacks",
        source: "manual"
      }
    ]);

    expect(csv.split("\r\n")[1]).toBe('2026-08-01;-1,00;;"Kaffee; Snacks";manual');
  });

  it("returns just the header for an empty list", () => {
    expect(transactionsToCsv([])).toBe("Datum;Betrag;Kategorie;Beschreibung;Quelle");
  });
});
