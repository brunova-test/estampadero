import "server-only";

import { db } from "elestampadero/server/db";
import { matureCommissionEntries } from "elestampadero/server/modules/commissions/infrastructure/commission-eligibility";

import type {
  SettlementDetailDto,
  SettlementSummaryDto,
} from "../../application/dto/settlement";
import type { SettlementsRepository } from "../../application/ports/settlements-repository";

const summaryInclude = {
  club: { select: { name: true } },
} as const;

function toSummary(settlement: {
  id: string;
  clubId: string;
  club: { name: string };
  periodLabel: string;
  periodStart: Date;
  periodEnd: Date;
  status: string;
  totalInCents: number;
  createdAt: Date;
  paidAt: Date | null;
  receiptUrl: string | null;
  transferProvider: string | null;
  transferId: string | null;
  transferStatus: string | null;
}): SettlementSummaryDto {
  return {
    id: settlement.id,
    clubId: settlement.clubId,
    clubName: settlement.club.name,
    periodLabel: settlement.periodLabel,
    periodStart: settlement.periodStart.toISOString(),
    periodEnd: settlement.periodEnd.toISOString(),
    status: settlement.status,
    totalInCents: settlement.totalInCents,
    createdAt: settlement.createdAt.toISOString(),
    paidAt: settlement.paidAt?.toISOString() ?? null,
    receiptUrl: settlement.receiptUrl,
    transferProvider: settlement.transferProvider,
    transferId: settlement.transferId,
    transferStatus: settlement.transferStatus,
  };
}

