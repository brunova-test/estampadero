import "server-only";

import type {
  OrderStatus,
  Prisma,
  ProductionItemStatus,
} from "generated/prisma";

import { db } from "elestampadero/server/db";

import type {
  BatchDetailDto,
  BatchSummaryDto,
  CreateManualProductionItemInput,
  ProductionHistoryEntryDto,
  ProductionOrderGroupDto,
  RemovedProductionOrderDto,
} from "../../application/dto/batch";
import type { ProductionRepository } from "../../application/ports/production-repository";

const batchOrdersInclude = {
  orders: {
    select: {
      id: true,
      orderNumber: true,
      contactName: true,
      status: true,
      totalInCents: true,
      items: { select: { quantity: true, clubNameSnapshot: true } },
    },
  },
} as const;

const openBatchOrdersInclude = {
  orders: {
    where: {
      productionRemovedAt: null,
      status: { in: ["PAID", "IN_PRODUCTION"] as OrderStatus[] },
    },
    select: batchOrdersInclude.orders.select,
  },
} satisfies Prisma.ProductionBatchInclude;

type BatchWithOrders = {
  id: string;
  batchNumber: number;
  periodDays: number;
  status: string;
  createdAt: Date;
  closedAt: Date | null;
  orders: {
    id: string;
    orderNumber: number;
    contactName: string;
    status: string;
    totalInCents: number;
    items: { quantity: number; clubNameSnapshot: string | null }[];
  }[];
};

function toSummary(batch: BatchWithOrders): BatchSummaryDto {
  const unitCount = batch.orders.reduce(
    (sum, order) =>
      sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0,
  );

  return {
    id: batch.id,
    batchNumber: batch.batchNumber,
    periodDays: batch.periodDays,
    status: batch.status,
    orderCount: batch.orders.length,
    unitCount,
    totalPendingInCents: batch.orders.reduce(
      (sum, order) => sum + order.totalInCents,
      0,
    ),
    createdAt: batch.createdAt.toISOString(),
    closedAt: batch.closedAt?.toISOString() ?? null,
  };
}

function toDetail(batch: BatchWithOrders): BatchDetailDto {
  const orders = batch.orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    contactName: order.contactName,
    clubName:
      order.items.find((item) => item.clubNameSnapshot)?.clubNameSnapshot ??
      null,
    unitCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    status: order.status,
  }));

  return { ...toSummary(batch), orders };
}

async function findOrCreateOpenBatch(tx: Prisma.TransactionClient) {
  const existing = await tx.productionBatch.findFirst({
    where: { status: "OPEN" },
  });
  if (existing) return existing;
  return tx.productionBatch.create({ data: {} });
}

async function syncOrderStatus(
  tx: Prisma.TransactionClient,
  orderId: string,
  note: string,
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: {
      status: true,
      items: { select: { productionStatus: true } },
    },
  });
  if (!order || order.status === "CANCELLED" || order.items.length === 0)
    return;

  const statuses = order.items.map((item) => item.productionStatus);
  let nextStatus: OrderStatus;
  if (statuses.every((status) => status === "DELIVERED")) {
    nextStatus = "DELIVERED";
  } else if (statuses.every((status) => status === "SHIPPED")) {
    nextStatus = "SHIPPED";
  } else if (
    statuses.every(
      (status) =>
        status === "READY" || status === "SHIPPED" || status === "DELIVERED",
    )
  ) {
    nextStatus = order.status === "SHIPPED" ? "SHIPPED" : "READY_FOR_SHIPPING";
  } else if (statuses.some((status) => status === "IN_PRODUCTION")) {
    nextStatus = "IN_PRODUCTION";
  } else {
    nextStatus = "PAID";
  }

  if (order.status === nextStatus) return;
  await tx.order.update({
    where: { id: orderId },
    data: {
      status: nextStatus,
      deliveredAt: nextStatus === "DELIVERED" ? new Date() : undefined,
    },
  });
  await tx.orderStatusHistory.create({
    data: { orderId, status: nextStatus, note },
  });
}

