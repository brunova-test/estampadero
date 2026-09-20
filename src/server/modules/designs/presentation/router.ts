import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  adminMutationRateLimit,
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "elestampadero/server/api/trpc";
import { listClubIdsForUser } from "elestampadero/server/modules/clubs";

import { addDesignVersion } from "../application/use-cases/add-design-version";
import { updateDesignVersion } from "../application/use-cases/update-design-version";
import { createDesign } from "../application/use-cases/create-design";
import { getDesignById } from "../application/use-cases/get-design-by-id";
import {
  linkDesignProduct,
  unlinkDesignProduct,
} from "../application/use-cases/link-product";
import { listAllDesigns } from "../application/use-cases/list-all-designs";
import { listDesignsByClub } from "../application/use-cases/list-designs-by-club";
import {
  addDesignComment,
  approveDesign,
  requestDesignChanges,
  sendDesignToClub,
} from "../application/use-cases/review-design";
import { prismaDesignsRepository } from "../infrastructure/persistence/prisma-designs-repository";
import {
  addDesignCommentInputSchema,
  addDesignVersionInputSchema,
  createDesignInputSchema,
  linkProductInputSchema,
  listDesignsByClubInputSchema,
  requestDesignChangesInputSchema,
  updateDesignVersionInputSchema,
} from "./schemas";

const listAllDesignsUseCase = listAllDesigns(prismaDesignsRepository);
const listDesignsByClubUseCase = listDesignsByClub(prismaDesignsRepository);
const getDesignByIdUseCase = getDesignById(prismaDesignsRepository);
const createDesignUseCase = createDesign(prismaDesignsRepository);
const addDesignVersionUseCase = addDesignVersion(prismaDesignsRepository);
const updateDesignVersionUseCase = updateDesignVersion(prismaDesignsRepository);
const approveDesignUseCase = approveDesign({
  repository: prismaDesignsRepository,
});
const requestDesignChangesUseCase = requestDesignChanges({
  repository: prismaDesignsRepository,
});
const addDesignCommentUseCase = addDesignComment({
  repository: prismaDesignsRepository,
});
const sendDesignToClubUseCase = sendDesignToClub({
  repository: prismaDesignsRepository,
});
const linkDesignProductUseCase = linkDesignProduct(prismaDesignsRepository);
const unlinkDesignProductUseCase = unlinkDesignProduct(prismaDesignsRepository);

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);
const CLUB_DECISION_ROLES = new Set(["ADMIN", "SUPER_ADMIN", "CLUB_ADMIN"]);

async function assertClubAccess(
  userId: string,
  role: string,
  clubId: string,
): Promise<void> {
  if (ADMIN_ROLES.has(role)) return;
  const authorizedClubIds = await listClubIdsForUser(userId);
  if (!authorizedClubIds.includes(clubId)) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
}


async function assertDesignAccess(
  userId: string,
  role: string,
  designId: string,
) {
  const design = await getDesignByIdUseCase(designId);
  if (!design) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Diseño no encontrado.",
    });
  }
  if (design.clubId) {
    await assertClubAccess(userId, role, design.clubId);
  } else if (!ADMIN_ROLES.has(role)) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  if (design.status === "PENDING_SEND" && !ADMIN_ROLES.has(role)) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Esta versión todavía no fue enviada al club.",
    });
  }
  return design;
}

export const designsRouter = createTRPCRouter({
  listAll: adminProcedure.query(() => listAllDesignsUseCase()),

  listByClub: protectedProcedure
    .input(listDesignsByClubInputSchema)
    .query(async ({ ctx, input }) => {
      await assertClubAccess(
        ctx.session.user.id,
        ctx.session.user.role,
        input.clubId,
      );
      const designs = await listDesignsByClubUseCase(input.clubId);
      return ADMIN_ROLES.has(ctx.session.user.role)
        ? designs
        : designs.filter((design) => design.status !== "PENDING_SEND");
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ ctx, input }) =>
      assertDesignAccess(ctx.session.user.id, ctx.session.user.role, input.id),
    ),

  create: adminProcedure
    .input(createDesignInputSchema)
    .use(adminMutationRateLimit("designs.create"))
    .mutation(({ input }) => createDesignUseCase(input)),

  addVersion: adminProcedure
    .input(addDesignVersionInputSchema)
    .use(adminMutationRateLimit("designs.addVersion"))
    .mutation(({ input }) =>
      addDesignVersionUseCase(input.designId, input),
    ),

  updateVersion: adminProcedure
    .input(updateDesignVersionInputSchema)
    .use(adminMutationRateLimit("designs.updateVersion"))
    .mutation(({ ctx, input }) =>
      updateDesignVersionUseCase({
        ...input,
        authorUserId: ctx.session.user.id,
        authorName: ctx.session.user.name ?? "Administración",
      }),
    ),

  sendToClub: adminProcedure
    .input(z.object({ designId: z.string().min(1).max(60) }))
    .use(adminMutationRateLimit("designs.sendToClub"))
    .mutation(({ ctx, input }) =>
      sendDesignToClubUseCase({
        designId: input.designId,
        authorUserId: ctx.session.user.id,
        authorName: ctx.session.user.name ?? "Administración",
      }),
    ),

  approve: protectedProcedure
    .input(z.object({ designId: z.string().min(1), versionId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const design = await assertDesignAccess(
        ctx.session.user.id,
        ctx.session.user.role,
        input.designId,
      );
      if (!CLUB_DECISION_ROLES.has(ctx.session.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await approveDesignUseCase({ designId: design.id, versionId: input.versionId });
    }),

  requestChanges: protectedProcedure
    .input(requestDesignChangesInputSchema)
    .mutation(async ({ ctx, input }) => {
      const design = await assertDesignAccess(
        ctx.session.user.id,
        ctx.session.user.role,
        input.designId,
      );
      if (!CLUB_DECISION_ROLES.has(ctx.session.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await requestDesignChangesUseCase({
        designId: design.id,
        versionId: input.versionId,
        authorUserId: ctx.session.user.id,
        authorName: ctx.session.user.name ?? "Club",
        message: input.message,
      });
    }),

  addComment: protectedProcedure
    .input(addDesignCommentInputSchema)
    .mutation(async ({ ctx, input }) => {
      const design = await assertDesignAccess(
        ctx.session.user.id,
        ctx.session.user.role,
        input.designId,
      );
      await addDesignCommentUseCase({
        designId: design.id,
        versionId: input.versionId,
        authorUserId: ctx.session.user.id,
        authorName: ctx.session.user.name ?? "Usuario",
        message: input.message,
      });
    }),

  linkProduct: adminProcedure
    .input(linkProductInputSchema)
    .use(adminMutationRateLimit("designs.linkProduct"))
    .mutation(({ input }) =>
      linkDesignProductUseCase(input.designId, input.productId),
    ),

  unlinkProduct: adminProcedure
    .input(linkProductInputSchema)
    .use(adminMutationRateLimit("designs.unlinkProduct"))
    .mutation(({ input }) =>
      unlinkDesignProductUseCase(input.designId, input.productId),
    ),
});
