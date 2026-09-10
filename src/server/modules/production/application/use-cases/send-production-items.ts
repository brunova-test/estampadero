import "server-only";

import type { ProductionRepository } from "../ports/production-repository";

export function sendProductionItems(repository: ProductionRepository) {
  return (itemIds: string[], delayDays: number): Promise<string[]> =>
    repository.sendItems(itemIds, delayDays);
}
