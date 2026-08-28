import { z } from "zod";

export const createTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amountCents: z.number().int().positive(),
  occurredAt: z.string().datetime(),
  description: z.string().min(1),
  categoryId: z.string().min(1).optional()
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
