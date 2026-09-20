import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "elestampadero/server/api/trpc";
import { listClubIdsForUser } from "elestampadero/server/modules/clubs";

import { getClubBalance } from "../application/use-cases/get-club-balance";
import { listClubCommissions } from "../application/use-cases/list-club-commissions";
import { prismaCommissionsRepository } from "../infrastructure/persistence/prisma-commissions-repository";

const listClubCommissionsUseCase = listClubCommissions(
  prismaCommissionsRepository,
);
const getClubBalanceUseCase = getClubBalance(prismaCommissionsRepository);

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

const clubIdInput = z.object({ clubId: z.string().min(1).max(60) });

export const commissionsRouter = createTRPCRouter({
  listByClub: protectedProcedure
    .input(clubIdInput)
    .query(async ({ ctx, input }) => {
      await assertClubAccess(ctx.session.user.id, ctx.session.user.role, input.clubId);
      return listClubCommissionsUseCase(input.clubId);
    }),

  balance: protectedProcedure
    .input(clubIdInput)
    .query(async ({ ctx, input }) => {
      await assertClubAccess(ctx.session.user.id, ctx.session.user.role, input.clubId);
      return getClubBalanceUseCase(input.clubId);
    }),
});
