import "server-only";

import { TRPCError } from "@trpc/server";

import type { ProductionRepository } from "../ports/production-repository";

export function closeBatch(repository: ProductionRepository) {
  return async (batchId: string): Promise<void> => {
    const wasClosed = await repository.closeBatch(batchId);
    if (!wasClosed) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Esta tanda ya fue cerrada.",
      });
    }
  };
}
