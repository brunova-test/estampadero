import { z } from "zod";

import { safeTextSchema } from "elestampadero/server/security/safe-text";

export const listAgreementsByClubInputSchema = z.object({
  clubId: z.string().min(1).max(60),
});

export const createAgreementInputSchema = z.object({
  clubId: z.string().min(1).max(60),
  code: safeTextSchema({ min: 3, max: 40 }),
  title: safeTextSchema({ min: 3, max: 160 }),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  basePercentage: z.number().int().min(0).max(100),
  settlementMethod: z.enum(["TRANSFER", "SPLIT_MP"]),
  settlementFrequency: z.literal("AUTOMATIC").default("AUTOMATIC"),
  contractUrl: z.string().url().max(500).optional(),
  productRates: z
    .array(
      z.object({
        productId: z.string().min(1).max(60),
        percentage: z.number().int().min(0).max(100),
      }),
    )
    .max(250)
    .default([]),
});

export const updateAgreementInputSchema = createAgreementInputSchema
  .omit({ clubId: true })
  .extend({ id: z.string().min(1).max(60) });

export const changeAgreementStatusInputSchema = z.object({
  id: z.string().min(1).max(60),
  status: z.enum(["ACTIVE", "PAUSED", "CANCELLED"]),
});

export const setProductRateInputSchema = z.object({
  agreementId: z.string().min(1).max(60),
  productId: z.string().min(1).max(60),
  percentage: z.number().int().min(0).max(100),
});
