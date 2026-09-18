import "server-only";

import { TRPCError } from "@trpc/server";

import type { DesignDetailDto } from "../dto/design";
import type { DesignsRepository } from "../ports/designs-repository";

export function updateDesignVersion(repository: DesignsRepository) {
  return async (input: {
    designId: string;
    versionId: string;
    imageUrl: string;
    changeNote: string;
    authorUserId: string;
    authorName: string;
  }): Promise<DesignDetailDto> => {
    const design = await repository.getById(input.designId);
    if (!design) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Diseño no encontrado.",
      });
    }
    const version = design.versions.find((item) => item.id === input.versionId);
    if (!version) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Versión no encontrada.",
      });
    }
    if (
      design.status !== "CHANGES_REQUESTED" &&
      version.status !== "CHANGES_REQUESTED"
    ) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Solo podés modificar una versión con cambios solicitados.",
      });
    }
    return repository.updateVersion(input);
  };
}