async function promoteDueItems() {
  const now = new Date();
  const dueItems = await db.orderItem.findMany({
    where: {
      productionStatus: "SCHEDULED",
      productionScheduledAt: { lte: now },
      order: { productionRemovedAt: null },
    },
    select: { id: true, orderId: true },
  });
  if (dueItems.length > 0) {
    await db.$transaction(async (tx) => {
      await tx.orderItem.updateMany({
        where: { id: { in: dueItems.map((item) => item.id) } },
        data: {
          productionStatus: "IN_PRODUCTION",
          productionStartedAt: now,
        },
      });
      for (const orderId of new Set(dueItems.map((item) => item.orderId))) {
        await syncOrderStatus(
          tx,
          orderId,
          "Los productos programados ingresaron a producción",
        );
      }
    });
  }

  await db.manualProductionItem.updateMany({
    where: {
      productionStatus: "SCHEDULED",
      productionScheduledAt: { lte: now },
    },
    data: {
      productionStatus: "IN_PRODUCTION",
      productionStartedAt: now,
    },
  });
}

async function updateItemStatus(
  itemIds: string[],
  allowedStatuses: ProductionItemStatus[],
  data: Prisma.OrderItemUpdateManyMutationInput,
  note: string,
) {
  return db.$transaction(async (tx) => {
    const manualIds = itemIds
      .filter((id) => id.startsWith("manual:"))
      .map((id) => id.slice("manual:".length));
    const orderItemIds = itemIds.filter((id) => !id.startsWith("manual:"));
    const items = await tx.orderItem.findMany({
      where: {
        id: { in: orderItemIds },
        productionStatus: { in: allowedStatuses },
        order: {
          productionRemovedAt: null,
          status: {
            in: [
              "PAID",
              "IN_PRODUCTION",
              "READY_FOR_SHIPPING",
              "SHIPPED",
              "DELIVERED",
            ],
          },
        },
      },
      select: { id: true, orderId: true },
    });
    if (items.length > 0) {
      await tx.orderItem.updateMany({
        where: { id: { in: items.map((item) => item.id) } },
        data,
      });
    }
    if (manualIds.length > 0) {
      await tx.manualProductionItem.updateMany({
        where: {
          id: { in: manualIds },
          productionStatus: { in: allowedStatuses },
        },
        data,
      });
    }
    const orderIds = [...new Set(items.map((item) => item.orderId))];
    for (const orderId of orderIds) {
      await syncOrderStatus(tx, orderId, note);
    }
    return orderIds;
  });
}

async function closeFinishedOpenBatches() {
  await db.$transaction(async (tx) => {
    const openBatches = await tx.productionBatch.findMany({
      where: { status: "OPEN" },
      select: {
        id: true,
        orders: {
          where: { productionRemovedAt: null },
          select: {
            items: {
              where: { productionStatus: "WAITING" },
              take: 1,
              select: { id: true },
            },
          },
        },
      },
    });
    const finishedIds = openBatches
      .filter(
        (batch) =>
          batch.orders.length > 0 &&
          batch.orders.every((order) => order.items.length === 0),
      )
      .map((batch) => batch.id);
    if (finishedIds.length === 0) return;

    await tx.productionBatch.updateMany({
      where: { id: { in: finishedIds }, status: "OPEN" },
      data: { status: "CLOSED", closedAt: new Date() },
    });
    const remainingOpenBatch = await tx.productionBatch.findFirst({
      where: { status: "OPEN" },
      select: { id: true },
    });
    if (!remainingOpenBatch) await tx.productionBatch.create({ data: {} });
  });
}

