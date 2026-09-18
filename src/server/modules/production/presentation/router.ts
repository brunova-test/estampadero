import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  adminMutationRateLimit,
  createTRPCRouter,
  staffProcedure,
} from "elestampadero/server/api/trpc";

import { closeBatch } from "../application/use-cases/close-batch";
import { getBatchById } from "../application/use-cases/get-batch-by-id";
import { getOpenBatch } from "../application/use-cases/get-open-batch";
import { listBatches } from "../application/use-cases/list-batches";
import { listProductionOrders } from "../application/use-cases/list-production-orders";
import { markProductionItemsReady } from "../application/use-cases/mark-production-items-ready";
import { markProductionItemsShipped } from "../application/use-cases/mark-production-items-shipped";
import { sendProductionItems } from "../application/use-cases/send-production-items";
import { setPeriodDays } from "../application/use-cases/set-period-days";
import { prismaProductionRepository } from "../infrastructure/persistence/prisma-production-repository";
import {
  batchIdInputSchema,
  createManualProductionItemInputSchema,
  productionItemIdsInputSchema,
  productionOrderIdInputSchema,
  sendProductionItemsInputSchema,
  setPeriodDaysInputSchema,
} from "./schemas";
import { syncCommissionEligibilityForOrder } from "elestampadero/server/modules/commissions";

const getOpenBatchUseCase = getOpenBatch(prismaProductionRepository);
const getBatchByIdUseCase = getBatchById(prismaProductionRepository);
const listBatchesUseCase = listBatches(prismaProductionRepository);
const setPeriodDaysUseCase = setPeriodDays(prismaProductionRepository);
const closeBatchUseCase = closeBatch(prismaProductionRepository);
const listProductionOrdersUseCase = listProductionOrders(
  prismaProductionRepository,
);
const sendProductionItemsUseCase = sendProductionItems(
  prismaProductionRepository,
);
const markProductionItemsReadyUseCase = markProductionItemsReady(
  prismaProductionRepository,
);
const markProductionItemsShippedUseCase = markProductionItemsShipped(
  prismaProductionRepository,
);

async function syncAffectedOrders(orderIds: string[]) {
  await Promise.all(
    orderIds.map((orderId) => syncCommissionEligibilityForOrder(orderId)),
  );
}

export const productionRouter = createTRPCRouter({
  openBatch: staffProcedure.query(() => getOpenBatchUseCase()),

  byId: staffProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => getBatchByIdUseCase(input.id)),

  list: staffProcedure.query(() => listBatchesUseCase()),

  setPeriod: staffProcedure
    .input(setPeriodDaysInputSchema)
    .use(adminMutationRateLimit("production.setPeriod"))
    .mutation(({ input }) =>
      setPeriodDaysUseCase(input.batchId, input.periodDays),
    ),

  closeBatch: staffProcedure
    .input(batchIdInputSchema)
    .use(adminMutationRateLimit("production.closeBatch"))
    .mutation(({ input }) => closeBatchUseCase(input.batchId)),

  orders: staffProcedure.query(() => listProductionOrdersUseCase()),

  history: staffProcedure.query(() =>
    prismaProductionRepository.listProductionHistory(),
  ),

  removedOrders: staffProcedure.query(() =>
    prismaProductionRepository.listRemovedOrders(),
  ),

  removeOrder: staffProcedure
    .input(productionOrderIdInputSchema)
    .use(adminMutationRateLimit("production.removeOrder"))
    .mutation(async ({ input }) => {
      const removed =
        await prismaProductionRepository.removeOrderFromProduction(
          input.orderId,
        );
      if (!removed) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "El pedido ya no está disponible en Producción.",
        });
      }
      return { removed: true };
    }),

  restoreOrder: staffProcedure
    .input(productionOrderIdInputSchema)
    .use(adminMutationRateLimit("production.restoreOrder"))
    .mutation(async ({ input }) => {
      const restored =
        await prismaProductionRepository.restoreOrderToProduction(
          input.orderId,
        );
      if (!restored) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "El pedido ya fue cargado o dejó de estar disponible.",
        });
      }
      return { restored: true };
    }),

  createManualItem: staffProcedure
    .input(createManualProductionItemInputSchema)
    .use(adminMutationRateLimit("production.createManualItem"))
    .mutation(async ({ input }) => {
      await prismaProductionRepository.createManualItem(input);
      return { created: true };
    }),

  sendItems: staffProcedure
    .input(sendProductionItemsInputSchema)
    .use(adminMutationRateLimit("production.sendItems"))
    .mutation(async ({ input }) => {
      const orderIds = await sendProductionItemsUseCase(
        input.itemIds,
        input.delayDays,
      );
      await syncAffectedOrders(orderIds);
      return { updated: input.itemIds.length };
    }),

  markReady: staffProcedure
    .input(productionItemIdsInputSchema)
    .use(adminMutationRateLimit("production.markReady"))
    .mutation(async ({ input }) => {
      const orderIds = await markProductionItemsReadyUseCase(input.itemIds);
      await syncAffectedOrders(orderIds);
      return { updated: input.itemIds.length };
    }),

  markShipped: staffProcedure
    .input(productionItemIdsInputSchema)
    .use(adminMutationRateLimit("production.markShipped"))
    .mutation(async ({ input }) => {
      const orderIds = await markProductionItemsShippedUseCase(input.itemIds);
      await syncAffectedOrders(orderIds);
      return { updated: input.itemIds.length };
    }),
});
