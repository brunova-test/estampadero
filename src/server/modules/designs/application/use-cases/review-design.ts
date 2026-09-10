import "server-only";

import { TRPCError } from "@trpc/server";

import type { DesignDetailDto } from "../dto/design";
import type { DesignsRepository } from "../ports/designs-repository";

interface ReviewDesignDeps {
  repository: DesignsRepository;
}

async function requireReviewableDesign(
  repository: DesignsRepository,
  designId: string,
): Promise<DesignDetailDto> {
  const design = await repository.getById(designId);
  if (!design) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Diseño no encontrado.",
    });
  }
  if (design.status === "APPROVED") {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Este diseño ya fue aprobado.",
    });
  }
  return design;
}

export function approveDesign(deps: ReviewDesignDeps) {
  return async (input: { designId: string; versionId: string }): Promise<void> => {
    const design = await requireReviewableDesign(deps.repository, input.designId);
    if (!design.versions.some((version) => version.id === input.versionId)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "La versión no pertenece al diseño." });
    }
    await deps.repository.setStatus(design.id, "APPROVED", input.versionId);
  };
}

export function requestDesignChanges(deps: ReviewDesignDeps) {
  return async (input: {
    designId: string;
    versionId: string;
    authorUserId: string;
    authorName: string;
    message: string;
  }): Promise<void> => {
    const design = await requireReviewableDesign(deps.repository, input.designId);
    if (!design.versions.some((version) => version.id === input.versionId)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "La versión no pertenece al diseño." });
    }
    await deps.repository.addComment(input);
    await deps.repository.setStatus(input.designId, "CHANGES_REQUESTED", input.versionId);
  };
}

export function addDesignComment(deps: ReviewDesignDeps) {
  return (input: {
    designId: string;
    versionId?: string;
    authorUserId: string;
    authorName: string;
    message: string;
  }): Promise<void> => deps.repository.addComment(input);
}

export function sendDesignToClub(deps: ReviewDesignDeps) {
  return async (input: {
    designId: string;
    authorUserId: string;
    authorName: string;
  }): Promise<void> => {
    const design = await deps.repository.getById(input.designId);
    if (!design) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Diseño no encontrado.",
      });
    }
    if (design.versions.length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cargá una versión antes de enviar la propuesta.",
      });
    }
    await deps.repository.setStatus(input.designId, "SENT_TO_CLUB");
    await deps.repository.addComment({
      ...input,
      versionId: design.versions.at(-1)?.id,
      message: `Versión ${design.latestVersionNumber} enviada al club para revisión.`,
    });
  };
}
