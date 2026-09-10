import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  adminMutationRateLimit,
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "elestampadero/server/api/trpc";
import { listClubIdsForUser } from "elestampadero/server/modules/clubs";

import { generateDueSettlements } from "../application/use-cases/generate-settlement";
import { getSettlementById } from "../application/use-cases/get-settlement-by-id";
import { listSettlements } from "../application/use-cases/list-settlements";
import { markSettlementPaid } from "../application/use-cases/mark-settlement-paid";
import { prismaSettlementsRepository } from "../infrastructure/persistence/prisma-settlements-repository";
import {
  listSettlementsInputSchema,
  listSettlementMovementsInputSchema,
  markSettlementPaidInputSchema,
} from "./schemas";

const listSettlementsUseCase = listSettlements(prismaSettlementsRepository);
const getSettlementByIdUseCase = getSettlementById(prismaSettlementsRepository);
const generateDueSettlementsUseCase = generateDueSettlements(
  prismaSettlementsRepository,
);
const markSettlementPaidUseCase = markSettlementPaid(
  prismaSettlementsRepository,
);

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

export const settlementsRouter = createTRPCRouter({
  listMovements: adminProcedure
    .input(listSettlementMovementsInputSchema)
    .query(({ input }) => prismaSettlementsRepository.listMovements!(input)),

  listByClub: protectedProcedure
    .input(listSettlementsInputSchema)
    .query(async ({ ctx, input }) => {
      if (input.clubId) {
        await assertClubAccess(
          ctx.session.user.id,
          ctx.session.user.role,
          input.clubId,
        );
      } else if (!ADMIN_ROLES.has(ctx.session.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return listSettlementsUseCase(input);
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const settlement = await getSettlementByIdUseCase(input.id);
      if (!settlement) return null;
      await assertClubAccess(
        ctx.session.user.id,
        ctx.session.user.role,
        settlement.clubId,
      );
      return settlement;
    }),

  generateDue: adminProcedure
    .use(adminMutationRateLimit("settlements.generateDue", { limit: 5 }))
    .mutation(({ ctx }) => generateDueSettlementsUseCase(ctx.session.user.id)),

  markPaid: adminProcedure
    .input(markSettlementPaidInputSchema)
    .use(adminMutationRateLimit("settlements.markPaid"))
    .mutation(({ ctx, input }) =>
      markSettlementPaidUseCase({
        settlementId: input.settlementId,
        receiptUrl: input.receiptUrl,
        confirmedByUserId: ctx.session.user.id,
      }),
    ),
});
