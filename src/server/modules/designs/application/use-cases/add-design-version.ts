import "server-only";

import { TRPCError } from "@trpc/server";

import type { DesignDetailDto } from "../dto/design";
import type { DesignsRepository } from "../ports/designs-repository";

export function addDesignVersion(repository: DesignsRepository) {
  return async (
    designId: string,
    input: { title: string; description: string; imageUrl: string },
  ): Promise<DesignDetailDto> => {
    const existing = await repository.getById(designId);
    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Diseño no encontrado." });
    }
    return repository.addVersion(designId, input);
  };
}
