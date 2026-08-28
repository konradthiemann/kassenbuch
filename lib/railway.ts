import { z } from "zod";

export type RailwayInvoice = {
  invoiceId: string;
  totalCents: number;
  status: string;
  periodStart: string;
  periodEnd: string;
};

const RAILWAY_GRAPHQL_ENDPOINT = "https://backboard.railway.app/graphql/v2";

// Account-scoped API tokens (apiTokenCreate) can't resolve `me` — that needs
// an interactive user session. `workspace(workspaceId: ...)` works for both,
// so the workspace ID is required (RAILWAY_WORKSPACE_ID).
const INVOICES_QUERY = `query($workspaceId: String!) { workspace(workspaceId: $workspaceId) { customer { invoices { invoiceId total status periodStart periodEnd } } } }`;

const graphqlErrorSchema = z.object({
  errors: z.array(z.object({ message: z.string() })).min(1)
});

const invoicesResponseSchema = z.object({
  data: z.object({
    workspace: z.object({
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
  })
});

export function parseRailwayInvoicesResponse(json: unknown): RailwayInvoice[] {
  const errorResult = graphqlErrorSchema.safeParse(json);
  if (errorResult.success) {
    throw new Error(`Railway API error: ${errorResult.data.errors.map((e) => e.message).join(", ")}`);
  }

  const parsed = invoicesResponseSchema.parse(json);
  return parsed.data.workspace.customer.invoices.map((invoice) => ({
    invoiceId: invoice.invoiceId,
    totalCents: invoice.total,
    status: invoice.status,
    periodStart: invoice.periodStart,
    periodEnd: invoice.periodEnd
  }));
}

export async function fetchRailwayInvoices(apiToken: string, workspaceId: string): Promise<RailwayInvoice[]> {
  const res = await fetch(RAILWAY_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiToken}` },
    body: JSON.stringify({ query: INVOICES_QUERY, variables: { workspaceId } })
  });

  if (!res.ok) {
    throw new Error(`Railway API request failed: ${res.status}`);
  }

  return parseRailwayInvoicesResponse(await res.json());
}