export const prismaProductionRepository: ProductionRepository = {
  async getOpenBatch(): Promise<BatchDetailDto> {
    const batch = await db.$transaction(async (tx) =>
      findOrCreateOpenBatch(tx),
    );
    const full = await db.productionBatch.findUniqueOrThrow({
      where: { id: batch.id },
      include: openBatchOrdersInclude,
    });
    return toDetail(full);
  },

  async getBatchById(id: string): Promise<BatchDetailDto | null> {
    const batch = await db.productionBatch.findUnique({
      where: { id },
      include: batchOrdersInclude,
    });
    return batch ? toDetail(batch) : null;
  },

  async listBatches(): Promise<BatchSummaryDto[]> {
    const batches = await db.productionBatch.findMany({
      include: batchOrdersInclude,
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return batches.map(toSummary);
  },

  async setPeriodDays(batchId: string, periodDays: number): Promise<void> {
    await db.productionBatch.update({
      where: { id: batchId },
      data: { periodDays },
    });
  },

  async assignOrderToOpenBatch(orderId: string): Promise<void> {
    await db.$transaction(async (tx) => {
      const batch = await findOrCreateOpenBatch(tx);
      await tx.order.updateMany({
        where: { id: orderId, status: "PAID" },
        data: { productionBatchId: batch.id },
      });
    });
  },

  async closeBatch(batchId: string): Promise<boolean> {
    return db.$transaction(async (tx) => {
      const updateResult = await tx.productionBatch.updateMany({
        where: { id: batchId, status: "OPEN" },
        data: { status: "CLOSED", closedAt: new Date() },
      });
      if (updateResult.count === 0) return false;

      const paidOrders = await tx.order.findMany({
        where: { productionBatchId: batchId, status: "PAID" },
        select: { id: true },
      });

      for (const order of paidOrders) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: "IN_PRODUCTION" },
        });
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: "IN_PRODUCTION",
            note: "Tanda de producción cerrada",
          },
        });
      }


      await tx.productionBatch.create({ data: {} });

      return true;
    });
  },

  async listProductionOrders(): Promise<ProductionOrderGroupDto[]> {
    await promoteDueItems();
    const [orders, manualItems] = await Promise.all([
      db.order.findMany({
        where: {
          productionRemovedAt: null,
          status: {
            in: [
              "PAID",
              "IN_PRODUCTION",
              "READY_FOR_SHIPPING",
              "SHIPPED",
              "DELIVERED",
            ],
          },
        },
        orderBy: [{ createdAt: "asc" }, { orderNumber: "asc" }],
        select: {
          id: true,
          orderNumber: true,
          contactName: true,
          contactEmail: true,
          createdAt: true,
          productionBatch: { select: { batchNumber: true } },
          payments: {
            where: {
              status: {
                in: ["APPROVED", "PARTIALLY_REFUNDED", "REFUNDED", "CANCELLED"],
              },
            },
            orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }],
            take: 1,
            select: { status: true, approvedAt: true, createdAt: true },
          },
          items: {
            orderBy: { productName: "asc" },
            select: {
              id: true,
              productName: true,
              productSlug: true,
              imageUrl: true,
              size: true,
              color: true,
              quantity: true,
              clubId: true,
              clubNameSnapshot: true,
              productionStatus: true,
              productionScheduledAt: true,
              productionStartedAt: true,
              productionReadyAt: true,
              productionShippedAt: true,
              productionDeliveredAt: true,
            },
          },
        },
      }),
      db.manualProductionItem.findMany({ orderBy: { createdAt: "asc" } }),
    ]);

    const clubIds = [
      ...new Set(
        orders.flatMap((order) =>
          order.items.flatMap((item) => (item.clubId ? [item.clubId] : [])),
        ),
      ),
    ];
    const clubs = clubIds.length
      ? await db.club.findMany({
          where: { id: { in: clubIds } },
          select: { id: true, name: true, logoUrl: true },
        })
      : [];
    const clubById = new Map(clubs.map((club) => [club.id, club]));

    const orderGroups: ProductionOrderGroupDto[] = orders.map((order) => {
      const payment = order.payments[0];
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        isManual: false,
        contactName: order.contactName,
        contactEmail: order.contactEmail,
        paidAt: (
          payment?.approvedAt ??
          payment?.createdAt ??
          order.createdAt
        ).toISOString(),
        paymentStatus: payment?.status ?? null,
        batchNumber: order.productionBatch?.batchNumber ?? null,
        items: order.items.map((item) => {
          const club = item.clubId ? clubById.get(item.clubId) : undefined;
          return {
            id: item.id,
            productName: item.productName,
            productSlug: item.productSlug,
            imageUrl: item.imageUrl,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            notes: null,
            status: item.productionStatus,
            scheduledAt: item.productionScheduledAt?.toISOString() ?? null,
            startedAt: item.productionStartedAt?.toISOString() ?? null,
            readyAt: item.productionReadyAt?.toISOString() ?? null,
            shippedAt: item.productionShippedAt?.toISOString() ?? null,
            deliveredAt: item.productionDeliveredAt?.toISOString() ?? null,
            club: item.clubId
              ? {
                  id: item.clubId,
                  name: club?.name ?? item.clubNameSnapshot ?? "Institución",
                  logoUrl: club?.logoUrl ?? null,
                }
              : null,
          };
        }),
      };
    });
    const manualGroups: ProductionOrderGroupDto[] = manualItems.map((item) => ({
      orderId: `manual:${item.id}`,
      orderNumber: null,
      isManual: true,
      contactName: "Carga manual",
      contactEmail: null,
      paidAt: item.createdAt.toISOString(),
      paymentStatus: null,
      batchNumber: null,
      items: [
        {
          id: `manual:${item.id}`,
          productName: item.productName,
          productSlug: "",
          imageUrl: null,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          notes: item.notes,
          status: item.productionStatus,
          scheduledAt: item.productionScheduledAt?.toISOString() ?? null,
          startedAt: item.productionStartedAt?.toISOString() ?? null,
          readyAt: item.productionReadyAt?.toISOString() ?? null,
          shippedAt: item.productionShippedAt?.toISOString() ?? null,
          deliveredAt: item.productionDeliveredAt?.toISOString() ?? null,
          club: null,
        },
      ],
    }));
    return [...orderGroups, ...manualGroups];
  },

  async sendItems(itemIds: string[], delayDays: number): Promise<string[]> {
    const now = new Date();
    const scheduledAt = new Date(now.getTime() + delayDays * 86_400_000);
    const orderIds = await updateItemStatus(
      itemIds,
      ["WAITING", "SCHEDULED"],
      delayDays === 0
        ? {
            productionStatus: "IN_PRODUCTION",
            productionScheduledAt: null,
            productionStartedAt: now,
          }
        : {
            productionStatus: "SCHEDULED",
            productionScheduledAt: scheduledAt,
            productionStartedAt: null,
          },
      delayDays === 0
        ? "Productos enviados a producción"
        : `Productos programados para producción en ${delayDays} días`,
    );
    await closeFinishedOpenBatches();
    return orderIds;
  },

  async markItemsReady(itemIds: string[]): Promise<string[]> {
    return updateItemStatus(
      itemIds,
      ["IN_PRODUCTION"],
      { productionStatus: "READY", productionReadyAt: new Date() },
      "Producción finalizada para los productos seleccionados",
    );
  },

  async markItemsShipped(itemIds: string[]): Promise<string[]> {
    return updateItemStatus(
      itemIds,
      ["READY", "DELIVERED"],
      { productionStatus: "SHIPPED", productionShippedAt: new Date() },
      "Productos enviados",
    );
  },

  async listProductionHistory(): Promise<ProductionHistoryEntryDto[]> {
    const [orders, manualItems] = await Promise.all([
      db.order.findMany({
        where: {
          OR: [
            { productionRemovedAt: { not: null } },
            { items: { some: { productionStatus: "SHIPPED" } } },
          ],
        },
        select: {
          id: true,
          orderNumber: true,
          contactName: true,
          contactEmail: true,
          createdAt: true,
          productionRemovedAt: true,
          productionBatch: { select: { batchNumber: true } },
          payments: {
            where: {
              status: {
                in: ["APPROVED", "PARTIALLY_REFUNDED", "REFUNDED", "CANCELLED"],
              },
            },
            orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }],
            take: 1,
            select: { status: true, approvedAt: true, createdAt: true },
          },
          items: {
            orderBy: { productName: "asc" },
            select: {
              id: true,
              productName: true,
              productSlug: true,
              imageUrl: true,
              size: true,
              color: true,
              quantity: true,
              clubId: true,
              clubNameSnapshot: true,
              productionStatus: true,
              productionScheduledAt: true,
              productionStartedAt: true,
              productionReadyAt: true,
              productionShippedAt: true,
              productionDeliveredAt: true,
            },
          },
        },
      }),
      db.manualProductionItem.findMany({
        where: { productionStatus: "SHIPPED" },
        orderBy: { productionShippedAt: "desc" },
      }),
    ]);

    const clubIds = [
      ...new Set(
        orders.flatMap((order) =>
          order.items.flatMap((item) => (item.clubId ? [item.clubId] : [])),
        ),
      ),
    ];
    const clubs = clubIds.length
      ? await db.club.findMany({
          where: { id: { in: clubIds } },
          select: { id: true, name: true, logoUrl: true },
        })
      : [];
    const clubById = new Map(clubs.map((club) => [club.id, club]));

    const orderEntries: ProductionHistoryEntryDto[] = orders.flatMap(
      (order) => {
        const removed = order.productionRemovedAt !== null;
        const items = removed
          ? order.items
          : order.items.filter((item) => item.productionStatus === "SHIPPED");
        const historyAt = removed
          ? order.productionRemovedAt
          : items.reduce<Date | null>(
              (latest, item) =>
                !latest ||
                (item.productionShippedAt && item.productionShippedAt > latest)
                  ? item.productionShippedAt
                  : latest,
              null,
            );
        if (!historyAt || items.length === 0) return [];
        const payment = order.payments[0];
        return [
          {
            orderId: order.id,
            orderNumber: order.orderNumber,
            isManual: false,
            contactName: order.contactName,
            contactEmail: order.contactEmail,
            paidAt: (
              payment?.approvedAt ??
              payment?.createdAt ??
              order.createdAt
            ).toISOString(),
            paymentStatus: payment?.status ?? null,
            batchNumber: order.productionBatch?.batchNumber ?? null,
            historyStatus: removed ? "REMOVED" : "SHIPPED",
            historyAt: historyAt.toISOString(),
            items: items.map((item) => {
              const club = item.clubId ? clubById.get(item.clubId) : undefined;
              return {
                id: item.id,
                productName: item.productName,
                productSlug: item.productSlug,
                imageUrl: item.imageUrl,
                size: item.size,
                color: item.color,
                quantity: item.quantity,
                notes: null,
                status: item.productionStatus,
                scheduledAt: item.productionScheduledAt?.toISOString() ?? null,
                startedAt: item.productionStartedAt?.toISOString() ?? null,
                readyAt: item.productionReadyAt?.toISOString() ?? null,
                shippedAt: item.productionShippedAt?.toISOString() ?? null,
                deliveredAt: item.productionDeliveredAt?.toISOString() ?? null,
                club: item.clubId
                  ? {
                      id: item.clubId,
                      name:
                        club?.name ?? item.clubNameSnapshot ?? "Institución",
                      logoUrl: club?.logoUrl ?? null,
                    }
                  : null,
              };
            }),
          },
        ];
      },
    );

    const manualEntries: ProductionHistoryEntryDto[] = manualItems.flatMap(
      (item) => {
        if (!item.productionShippedAt) return [];
        return [
          {
            orderId: `manual:${item.id}`,
            orderNumber: null,
            isManual: true,
            contactName: "Carga manual",
            contactEmail: null,
            paidAt: item.createdAt.toISOString(),
            paymentStatus: null,
            batchNumber: null,
            historyStatus: "SHIPPED",
            historyAt: item.productionShippedAt.toISOString(),
            items: [
              {
                id: `manual:${item.id}`,
                productName: item.productName,
                productSlug: "",
                imageUrl: null,
                size: item.size,
                color: item.color,
                quantity: item.quantity,
                notes: item.notes,
                status: item.productionStatus,
                scheduledAt: item.productionScheduledAt?.toISOString() ?? null,
                startedAt: item.productionStartedAt?.toISOString() ?? null,
                readyAt: item.productionReadyAt?.toISOString() ?? null,
                shippedAt: item.productionShippedAt.toISOString(),
                deliveredAt: item.productionDeliveredAt?.toISOString() ?? null,
                club: null,
              },
            ],
          },
        ];
      },
    );

    return [...orderEntries, ...manualEntries].sort(
      (a, b) =>
        new Date(b.historyAt).getTime() - new Date(a.historyAt).getTime(),
    );
  },

  async listRemovedOrders(): Promise<RemovedProductionOrderDto[]> {
    const orders = await db.order.findMany({
      where: { productionRemovedAt: { not: null } },
      orderBy: { productionRemovedAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        contactName: true,
        contactEmail: true,
        productionRemovedAt: true,
        items: { select: { quantity: true } },
      },
    });
    return orders.map((order) => ({
      orderId: order.id,
      orderNumber: order.orderNumber,
      contactName: order.contactName,
      contactEmail: order.contactEmail,
      removedAt: order.productionRemovedAt!.toISOString(),
      itemCount: order.items.length,
      unitCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    }));
  },

  async removeOrderFromProduction(orderId: string): Promise<boolean> {
    const result = await db.order.updateMany({
      where: { id: orderId, productionRemovedAt: null },
      data: { productionRemovedAt: new Date() },
    });
    return result.count > 0;
  },

  async restoreOrderToProduction(orderId: string): Promise<boolean> {
    return db.$transaction(async (tx) => {
      const result = await tx.order.updateMany({
        where: { id: orderId, productionRemovedAt: { not: null } },
        data: { productionRemovedAt: null },
      });
      if (result.count === 0) return false;
      await tx.orderItem.updateMany({
        where: { orderId },
        data: {
          productionStatus: "WAITING",
          productionScheduledAt: null,
          productionStartedAt: null,
          productionReadyAt: null,
          productionShippedAt: null,
          productionDeliveredAt: null,
        },
      });
      return true;
    });
  },

  async createManualItem(
    input: CreateManualProductionItemInput,
  ): Promise<void> {
    await db.manualProductionItem.create({
      data: {
        productName: input.productName,
        size: input.size,
        color: input.color,
        quantity: input.quantity,
        notes: input.notes ?? null,
      },
    });
  },
};
