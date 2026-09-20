import { resolveRateForProduct } from "./application/use-cases/resolve-rate-for-product";
import { prismaAgreementsRepository } from "./infrastructure/persistence/prisma-agreements-repository";

export { agreementsRouter } from "./presentation/router";
export type {
  AgreementDetailDto,
  AgreementChangeDto,
  AgreementProductRateDto,
  AgreementSummaryDto,
} from "./application/dto/agreement";





export const resolveRateForProductUseCase = resolveRateForProduct(
  prismaAgreementsRepository,
);
