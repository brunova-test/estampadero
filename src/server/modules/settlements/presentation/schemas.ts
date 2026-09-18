import { z } from "zod";

export const settlementStatusSchema = z.enum([
  "PENDING_PAYMENT",
  "PAID",
  "CANCELLED",
]);

export const listSettlementsInputSchema = z.object({
  clubId: z.string().min(1).max(60).optional(),
  status: settlementStatusSchema.optional(),
});

export const listSettlementMovementsInputSchema = z.object({
  search: z.string().trim().max(120).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  hourFrom: z.number().int().min(0).max(23).optional(),
  hourTo: z.number().int().min(0).max(23).optional(),
});

export const markSettlementPaidInputSchema = z.object({
  settlementId: z.string().min(1).max(60),
  receiptUrl: z
    .string()
    .regex(/^\/api\/documents\/[a-z0-9-]{10,60}$/i)
    .max(500),
});
