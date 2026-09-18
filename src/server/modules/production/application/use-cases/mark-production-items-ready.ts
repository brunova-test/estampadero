import "server-only";

import type { ProductionRepository } from "../ports/production-repository";

export function markProductionItemsReady(repository: ProductionRepository) {
  return (itemIds: string[]): Promise<string[]> =>
    repository.markItemsReady(itemIds);
}
