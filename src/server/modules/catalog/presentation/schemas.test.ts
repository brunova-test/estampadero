import { describe, expect, it } from "vitest";

import { createAdminProductInputSchema } from "./schemas";

const validProduct = {
  name: "Remera entrenamiento",
  code: "REM-100",
  description: "Tela deportiva",
  priceInCents: 2_450_000,
  compareAtCents: null,
  line: "TRAINING" as const,
  status: "PUBLISHED" as const,
  clubId: null,
  allowsCustomPrint: true,
  isFeatured: false,
  images: [
    {
      url: "/images/remera.png",
      alt: "Remera negra",
      color: "Negro",
    },
  ],
  variants: [{ size: "M", color: "Negro", stock: 10, sku: "REM-100-NEGRO-M" }],
};

describe("createAdminProductInputSchema", () => {
  it("accepts a complete product", () => {
    expect(createAdminProductInputSchema.safeParse(validProduct).success).toBe(
      true,
    );
  });

  it("rejects executable image URLs and scripts in text", () => {
    const result = createAdminProductInputSchema.safeParse({
      ...validProduct,
      name: "<script>alert(1)</script>",
      images: [{ url: "javascript:alert(1)", alt: null, color: null }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate size and color combinations", () => {
    const result = createAdminProductInputSchema.safeParse({
      ...validProduct,
      variants: [
        ...validProduct.variants,
        { size: "m", color: "negro", stock: 4, sku: "OTRO-SKU" },
      ],
    });
    expect(result.success).toBe(false);
  });
});
