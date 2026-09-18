import "server-only";

import type { ProductDetailDto } from "../dto/product-detail";
import type { CatalogRepository } from "../ports/catalog-repository";

export function getProductBySlug(repository: CatalogRepository) {
  return (slug: string): Promise<ProductDetailDto | null> =>
    repository.getPublishedProductBySlug(slug);
}