async function getSettlementById(
  id: string,
): Promise<SettlementDetailDto | null> {
  const settlement = await db.settlement.findUnique({
    where: { id },
    include: {
      club: { select: { name: true, payoutCbu: true } },
      entries: {
        select: {
          id: true,
          orderItemId: true,
          orderNumber: true,
          productName: true,
          percentageApplied: true,
          amountInCents: true,
        },
      },
      events: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!settlement) return null;

  const quantities = await db.orderItem.findMany({
    where: { id: { in: settlement.entries.map((entry) => entry.orderItemId) } },
    select: { id: true, quantity: true },
  });
  const quantityByOrderItem = new Map(
    quantities.map((item) => [item.id, item.quantity]),
  );

  return {
    ...toSummary(settlement),
    payoutCbu: settlement.club.payoutCbu,
    items: settlement.entries.map(({ orderItemId, ...entry }) => ({
      ...entry,
      quantity: quantityByOrderItem.get(orderItemId) ?? 1,
    })),
    events: settlement.events.map((event) => ({
      id: event.id,
      action: event.action,
      summary: event.summary,
      changedByUserId: event.changedByUserId,
      createdAt: event.createdAt.toISOString(),
    })),
  };
}

export const prismaSettlementsRepository: SettlementsRepository = {
  async listMovements(filters) {
    const search = filters.search?.trim();
    const entries = await db.commissionEntry.findMany({
      where: {
        ...(filters.from || filters.to
          ? {
              createdAt: {
                ...(filters.from ? { gte: filters.from } : {}),
                ...(filters.to ? { lte: filters.to } : {}),
              },
            }
          : {}),
        ...(search
          ? {
              OR: [
                { club: { name: { contains: search, mode: "insensitive" } } },
                { productName: { contains: search, mode: "insensitive" } },
                { order: { contactName: { contains: search, mode: "insensitive" } } },
                { order: { contactEmail: { contains: search, mode: "insensitive" } } },
                { order: { customerDocument: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: {
        club: { select: { name: true } },
        order: {
          select: {
            contactName: true,
            contactEmail: true,
            customerDocument: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return entries
      .filter((entry) => {
        const hour = entry.createdAt.getHours();
        return (
          filters.hourFrom === undefined ||
          filters.hourTo === undefined ||
          (filters.hourFrom <= filters.hourTo
            ? hour >= filters.hourFrom && hour <= filters.hourTo
            : hour >= filters.hourFrom || hour <= filters.hourTo)
        );
      })
      .map((entry) => ({
        id: entry.id,
        clubId: entry.clubId,
        clubName: entry.club.name,
        orderNumber: entry.orderNumber,
        contactName: entry.order.contactName,
        contactEmail: entry.order.contactEmail,
        customerDocument: entry.order.customerDocument,
        productName: entry.productName,
        amountInCents: entry.amountInCents,
        percentageApplied: entry.percentageApplied,
        status: entry.status,
        entryType: entry.entryType,
        createdAt: entry.createdAt.toISOString(),
      }));
  },

  async listSettlements(filters): Promise<SettlementSummaryDto[]> {
    const settlements = await db.settlement.findMany({
      where: {
        clubId: filters.clubId,
        status: filters.status,
      },
      include: summaryInclude,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return settlements.map(toSummary);
  },

  getById: getSettlementById,

  async listSettlementConfigurations() {
    await matureCommissionEntries();
    const pendingClubs = await db.commissionEntry.findMany({
      where: { status: "AVAILABLE", settlementId: null },
      distinct: ["clubId"],
      select: { clubId: true },
    });
    const agreements = await db.agreement.findMany({
      where: { clubId: { in: pendingClubs.map((item) => item.clubId) } },
      orderBy: { startDate: "desc" },
      select: {
        clubId: true,
        settlementFrequency: true,
        club: { select: { name: true, payoutCbu: true } },
      },
    });
    const byClub = new Map<
      string,
      {
        clubId: string;
        clubName: string;
        payoutCbu: string | null;
        frequency: "AUTOMATIC" | "BIWEEKLY" | "MONTHLY";
      }
    >();
    for (const agreement of agreements) {
      if (byClub.has(agreement.clubId)) continue;
      byClub.set(agreement.clubId, {
        clubId: agreement.clubId,
        clubName: agreement.club.name,
        payoutCbu: agreement.club.payoutCbu,
        frequency: agreement.settlementFrequency,
      });
    }
    return [...byClub.values()];
  },

  async generateSettlement(
    clubId: string,
    periodLabel: string,
    periodStart: Date,
    periodEnd: Date,
    cutoffExclusive: Date,
    createdByUserId: string,
    commissionEntryId?: string,
  ): Promise<SettlementDetailDto | null> {
    const newSettlementId = await db.$transaction(async (tx) => {



      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${clubId}:${periodStart.toISOString()}:${periodEnd.toISOString()}`}))`;
      const existing = await tx.settlement.findUnique({
        where: {
          clubId_periodStart_periodEnd: { clubId, periodStart, periodEnd },
        },
        select: { id: true },
      });
      if (existing) return null;

      const pendingEntries = await tx.commissionEntry.findMany({
        where: {
          clubId,
          ...(commissionEntryId ? { id: commissionEntryId } : {}),
          status: "AVAILABLE",
          settlementId: null,
          availableAt: { lt: cutoffExclusive },
        },
        select: { id: true, amountInCents: true },
      });
      if (pendingEntries.length === 0) return null;

      const totalInCents = pendingEntries.reduce(
        (sum, entry) => sum + entry.amountInCents,
        0,
      );



      if (totalInCents <= 0) return null;

      const settlement = await tx.settlement.create({
        data: {
          clubId,
          periodLabel,
          periodStart,
          periodEnd,
          totalInCents,
          createdByUserId,
          events: {
            create: {
              action: "CREATED",
              summary: `Cierre ${periodLabel} generado`,
              changedByUserId: createdByUserId,
            },
          },
        },
      });

      await tx.commissionEntry.updateMany({
        where: { id: { in: pendingEntries.map((entry) => entry.id) } },
        data: { settlementId: settlement.id, status: "IN_SETTLEMENT" },
      });

      return settlement.id;
    });

    if (!newSettlementId) return null;
    return getSettlementById(newSettlementId);
  },

  async generateAutomaticSettlements(createdByUserId, now) {
    await matureCommissionEntries(now);
    const entries = await db.commissionEntry.findMany({
      where: {
        status: "AVAILABLE",
        settlementId: null,
        amountInCents: { gt: 0 },
        agreement: { settlementFrequency: "AUTOMATIC" },
      },
      select: {
        id: true,
        clubId: true,
        orderNumber: true,
        amountInCents: true,
        availableAt: true,
      },
      orderBy: [{ availableAt: "asc" }, { id: "asc" }],
    });
    const created: SettlementDetailDto[] = [];
    for (const entry of entries) {
      const periodStart = entry.availableAt ?? now;
      const periodEnd = periodStart;
      const settlement = await this.generateSettlement(
        entry.clubId,
        `Transacción #${entry.orderNumber}`,
        periodStart,
        periodEnd,
        new Date(periodStart.getTime() + 1),
        createdByUserId,
        entry.id,
      );
      if (settlement) {
        await db.settlement.update({
          where: { id: settlement.id },
          data: {
            transferProvider: "MOBBEX",
            transferStatus: "PENDING",
            transferAttempts: 0,
          },
        });
        const detail = await getSettlementById(settlement.id);
        if (detail) created.push(detail);
      }
    }
    return created;
  },

  async markPaid({ settlementId, receiptUrl, confirmedByUserId }) {
    return db.$transaction(async (tx) => {
      const updateResult = await tx.settlement.updateMany({
        where: { id: settlementId, status: "PENDING_PAYMENT" },
        data: {
          status: "PAID",
          paidAt: new Date(),
          receiptUrl,
          confirmedByUserId,
        },
      });
      if (updateResult.count === 0) return false;

      await tx.settlementEvent.create({
        data: {
          settlementId,
          action: "PAID",
          summary: "Transferencia confirmada con comprobante",
          changedByUserId: confirmedByUserId,
        },
      });

      await tx.commissionEntry.updateMany({
        where: { settlementId },
        data: { status: "SETTLED" },
      });

      return true;
    });
  },
};
