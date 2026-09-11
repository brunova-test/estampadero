import "server-only";

import type { VariantForPricingDto } from "elestampadero/server/modules/catalog";

interface CartAvailabilityLine {
  variantId: string;
  quantity: number;
}

interface CheckCartAvailabilityDeps {
  getVariantsForPricing: (
    variantIds: string[],
  ) => Promise<VariantForPricingDto[]>;
}

export function checkCartAvailability(deps: CheckCartAvailabilityDeps) {
  return async (lines: CartAvailabilityLine[]) => {
    const variants = await deps.getVariantsForPricing(
      lines.map((line) => line.variantId),
    );
    const variantsById = new Map(
      variants.map((variant) => [variant.variantId, variant]),
    );

    return lines.map((line) => {
      const variant = variantsById.get(line.variantId);
      const hasEnoughStock =
        !variant?.showStock ||
        variant.stock === null ||
        variant.stock >= line.quantity;

      return {
        variantId: line.variantId,
        isAvailable: Boolean(variant) && hasEnoughStock,
        reason: !variant
          ? ("UNAVAILABLE" as const)
          : !hasEnoughStock
            ? ("INSUFFICIENT_STOCK" as const)
            : null,
      };
    });
  };
}
