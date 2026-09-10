import "server-only";

import type { ProductSummaryDto } from "../dto/product-summary";
import type {
  CatalogRepository,
  ListProductsFilters,
} from "../ports/catalog-repository";

export function listProducts(repository: CatalogRepository) {
  return (filters: ListProductsFilters): Promise<ProductSummaryDto[]> =>
    repository.listPublishedProducts(filters);
}
