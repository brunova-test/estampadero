import type { ProductDetailDto } from "../dto/product-detail";
import type { ProductSummaryDto } from "../dto/product-summary";
import type { VariantForPricingDto } from "../dto/variant-pricing";

export interface ListProductsFilters {
  categorySlug?: string;
  clubSlug?: string;
  line?: string;
  search?: string;
  featured?: boolean;
  sort?: "NEWEST" | "BEST_SELLING";
}

export interface CatalogRepository {
  listPublishedProducts(
    filters: ListProductsFilters,
  ): Promise<ProductSummaryDto[]>;
  getPublishedProductBySlug(slug: string): Promise<ProductDetailDto | null>;
  listCategories(): Promise<{ slug: string; name: string }[]>;
  getVariantsForPricing(variantIds: string[]): Promise<VariantForPricingDto[]>;
}
