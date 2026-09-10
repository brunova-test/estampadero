import { describe, expect, it } from "vitest";

import { submitCheckoutInputSchema } from "./schemas";

const validInput = {
  contactName: "Ana Pérez",
  customerDocument: "30111222",
  contactEmail: "ana@example.com",
  contactPhone: "1122334455",
  deliveryMethod: "SHIPPING" as const,
  shippingAddress: "Calle 123",
  shippingCity: "Buenos Aires",
  shippingPostalCode: "1000",
  lines: [{ variantId: "variant-1", quantity: 1 }],
};

describe("submitCheckoutInputSchema", () => {
  it("rejects executable content in customer fields", () => {
    const result = submitCheckoutInputSchema.safeParse({
      ...validInput,
      contactName: '<img src=x onerror="alert(1)">',
    });

    expect(result.success).toBe(false);
  });

  it("returns a clear error when the name is too short", () => {
    const result = submitCheckoutInputSchema.safeParse({
      ...validInput,
      contactName: "A",
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.flatten().fieldErrors.contactName).toEqual([
      "El nombre debe tener al menos 2 caracteres.",
    ]);
  });

  it("returns clear messages for invalid checkout fields", () => {
    const result = submitCheckoutInputSchema.safeParse({
      ...validInput,
      contactEmail: "correo-invalido",
      contactPhone: "123",
      shippingAddress: "A",
      shippingCity: "B",
      shippingPostalCode: "1",
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    const errors = result.error.flatten().fieldErrors;
    expect(errors.contactEmail?.[0]).toBe(
      "Ingresá un correo electrónico válido.",
    );
    expect(errors.contactPhone?.[0]).toBe(
      "El teléfono debe tener al menos 6 números.",
    );
    expect(errors.shippingAddress?.[0]).toBe(
      "La dirección debe tener al menos 5 caracteres.",
    );
    expect(errors.shippingCity?.[0]).toBe(
      "La ciudad debe tener al menos 2 caracteres.",
    );
    expect(errors.shippingPostalCode?.[0]).toBe(
      "El código postal debe tener al menos 2 caracteres.",
    );
  });

  it("requires the buyer document used by Mobbex", () => {
    const result = submitCheckoutInputSchema.safeParse({
      ...validInput,
      customerDocument: undefined,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(
      result.error.flatten().fieldErrors.customerDocument?.[0],
    ).toBeDefined();
  });
});
