import "server-only";

import type { BatchDetailDto } from "../dto/batch";
import type { ProductionRepository } from "../ports/production-repository";

export function getOpenBatch(repository: ProductionRepository) {
  return (): Promise<BatchDetailDto> => repository.getOpenBatch();
}
