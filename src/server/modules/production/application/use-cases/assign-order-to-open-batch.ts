import "server-only";

import type { ProductionRepository } from "../ports/production-repository";

export function assignOrderToOpenBatch(repository: ProductionRepository) {
  return (orderId: string): Promise<void> =>
    repository.assignOrderToOpenBatch(orderId);
}
