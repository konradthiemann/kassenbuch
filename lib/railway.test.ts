import { describe, expect, it } from "vitest";

import { parseRailwayInvoicesResponse } from "./railway";

describe("parseRailwayInvoicesResponse", () => {
  it("extracts invoices from the workspace's customer", () => {
    const json = {
      data: {
        workspace: {
          customer: {
            invoices: [
              { invoiceId: "in_1", total: 919, status: "paid", periodStart: "2026-07-14T10:30:03.000Z", periodEnd: "2026-08-14T10:30:03.000Z" },
              { invoiceId: "in_2", total: 500, status: "open", periodStart: "2026-08-14T10:30:03.000Z", periodEnd: "2026-09-14T10:30:03.000Z" }
            ]
          }
        }
      }
    };

    const invoices = parseRailwayInvoicesResponse(json);
    expect(invoices).toEqual([
      { invoiceId: "in_1", totalCents: 919, status: "paid", periodStart: "2026-07-14T10:30:03.000Z", periodEnd: "2026-08-14T10:30:03.000Z" },
      { invoiceId: "in_2", totalCents: 500, status: "open", periodStart: "2026-08-14T10:30:03.000Z", periodEnd: "2026-09-14T10:30:03.000Z" }
    ]);
  });

  it("returns an empty array when there are no invoices", () => {
    const json = { data: { workspace: { customer: { invoices: [] } } } };
    expect(parseRailwayInvoicesResponse(json)).toEqual([]);
  });

  it("throws with the GraphQL error message when the API returns errors instead of data", () => {
    const json = { data: null, errors: [{ message: "Not Authorized" }] };
    expect(() => parseRailwayInvoicesResponse(json)).toThrow("Not Authorized");
  });

  it("throws on an unexpected response shape instead of silently returning garbage", () => {
    expect(() => parseRailwayInvoicesResponse({ nonsense: true })).toThrow();
  });
});
