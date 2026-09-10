import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  adminMutationRateLimit,
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "elestampadero/server/api/trpc";
import { listClubIdsForUser } from "elestampadero/server/modules/clubs";

import { createAgreement } from "../application/use-cases/create-agreement";
import { changeAgreementStatus } from "../application/use-cases/change-agreement-status";
import { getAgreementById } from "../application/use-cases/get-agreement-by-id";
import { listAgreementsByClub } from "../application/use-cases/list-agreements-by-club";
import { setProductRate } from "../application/use-cases/set-product-rate";
import { updateAgreement } from "../application/use-cases/update-agreement";
import { prismaAgreementsRepository } from "../infrastructure/persistence/prisma-agreements-repository";
import {
  changeAgreementStatusInputSchema,
  createAgreementInputSchema,
  listAgreementsByClubInputSchema,
  setProductRateInputSchema,
  updateAgreementInputSchema,
} from "./schemas";

const listAgreementsByClubUseCase = listAgreementsByClub(
  prismaAgreementsRepository,
);
const getAgreementByIdUseCase = getAgreementById(prismaAgreementsRepository);
const createAgreementUseCase = createAgreement(prismaAgreementsRepository);
const updateAgreementUseCase = updateAgreement(prismaAgreementsRepository);
const changeAgreementStatusUseCase = changeAgreementStatus(
  prismaAgreementsRepository,
);
const setProductRateUseCase = setProductRate(prismaAgreementsRepository);

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

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

export const agreementsRouter = createTRPCRouter({
  listByClub: protectedProcedure
    .input(listAgreementsByClubInputSchema)
    .query(async ({ ctx, input }) => {
      await assertClubAccess(
        ctx.session.user.id,
        ctx.session.user.role,
        input.clubId,
      );
      return listAgreementsByClubUseCase(input.clubId);
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const agreement = await getAgreementByIdUseCase(input.id);
      if (!agreement) return null;
      await assertClubAccess(
        ctx.session.user.id,
        ctx.session.user.role,
        agreement.clubId,
      );
      return agreement;
    }),

  create: adminProcedure
    .input(createAgreementInputSchema)
    .use(adminMutationRateLimit("agreements.create"))
    .mutation(({ ctx, input }) =>
      createAgreementUseCase({
        ...input,
        contractUrl: input.contractUrl ?? null,
        changedByUserId: ctx.session.user.id,
      }),
    ),

  update: adminProcedure
    .input(updateAgreementInputSchema)
    .use(adminMutationRateLimit("agreements.update"))
    .mutation(({ ctx, input }) =>
      updateAgreementUseCase({
        ...input,
        contractUrl: input.contractUrl ?? null,
        changedByUserId: ctx.session.user.id,
      }),
    ),

  changeStatus: adminProcedure
    .input(changeAgreementStatusInputSchema)
    .use(adminMutationRateLimit("agreements.changeStatus"))
    .mutation(({ ctx, input }) =>
      changeAgreementStatusUseCase({
        ...input,
        action:
          input.status === "PAUSED"
            ? "PAUSED"
            : input.status === "CANCELLED"
              ? "CANCELLED"
              : "REACTIVATED",
        changedByUserId: ctx.session.user.id,
      }),
    ),

  setProductRate: adminProcedure
    .input(setProductRateInputSchema)
    .use(adminMutationRateLimit("agreements.setProductRate"))
    .mutation(({ ctx, input }) =>
      setProductRateUseCase(
        input.agreementId,
        input.productId,
        input.percentage,
        ctx.session.user.id,
      ),
    ),
});
