import { resolveRateForProduct } from "./application/use-cases/resolve-rate-for-product";
import { prismaAgreementsRepository } from "./infrastructure/persistence/prisma-agreements-repository";

export { agreementsRouter } from "./presentation/router";
export type {
  AgreementDetailDto,
  AgreementChangeDto,
  AgreementProductRateDto,
  AgreementSummaryDto,
} from "./application/dto/agreement";

/**
 * Public use case for other modules (commissions) to resolve the
 * applicable percentage for a club + product at the moment of sale.
 */
export const resolveRateForProductUseCase = resolveRateForProduct(
  prismaAgreementsRepository,
);
