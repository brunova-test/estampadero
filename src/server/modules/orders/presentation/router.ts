import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  adminMutationRateLimit,
  createTRPCRouter,
  getClientIp,
  publicProcedure,
  rateLimit,
  staffProcedure,
} from "elestampadero/server/api/trpc";
import { sendOrderReceiptEmail } from "elestampadero/server/modules/payments/infrastructure/order-receipt-email";
import { syncCommissionEligibilityForOrder } from "elestampadero/server/modules/commissions";
import { assignOrderToOpenBatchUseCase } from "elestampadero/server/modules/production";

import { getMetrics } from "../application/use-cases/get-metrics";
import { getOrderById } from "../application/use-cases/get-order-by-id";
import { listOrders } from "../application/use-cases/list-orders";
import { prismaOrdersRepository } from "../infrastructure/persistence/prisma-orders-repository";
import { updateOrderStatus } from "../application/use-cases/update-order-status";
import {
  listOrdersInputSchema,
  updateOrderStatusInputSchema,
  createExternalOrderInputSchema,
} from "./schemas";

const getOrderByIdUseCase = getOrderById(prismaOrdersRepository);
const listOrdersUseCase = listOrders(prismaOrdersRepository);
const updateOrderStatusUseCase = updateOrderStatus(prismaOrdersRepository);
const getMetricsUseCase = getMetrics(prismaOrdersRepository);
const PAID_ORDER_STATUSES = new Set([
  "PAID",
  "IN_PRODUCTION",
  "READY_FOR_SHIPPING",
  "SHIPPED",
  "DELIVERED",
]);

export const ordersRouter = createTRPCRouter({
  byId: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => getOrderByIdUseCase(input.id)),

  sendReceipt: publicProcedure
    .input(z.object({ id: z.string().min(1).max(60) }))
    .use(
      rateLimit<{ id: string }>({
        limit: 3,
        windowMs: 10 * 60_000,
        key: ({ ctx, input }) =>
          `order-receipt:${input.id}:${getClientIp(ctx.headers)}`,
      }),
    )
    .mutation(async ({ input }) => {
      const order = await getOrderByIdUseCase(input.id);
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      if (!PAID_ORDER_STATUSES.has(order.status)) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "El comprobante solo se envía para pedidos pagados.",
        });
      }
      await sendOrderReceiptEmail(order);
      return { sent: true };
    }),

  list: staffProcedure
    .input(listOrdersInputSchema)
    .query(({ input }) => listOrdersUseCase(input)),

  updateStatus: staffProcedure
    .input(updateOrderStatusInputSchema)
    .use(adminMutationRateLimit("orders.updateStatus"))
    .mutation(async ({ input }) => {
      const order = await updateOrderStatusUseCase(
        input.id,
        input.status,
        input.note ?? null,
      );
      await syncCommissionEligibilityForOrder(input.id);
      return order;
    }),

  createExternal: staffProcedure
    .input(createExternalOrderInputSchema)
    .use(adminMutationRateLimit("orders.createExternal"))
    .mutation(async ({ input }) => {
      const order = await prismaOrdersRepository.createExternalOrder(input);
      await assignOrderToOpenBatchUseCase(order.id);
      return order;
    }),

  metrics: staffProcedure
    .input(
      z.object({
        period: z.enum(["day", "week", "month", "year"]).default("month"),
      }),
    )
    .query(({ input }) => getMetricsUseCase(input.period)),
});
