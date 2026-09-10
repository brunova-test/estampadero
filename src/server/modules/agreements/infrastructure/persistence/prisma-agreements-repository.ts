import "server-only";

import { db } from "elestampadero/server/db";

import type {
  AgreementDetailDto,
  AgreementSummaryDto,
} from "../../application/dto/agreement";
import type {
  AgreementsRepository,
  ChangeAgreementStatusInput,
  CreateAgreementInput,
  ResolvedRate,
  UpdateAgreementInput,
} from "../../application/ports/agreements-repository";

const detailInclude = {
  productRates: { include: { agreement: false } },
  changes: { orderBy: { createdAt: "desc" as const } },
} as const;

function toSummary(agreement: {
  id: string;
  code: string;
  title: string;
  status: string;
  startDate: Date;
  endDate: Date;
  basePercentage: number;
  settlementMethod: string;
  settlementFrequency: string;
  contractUrl: string | null;
}): AgreementSummaryDto {
  return {
    id: agreement.id,
    code: agreement.code,
    title: agreement.title,
    status: agreement.status,
    startDate: agreement.startDate.toISOString(),
    endDate: agreement.endDate.toISOString(),
    basePercentage: agreement.basePercentage,
    settlementMethod: agreement.settlementMethod,
    settlementFrequency: agreement.settlementFrequency,
    contractUrl: agreement.contractUrl,
  };
}

async function toDetail(agreement: {
  id: string;
  clubId: string;
  code: string;
  title: string;
  status: string;
  startDate: Date;
  endDate: Date;
  basePercentage: number;
  settlementMethod: string;
  settlementFrequency: string;
  contractUrl: string | null;
  productRates: { id: string; productId: string; percentage: number }[];
  changes: {
    id: string;
    action: string;
    summary: string;
    changedByUserId: string | null;
    createdAt: Date;
  }[];
}): Promise<AgreementDetailDto> {
  const products = await db.product.findMany({
    where: { id: { in: agreement.productRates.map((rate) => rate.productId) } },
    select: { id: true, name: true },
  });
  const nameById = new Map(
    products.map((product) => [product.id, product.name]),
  );

  return {
    ...toSummary(agreement),
    clubId: agreement.clubId,
    productRates: agreement.productRates.map((rate) => ({
      id: rate.id,
      productId: rate.productId,
      productName: nameById.get(rate.productId) ?? "Producto eliminado",
      percentage: rate.percentage,
    })),
    changes: agreement.changes.map((change) => ({
      ...change,
      createdAt: change.createdAt.toISOString(),
    })),
  };
}

export const prismaAgreementsRepository: AgreementsRepository = {
  async listByClub(clubId: string): Promise<AgreementSummaryDto[]> {
    const agreements = await db.agreement.findMany({
      where: { clubId },
      orderBy: { startDate: "desc" },
    });
    return agreements.map(toSummary);
  },

  async getById(id: string): Promise<AgreementDetailDto | null> {
    const agreement = await db.agreement.findUnique({
      where: { id },
      include: detailInclude,
    });
    return agreement ? toDetail(agreement) : null;
  },

  async getActiveForClub(clubId: string): Promise<AgreementDetailDto | null> {
    const agreement = await db.agreement.findFirst({
      where: { clubId, status: "ACTIVE" },
      orderBy: { startDate: "desc" },
      include: detailInclude,
    });
    return agreement ? toDetail(agreement) : null;
  },

  async createAgreement(
    input: CreateAgreementInput,
  ): Promise<AgreementDetailDto> {
    const agreement = await db.agreement.create({
      data: {
        clubId: input.clubId,
        code: input.code,
        title: input.title,
        startDate: input.startDate,
        endDate: input.endDate,
        basePercentage: input.basePercentage,
        settlementMethod: input.settlementMethod,
        settlementFrequency: input.settlementFrequency,
        contractUrl: input.contractUrl,
        productRates: {
          create: input.productRates,
        },
        changes: {
          create: {
            action: "CREATED",
            summary: "Convenio creado",
            changedByUserId: input.changedByUserId,
            details: {
              basePercentage: input.basePercentage,
              productRates: input.productRates,
            },
          },
        },
      },
      include: detailInclude,
    });
    return toDetail(agreement);
  },

  async updateAgreement(
    input: UpdateAgreementInput,
  ): Promise<AgreementDetailDto> {
    const agreement = await db.$transaction(async (transaction) => {
      await transaction.agreementProductRate.deleteMany({
        where: { agreementId: input.id },
      });
      return transaction.agreement.update({
        where: { id: input.id },
        data: {
          code: input.code,
          title: input.title,
          startDate: input.startDate,
          endDate: input.endDate,
          basePercentage: input.basePercentage,
          settlementMethod: input.settlementMethod,
          settlementFrequency: input.settlementFrequency,
          contractUrl: input.contractUrl,
          productRates: { create: input.productRates },
          changes: {
            create: {
              action: "UPDATED",
              summary: "Datos y porcentajes del convenio actualizados",
              changedByUserId: input.changedByUserId,
              details: {
                basePercentage: input.basePercentage,
                productRates: input.productRates,
              },
            },
          },
        },
        include: detailInclude,
      });
    });
    return toDetail(agreement);
  },

  async changeStatus(
    input: ChangeAgreementStatusInput,
  ): Promise<AgreementDetailDto> {
    const labels = {
      PAUSED: "Convenio pausado",
      REACTIVATED: "Convenio reactivado",
      CANCELLED: "Convenio eliminado de la operatoria",
    } as const;
    const agreement = await db.agreement.update({
      where: { id: input.id },
      data: {
        status: input.status,
        changes: {
          create: {
            action: input.action,
            summary: labels[input.action],
            changedByUserId: input.changedByUserId,
            details: { status: input.status },
          },
        },
      },
      include: detailInclude,
    });
    return toDetail(agreement);
  },

  async setProductRate(
    agreementId,
    productId,
    percentage,
    changedByUserId,
  ): Promise<void> {
    await db.$transaction([
      db.agreementProductRate.upsert({
        where: { agreementId_productId: { agreementId, productId } },
        update: { percentage },
        create: { agreementId, productId, percentage },
      }),
      db.agreementChange.create({
        data: {
          agreementId,
          action: "UPDATED",
          summary: "Porcentaje específico de producto actualizado",
          changedByUserId,
          details: { productId, percentage },
        },
      }),
    ]);
  },

  async resolveRateForProduct(clubId, productId): Promise<ResolvedRate | null> {
    const agreement = await db.agreement.findFirst({
      where: { clubId, status: "ACTIVE" },
      orderBy: { startDate: "desc" },
      include: {
        productRates: { where: { productId } },
      },
    });
    if (!agreement) return null;

    const override = agreement.productRates[0];
    return {
      agreementId: agreement.id,
      percentage: override ? override.percentage : agreement.basePercentage,
    };
  },
};
