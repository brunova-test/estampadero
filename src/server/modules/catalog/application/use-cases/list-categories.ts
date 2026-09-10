import "server-only";

import type { CatalogRepository } from "../ports/catalog-repository";

export function listCategories(repository: CatalogRepository) {
  return () => repository.listCategories();
}
