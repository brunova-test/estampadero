import "server-only";

import type { BatchDetailDto } from "../dto/batch";
import type { ProductionRepository } from "../ports/production-repository";

export function getBatchById(repository: ProductionRepository) {
  return (id: string): Promise<BatchDetailDto | null> =>
    repository.getBatchById(id);
}
