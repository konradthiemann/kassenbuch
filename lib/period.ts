export type DateRange = { from: Date; to: Date };

/** [from, to) — from is the 1st of the month, to is the 1st of the next month (UTC). */
export function currentMonthRange(now: Date = new Date()): DateRange {
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { from, to };
}
