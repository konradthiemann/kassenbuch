import { z } from "zod";

export type RailwayInvoice = {
  invoiceId: string;
  totalCents: number;
  status: string;
  periodStart: string;
  periodEnd: string;
};

const RAILWAY_GRAPHQL_ENDPOINT = "https://backboard.railway.app/graphql/v2";

const INVOICES_QUERY = `query { me { workspaces { customer { invoices { invoiceId total status periodStart periodEnd } } } } }`;

const invoicesResponseSchema = z.object({
  data: z.object({
    me: z.object({
      workspaces: z.array(
        z.object({
          customer: z.object({
            invoices: z.array(
              z.object({
                invoiceId: z.string(),
                total: z.number().int(),
                status: z.string(),
                periodStart: z.string(),
                periodEnd: z.string()
              })
            )
          })
        })
      )
    })
  })
});

/** Flattens invoices across every workspace the token's owner belongs to. */
export function parseRailwayInvoicesResponse(json: unknown): RailwayInvoice[] {
  const parsed = invoicesResponseSchema.parse(json);
  return parsed.data.me.workspaces.flatMap((workspace) =>
    workspace.customer.invoices.map((invoice) => ({
      invoiceId: invoice.invoiceId,
      totalCents: invoice.total,
      status: invoice.status,
      periodStart: invoice.periodStart,
      periodEnd: invoice.periodEnd
    }))
  );
}

export async function fetchRailwayInvoices(apiToken: string): Promise<RailwayInvoice[]> {
  const res = await fetch(RAILWAY_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiToken}` },
    body: JSON.stringify({ query: INVOICES_QUERY })
  });

  if (!res.ok) {
    throw new Error(`Railway API request failed: ${res.status}`);
  }

  return parseRailwayInvoicesResponse(await res.json());
}
