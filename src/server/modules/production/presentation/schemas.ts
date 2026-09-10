import { z } from "zod";

export const setPeriodDaysInputSchema = z.object({
  batchId: z.string().min(1).max(60),
  periodDays: z.number().int().min(1).max(60),
});

export const batchIdInputSchema = z.object({
  batchId: z.string().min(1).max(60),
});

export const productionItemIdsInputSchema = z.object({
  itemIds: z.array(z.string().min(1).max(60)).min(1).max(100),
});

export const sendProductionItemsInputSchema =
  productionItemIdsInputSchema.extend({
    delayDays: z.number().int().min(0).max(60),
  });

export const productionOrderIdInputSchema = z.object({
  orderId: z.string().min(1).max(60),
});

export const createManualProductionItemInputSchema = z.object({
  productName: z.string().trim().min(2).max(160),
  size: z.string().trim().min(1).max(80),
  color: z.string().trim().min(1).max(80),
  quantity: z.number().int().min(1).max(10_000),
  notes: z.string().trim().max(500).optional(),
});
