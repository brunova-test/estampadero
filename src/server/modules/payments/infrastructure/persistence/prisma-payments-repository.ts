import "server-only";

import { db } from "elestampadero/server/db";

import type {
  CreatePaymentInput,
  PaymentRecord,
  PaymentsRepository,
  PaymentStatusValue,
} from "../../application/ports/payments-repository";

function toRecord(payment: {
  id: string;
  orderId: string;
  channel: string;
  provider: string;
  processor: string;
  providerPreferenceId: string | null;
  providerPaymentId: string | null;
  amountInCents: number;
  currency: string;
  status: string;
  idempotencyKey: string;
  moneyReleasedAt: Date | null;
}): PaymentRecord {
  return payment as PaymentRecord;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export const prismaPaymentsRepository: PaymentsRepository = {
  async createPayment(input: CreatePaymentInput) {
    return db.$transaction(async (tx) => {



      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.orderId}))`;

      const replay = await tx.payment.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (replay) return { payment: toRecord(replay), created: false };

      const active = await tx.payment.findFirst({
        where: {
          orderId: input.orderId,
          status: { in: ["CREATED", "PENDING", "PROCESSING"] },
        },
        orderBy: { createdAt: "desc" },
      });
      if (active) return { payment: toRecord(active), created: false };

      const payment = await tx.payment.create({
        data: {
          orderId: input.orderId,
          channel: input.channel,
          provider: input.provider,
          processor: input.processor,
          amountInCents: input.amountInCents,
          currency: input.currency,
          idempotencyKey: input.idempotencyKey,
          status: "CREATED",
        },
      });
      return { payment: toRecord(payment), created: true };
    });
  },

  async setPreferenceId(paymentId, providerPreferenceId) {
    await db.payment.update({
      where: { id: paymentId },
      data: { providerPreferenceId },
    });
  },

  async setProviderPaymentId(paymentId, providerPaymentId) {
    await db.payment.update({
      where: { id: paymentId },
      data: { providerPaymentId },
    });
  },

  async findById(paymentId) {
    const payment = await db.payment.findUnique({ where: { id: paymentId } });
    return payment ? toRecord(payment) : null;
  },

  async findByOrderId(orderId): Promise<PaymentRecord[]> {
    const payments = await db.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });
    return payments.map(toRecord);
  },

  async findByProviderPaymentId(provider, providerPaymentId) {
    const payment = await db.payment.findFirst({
      where: { provider, providerPaymentId },
    });
    return payment ? toRecord(payment) : null;
  },

  async findByPreferenceId(providerPreferenceId) {
    const payment = await db.payment.findFirst({
      where: { providerPreferenceId },
    });
    return payment ? toRecord(payment) : null;
  },

  async recordWebhookEventOnce({ provider, providerEventId, eventType }) {
    try {
      await db.paymentWebhookEvent.create({
        data: { provider, providerEventId, eventType },
      });
      return true;
    } catch (error) {


      if (isUniqueConstraintError(error)) return false;
      throw error;
    }
  },

  async syncProviderDetails(input) {
    const moneyReleaseDate = input.moneyReleaseDate
      ? new Date(input.moneyReleaseDate)
      : null;
    await db.payment.update({
      where: { id: input.paymentId },
      data: {
        providerPaymentId: input.providerPaymentId,
        providerStatus: input.providerStatus,
        paymentMethodType: input.paymentMethodType,
        paymentMethodId: input.paymentMethodId,
        installments: input.installments,
        moneyReleaseDate:
          moneyReleaseDate && !Number.isNaN(moneyReleaseDate.getTime())
            ? moneyReleaseDate
            : null,
        moneyReleasedAt: input.moneyReleased ? new Date() : undefined,
        netReceivedInCents: input.netReceivedInCents,
        feeInCents: input.feeInCents,
        financingFeeInCents: input.financingFeeInCents,
        amountRefundedInCents: input.amountRefundedInCents,
      },
    });
  },

  async markApprovedAndPayOrder({
    paymentId,
    providerPaymentId,
    providerStatus,
  }) {
    return db.$transaction(async (tx) => {
      const updateResult = await tx.payment.updateMany({
        where: { id: paymentId, status: { not: "APPROVED" } },
        data: {
          status: "APPROVED",
          providerPaymentId,
          providerStatus,
          approvedAt: new Date(),
        },
      });
      if (updateResult.count === 0) return false;

      const payment = await tx.payment.findUniqueOrThrow({
        where: { id: paymentId },
        select: { orderId: true },
      });

      await tx.order.updateMany({
        where: { id: payment.orderId, status: "PENDING_PAYMENT" },
        data: { status: "PAID" },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: "PAID",
          note: "Pago aprobado por la pasarela de pago",
        },
      });

      return true;
    });
  },

  async markStatus({ paymentId, providerPaymentId, status, providerStatus }) {
    const data: {
      status: PaymentStatusValue;
      providerPaymentId: string;
      providerStatus: string;
      rejectedAt?: Date;
    } = { status, providerPaymentId, providerStatus };
    if (status === "REJECTED" || status === "CANCELLED") {
      data.rejectedAt = new Date();
    }

    await db.payment.update({ where: { id: paymentId }, data });
  },

  async markAttemptFailed(paymentId, providerStatus) {
    await db.payment.updateMany({
      where: { id: paymentId, status: "CREATED" },
      data: { status: "REJECTED", providerStatus, rejectedAt: new Date() },
    });
  },

  async recordRefund({
    paymentId,
    amountRefundedInCents,
    status,
    providerRefundId,
    lastRefundAmountInCents,
  }) {
    await db.payment.update({
      where: { id: paymentId },
      data: {
        amountRefundedInCents,
        status,
        lastProviderRefundId: providerRefundId,
        lastRefundAmountInCents,
      },
    });
  },

  async recordRefundVoided({ paymentId, amountRefundedInCents, status }) {
    await db.payment.update({
      where: { id: paymentId },
      data: {
        amountRefundedInCents,
        status,
        lastProviderRefundId: null,
        lastRefundAmountInCents: null,
      },
    });
  },

  async setRefundReference({
    paymentId,
    providerRefundId,
    lastRefundAmountInCents,
  }) {
    await db.payment.update({
      where: { id: paymentId },
      data: { lastProviderRefundId: providerRefundId, lastRefundAmountInCents },
    });
  },

  async findStaleNonTerminalPayments({
    provider,
    olderThan,
    newerThan,
    limit,
  }) {
    const payments = await db.payment.findMany({
      where: {
        provider,
        status: { in: ["CREATED", "PENDING", "PROCESSING"] },
        createdAt: { lte: olderThan, gte: newerThan },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
    return payments.map(toRecord);
  },

  async findPaymentsAwaitingRelease({ provider, newerThan, limit }) {
    const payments = await db.payment.findMany({
      where: {
        provider,
        status: { in: ["APPROVED", "PARTIALLY_REFUNDED"] },
        moneyReleasedAt: null,
        providerPaymentId: { not: null },
        createdAt: { gte: newerThan },
      },
      orderBy: [{ moneyReleaseDate: "asc" }, { createdAt: "asc" }],
      take: limit,
    });
    return payments.map(toRecord);
  },
};
