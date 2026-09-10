import "server-only";

import { TRPCError } from "@trpc/server";

import type { AgreementsRepository } from "../ports/agreements-repository";

export function setProductRate(repository: AgreementsRepository) {
  return async (
    agreementId: string,
    productId: string,
    percentage: number,
    changedByUserId: string,
  ): Promise<void> => {
    if (percentage < 0 || percentage > 100) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "El porcentaje debe estar entre 0 y 100.",
      });
    }
    await repository.setProductRate(
      agreementId,
      productId,
      percentage,
      changedByUserId,
    );
  };
}
