const formatter = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

/** Formats integer euro-cents (never floats) as a localized EUR string. */
export function formatEuroCents(cents: number): string {
  return formatter.format(cents / 100);
}
