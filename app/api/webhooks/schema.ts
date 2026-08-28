import { z } from "zod";

export const transactionEventSchema = z.object({
  source: z.string().min(1),
  externalId: z.string().min(1),
  amountCents: z.number().int().positive(),
  occurredAt: z.string().datetime(),
  description: z.string().min(1),
  category: z.string().min(1).optional()
});

export type TransactionEvent = z.infer<typeof transactionEventSchema>;
