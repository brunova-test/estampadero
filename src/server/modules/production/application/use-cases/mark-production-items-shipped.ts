import "server-only";

import type { ProductionRepository } from "../ports/production-repository";

export function markProductionItemsShipped(repository: ProductionRepository) {
  return (itemIds: string[]): Promise<string[]> =>
    repository.markItemsShipped(itemIds);
}
