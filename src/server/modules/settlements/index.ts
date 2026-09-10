import { generateDueSettlements } from "./application/use-cases/generate-settlement";
import { prismaSettlementsRepository } from "./infrastructure/persistence/prisma-settlements-repository";

export { settlementsRouter } from "./presentation/router";
export type {
  SettlementDetailDto,
  SettlementGenerationResultDto,
  SettlementItemDto,
  SettlementSummaryDto,
} from "./application/dto/settlement";

export const generateDueSettlementsUseCase = generateDueSettlements(
  prismaSettlementsRepository,
);
