import { z } from "zod";

export const createCheckoutSessionInputSchema = z.object({
  orderId: z.string().min(1).max(60),
  paymentAttemptId: z.string().uuid(),
});

export const tokenizeCardInputSchema = z.object({
  cardNumber: z.string().regex(/^\d{12,19}$/),
  securityCode: z.string().regex(/^\d{3,4}$/),
  cardHolderName: z.string().min(1).max(100),
  expirationMonth: z.string().regex(/^\d{2}$/),
  expirationYear: z.string().regex(/^\d{2}$/),
  docType: z.string().min(1).max(10),
  docNumber: z.string().min(1).max(20),


  paymentMethodId: z.string().min(1).max(10),
});

export const refundPaymentInputSchema = z.object({
  paymentId: z.string().min(1).max(60),

  amountInCents: z.number().int().positive().optional(),
});

export const queryPaymentStatusInputSchema = z.object({
  paymentId: z.string().min(1).max(60),
});

export const voidRefundInputSchema = z.object({
  paymentId: z.string().min(1).max(60),
});

export const setRefundReferenceInputSchema = z.object({
  paymentId: z.string().min(1).max(60),
  providerRefundId: z.string().trim().min(1).max(120),
});

export const payWithCardInputSchema = z.object({
  orderId: z.string().min(1).max(60),
  paymentAttemptId: z.string().uuid(),
  cardToken: z.string().min(1).max(200),
  bin: z
    .string()
    .regex(/^\d{6,8}$/)
    .optional(),
  paymentMethodId: z.string().min(1).max(60),
  issuerId: z.string().max(60).optional(),
  installments: z.number().int().min(1).max(24),
  payerDocType: z.string().max(10).optional(),
  payerDocNumber: z.string().max(30).optional(),
});
