import "server-only";

import type { ProductionOrderGroupDto } from "../dto/batch";
import type { ProductionRepository } from "../ports/production-repository";

export function listProductionOrders(repository: ProductionRepository) {
  return (): Promise<ProductionOrderGroupDto[]> =>
    repository.listProductionOrders();
}
