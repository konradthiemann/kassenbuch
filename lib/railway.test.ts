import { describe, expect, it } from "vitest";

import { parseRailwayInvoicesResponse } from "./railway";

describe("parseRailwayInvoicesResponse", () => {
  it("flattens invoices across workspaces", () => {
    const json = {
      data: {
        me: {
          workspaces: [
            {
              customer: {
                invoices: [
                  { invoiceId: "in_1", total: 919, status: "paid", periodStart: "2026-07-14T10:30:03.000Z", periodEnd: "2026-08-14T10:30:03.000Z" }
                ]
              }
            },
            {
              customer: {
                invoices: [
                  { invoiceId: "in_2", total: 500, status: "open", periodStart: "2026-08-14T10:30:03.000Z", periodEnd: "2026-09-14T10:30:03.000Z" }
                ]
              }
            }
          ]
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
    const json = { data: { me: { workspaces: [{ customer: { invoices: [] } }] } } };
    expect(parseRailwayInvoicesResponse(json)).toEqual([]);
  });

  it("throws on an unexpected response shape instead of silently returning garbage", () => {
    expect(() => parseRailwayInvoicesResponse({ errors: [{ message: "unauthorized" }] })).toThrow();
  });
});
