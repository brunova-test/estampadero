import "server-only";

import { TRPCError } from "@trpc/server";

import type { ProductionRepository } from "../ports/production-repository";

export function setPeriodDays(repository: ProductionRepository) {
  return async (batchId: string, periodDays: number): Promise<void> => {
    if (periodDays < 1 || periodDays > 60) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "El período debe estar entre 1 y 60 días.",
      });
    }
    await repository.setPeriodDays(batchId, periodDays);
  };
}
