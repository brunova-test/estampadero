import { z } from "zod";

import { safeTextSchema } from "elestampadero/server/security/safe-text";

const checkoutLineSchema = z.object({
  variantId: z.string().min(1).max(60),
  quantity: z.number().int().min(1).max(20),
});

export const cartAvailabilityInputSchema = z.object({
  lines: z.array(checkoutLineSchema).min(1).max(40),
});

export const submitCheckoutInputSchema = z
  .object({
    checkoutRequestId: z.string().uuid(),
    contactName: safeTextSchema({
      min: 2,
      max: 120,
      minMessage: "El nombre debe tener al menos 2 caracteres.",
      maxMessage: "El nombre no puede superar los 120 caracteres.",
    }),
    customerDocument: z
      .string()
      .trim()
      .regex(/^\d{7,11}$/, "El DNI debe tener entre 7 y 11 números."),
    contactEmail: z
      .string()
      .trim()
      .email("Ingresá un correo electrónico válido.")
      .max(180, "El correo no puede superar los 180 caracteres."),
    contactPhone: z
      .string()
      .trim()
      .min(6, "El teléfono debe tener al menos 6 números.")
      .max(15, "El teléfono no puede superar los 15 números.")
      .regex(/^\d+$/, "El teléfono solo puede contener números."),
    deliveryMethod: z.enum(["SHIPPING", "PICKUP"]),
    shippingAddress: safeTextSchema({
      min: 5,
      max: 200,
      minMessage: "La dirección debe tener al menos 5 caracteres.",
      maxMessage: "La dirección no puede superar los 200 caracteres.",
    }).optional(),
    shippingCity: safeTextSchema({
      min: 2,
      max: 120,
      minMessage: "La ciudad debe tener al menos 2 caracteres.",
      maxMessage: "La ciudad no puede superar los 120 caracteres.",
    }).optional(),
    shippingPostalCode: safeTextSchema({
      min: 2,
      max: 20,
      minMessage: "El código postal debe tener al menos 2 caracteres.",
      maxMessage: "El código postal no puede superar los 20 caracteres.",
    }).optional(),
    lines: z.array(checkoutLineSchema).min(1).max(40),
  })
  .refine(
    (input) => input.deliveryMethod !== "SHIPPING" || !!input.shippingAddress,
    { path: ["shippingAddress"], message: "La dirección es obligatoria." },
  );
