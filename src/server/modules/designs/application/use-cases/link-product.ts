import "server-only";

import { TRPCError } from "@trpc/server";

import type { DesignsRepository } from "../ports/designs-repository";

export function linkDesignProduct(repository: DesignsRepository) {
  return async (designId: string, productId: string): Promise<void> => {
    const design = await repository.getById(designId);
    if (!design) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Diseño no encontrado." });
    }
    if (design.status !== "APPROVED") {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Solo se pueden vincular productos a un diseño aprobado.",
      });
    }
    await repository.linkProduct(designId, productId);
  };
}

export function unlinkDesignProduct(repository: DesignsRepository) {
  return (designId: string, productId: string): Promise<void> =>
    repository.unlinkProduct(designId, productId);
}
