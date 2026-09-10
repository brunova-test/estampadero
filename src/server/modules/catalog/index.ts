import { getVariantsForPricing } from "./application/use-cases/get-variants-for-pricing";
import { prismaCatalogRepository } from "./infrastructure/persistence/prisma-catalog-repository";

export { catalogRouter } from "./presentation/router";
export type { ProductSummaryDto } from "./application/dto/product-summary";
export type {
  ProductDetailDto,
  ProductVariantDto,
} from "./application/dto/product-detail";
export type { VariantForPricingDto } from "./application/dto/variant-pricing";

/**
 * Public use case for other modules (e.g. checkout) that need authoritative
 * pricing/stock for a set of variants. Bound to the Prisma repository.
 */
export const getVariantsForPricingUseCase = getVariantsForPricing(
  prismaCatalogRepository,
);
