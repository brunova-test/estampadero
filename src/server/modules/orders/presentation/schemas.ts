import { z } from "zod";

import { safeTextSchema } from "elestampadero/server/security/safe-text";

export const orderStatusSchema = z.enum([
  "PENDING_PAYMENT",
  "PAID",
  "IN_PRODUCTION",
  "READY_FOR_SHIPPING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);

export const listOrdersInputSchema = z.object({
  status: orderStatusSchema.optional(),
  search: z.string().trim().max(100).optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  paymentCategory: z.enum(["ACTIVE", "REJECTED"]).default("ACTIVE"),
});

export const updateOrderStatusInputSchema = z.object({
  id: z.string().min(1).max(60),
  status: orderStatusSchema,
  note: safeTextSchema({ max: 300 }).optional(),
});

export const createExternalOrderInputSchema = z.object({
    contactName: safeTextSchema({ min: 2, max: 120 }),
    customerDocument: safeTextSchema({ max: 20 }).nullable().optional(),
  contactEmail: z.string().email().max(160),
  contactPhone: safeTextSchema({ min: 6, max: 30 }),
  deliveryMethod: z.enum(["SHIPPING", "PICKUP"]),
  shippingAddress: safeTextSchema({ max: 200 }).nullable(),
  shippingCity: safeTextSchema({ max: 100 }).nullable(),
  shippingPostalCode: safeTextSchema({ max: 20 }).nullable(),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1).max(60),
        quantity: z.number().int().min(1).max(100),
      }),
    )
    .min(1)
    .max(50),
});
