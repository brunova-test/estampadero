import { assignOrderToOpenBatch } from "./application/use-cases/assign-order-to-open-batch";
import { prismaProductionRepository } from "./infrastructure/persistence/prisma-production-repository";

export { productionRouter } from "./presentation/router";
export type {
  BatchDetailDto,
  BatchOrderDto,
  BatchSummaryDto,
  ProductionItemDto,
  ProductionItemStatusDto,
  ProductionOrderGroupDto,
} from "./application/dto/batch";

/**
 * Public use case for the payments module: assigns a just-paid order to the
 * current open production batch (creating one if needed).
 */
export const assignOrderToOpenBatchUseCase = assignOrderToOpenBatch(
  prismaProductionRepository,
);
