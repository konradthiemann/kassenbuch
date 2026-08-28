export type CsvTransaction = {
  occurredAt: Date;
  amountCents: number;
  type: "INCOME" | "EXPENSE";
  categoryName: string | null;
  description: string;
  source: string;
};

const CSV_HEADER = "Datum;Betrag;Kategorie;Beschreibung;Quelle";

function csvEscape(value: string): string {
  if (/[;"\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Expenses as negative, income as positive — comma as decimal separator (Excel/DE). */
function formatAmountForCsv(amountCents: number, type: "INCOME" | "EXPENSE"): string {
  const signedCents = type === "EXPENSE" ? -amountCents : amountCents;
  return (signedCents / 100).toFixed(2).replace(".", ",");
}

/** Semicolon-delimited, CRLF line endings — opens cleanly in German Excel. */
export function transactionsToCsv(transactions: CsvTransaction[]): string {
  const rows = transactions.map((t) =>
    [
      t.occurredAt.toISOString().slice(0, 10),
      formatAmountForCsv(t.amountCents, t.type),
      t.categoryName ?? "",
      t.description,
      t.source
    ]
      .map(csvEscape)
      .join(";")
  );

  return [CSV_HEADER, ...rows].join("\r\n");
}
