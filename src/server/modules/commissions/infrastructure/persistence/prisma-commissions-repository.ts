import "server-only";

import { db } from "elestampadero/server/db";

import type {
  ClubBalanceDto,
  CommissionEntryDto,
} from "../../application/dto/commission";
import type {
  CommissionsRepository,
  CreateCommissionEntryInput,
} from "../../application/ports/commissions-repository";

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export const prismaCommissionsRepository: CommissionsRepository = {
  async createEntryIfNotExists(
    input: CreateCommissionEntryInput,
  ): Promise<void> {
    try {
      await db.commissionEntry.create({
        data: {
          clubId: input.clubId,
          agreementId: input.agreementId,
          orderId: input.orderId,
          orderItemId: input.orderItemId,
          paymentId: input.paymentId,
          orderNumber: input.orderNumber,
          productName: input.productName,
          sourceKey: `sale:${input.orderItemId}`,
          baseAmountInCents: input.baseAmountInCents,
          percentageApplied: input.percentageApplied,
          amountInCents: input.amountInCents,
          status: input.status,
          releasedAt: input.releasedAt,
          returnWindowEndsAt: input.returnWindowEndsAt,
          availableAt: input.availableAt,
        },
      });
    } catch (error) {


      if (!isUniqueConstraintError(error)) throw error;
    }
  },

  async listByClub(clubId: string): Promise<CommissionEntryDto[]> {
    const entries = await db.commissionEntry.findMany({
      where: { clubId },
      include: {
        payment: {
          select: {
            paymentMethodType: true,
            paymentMethodId: true,
            installments: true,
            moneyReleaseDate: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return entries.map((entry) => ({
      id: entry.id,
      orderId: entry.orderId,
      orderNumber: entry.orderNumber,
      productName: entry.productName,
      baseAmountInCents: entry.baseAmountInCents,
      percentageApplied: entry.percentageApplied,
      amountInCents: entry.amountInCents,
      status: entry.status,
      entryType: entry.entryType,
      releasedAt: entry.releasedAt?.toISOString() ?? null,
      returnWindowEndsAt: entry.returnWindowEndsAt?.toISOString() ?? null,
      availableAt: entry.availableAt?.toISOString() ?? null,
      paymentMethodType: entry.payment?.paymentMethodType ?? null,
      paymentMethodId: entry.payment?.paymentMethodId ?? null,
      installments: entry.payment?.installments ?? null,
      moneyReleaseDate:
        entry.payment?.moneyReleaseDate?.toISOString() ?? null,
      createdAt: entry.createdAt.toISOString(),
    }));
  },

  async getClubBalance(clubId: string): Promise<ClubBalanceDto> {
    const [
      salesAgg,
      accruedAgg,
      pendingReleaseAgg,
      pendingDeliveryAgg,
      returnWindowAgg,
      availableAgg,
      settledAgg,
    ] = await Promise.all([
      db.commissionEntry.aggregate({
        where: { clubId },
        _sum: { baseAmountInCents: true },
      }),
      db.commissionEntry.aggregate({
        where: {
          clubId,
          status: {
            in: [
              "ACCRUED",
              "PENDING_RELEASE",
              "PENDING_DELIVERY",
              "RETURN_WINDOW",
              "AVAILABLE",
              "IN_SETTLEMENT",
            ],
          },
        },
        _sum: { amountInCents: true },
      }),
      db.commissionEntry.aggregate({
        where: { clubId, status: "PENDING_RELEASE" },
        _sum: { amountInCents: true },
      }),
      db.commissionEntry.aggregate({
        where: { clubId, status: "PENDING_DELIVERY" },
        _sum: { amountInCents: true },
      }),
      db.commissionEntry.aggregate({
        where: { clubId, status: "RETURN_WINDOW" },
        _sum: { amountInCents: true },
      }),
      db.commissionEntry.aggregate({
        where: { clubId, status: { in: ["AVAILABLE", "IN_SETTLEMENT"] } },
        _sum: { amountInCents: true },
      }),
      db.commissionEntry.aggregate({
        where: { clubId, status: "SETTLED" },
        _sum: { amountInCents: true },
      }),
    ]);

    return {
      salesInCents: salesAgg._sum.baseAmountInCents ?? 0,
      accruedInCents: accruedAgg._sum.amountInCents ?? 0,
      pendingReleaseInCents: pendingReleaseAgg._sum.amountInCents ?? 0,
      pendingDeliveryInCents: pendingDeliveryAgg._sum.amountInCents ?? 0,
      returnWindowInCents: returnWindowAgg._sum.amountInCents ?? 0,
      availableInCents: availableAgg._sum.amountInCents ?? 0,
      settledInCents: settledAgg._sum.amountInCents ?? 0,
    };
  },
};
