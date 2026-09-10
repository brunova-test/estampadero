import "server-only";

import type { VariantForPricingDto } from "../dto/variant-pricing";
import type { CatalogRepository } from "../ports/catalog-repository";

export function getVariantsForPricing(repository: CatalogRepository) {
  return (variantIds: string[]): Promise<VariantForPricingDto[]> =>
    repository.getVariantsForPricing(variantIds);
}
