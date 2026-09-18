import "server-only";

import { TRPCError } from "@trpc/server";

import type { AgreementDetailDto } from "../dto/agreement";
import type {
  AgreementsRepository,
  CreateAgreementInput,
} from "../ports/agreements-repository";

export function createAgreement(repository: AgreementsRepository) {
  return async (input: CreateAgreementInput): Promise<AgreementDetailDto> => {
    if (input.basePercentage < 0 || input.basePercentage > 100) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "El porcentaje base debe estar entre 0 y 100.",
      });
    }
    if (input.endDate <= input.startDate) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "La fecha de fin debe ser posterior al inicio.",
      });
    }

    return repository.createAgreement(input);
  };
}
