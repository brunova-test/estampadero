import { describe, expect, it } from "vitest";

import { checkCartAvailability } from "./check-cart-availability";

const variantBase = {
  variantId: "variant-1",
  size: "M",
  color: "Negro",
  productId: "product-1",
  productName: "Remera",
  productSlug: "remera",
  priceInCents: 10_000,
  imageUrl: null,
  clubId: null,
  clubName: null,
};

describe("checkCartAvailability", () => {
  it("treats missing stock as unavailable when stock is controlled", async () => {
    const check = checkCartAvailability({
      getVariantsForPricing: async () => [
        { ...variantBase, showStock: true, stock: null },
      ],
    });

    await expect(
      check([{ variantId: variantBase.variantId, quantity: 1 }]),
    ).resolves.toEqual([
      {
        variantId: variantBase.variantId,
        isAvailable: false,
        availableStock: 0,
        reason: "INSUFFICIENT_STOCK",
      },
    ]);
  });

  it("keeps on-demand variants available without a stock value", async () => {
    const check = checkCartAvailability({
      getVariantsForPricing: async () => [
        { ...variantBase, showStock: false, stock: null },
      ],
    });

    await expect(
      check([{ variantId: variantBase.variantId, quantity: 5 }]),
    ).resolves.toEqual([
      {
        variantId: variantBase.variantId,
        isAvailable: true,
        availableStock: null,
        reason: null,
      },
    ]);
  });

  it("treats an explicit zero as unavailable for on-demand products", async () => {
    const check = checkCartAvailability({
      getVariantsForPricing: async () => [
        { ...variantBase, showStock: false, stock: 0 },
      ],
    });

    await expect(
      check([{ variantId: variantBase.variantId, quantity: 1 }]),
    ).resolves.toEqual([
      {
        variantId: variantBase.variantId,
        isAvailable: false,
        availableStock: 0,
        reason: "INSUFFICIENT_STOCK",
      },
    ]);
  });
});
