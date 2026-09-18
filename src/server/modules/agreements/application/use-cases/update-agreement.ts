import "server-only";

import { TRPCError } from "@trpc/server";

import type { AgreementDetailDto } from "../dto/agreement";
import type {
  AgreementsRepository,
  UpdateAgreementInput,
} from "../ports/agreements-repository";

export function updateAgreement(repository: AgreementsRepository) {
  return async (input: UpdateAgreementInput): Promise<AgreementDetailDto> => {
    if (input.endDate <= input.startDate) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "La fecha de fin debe ser posterior al inicio.",
      });
    }
    return repository.updateAgreement(input);
  };
}
