import "server-only";

import type { BatchSummaryDto } from "../dto/batch";
import type { ProductionRepository } from "../ports/production-repository";

export function listBatches(repository: ProductionRepository) {
  return (): Promise<BatchSummaryDto[]> => repository.listBatches();
}
