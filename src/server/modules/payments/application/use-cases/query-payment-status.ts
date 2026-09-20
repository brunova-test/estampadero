import "server-only";

import { TRPCError } from "@trpc/server";

import type { OrderDetailDto } from "elestampadero/server/modules/orders";

import type { PaymentGateway } from "../ports/payment-gateway";
import type {
  PaymentProviderValue,
  PaymentsRepository,
} from "../ports/payments-repository";

export interface QueryPaymentStatusCommand {
  paymentId: string;
}

export interface QueryPaymentStatusOutcome {
  status: string;
  providerStatus: string;
  changed: boolean;
}

interface QueryPaymentStatusDeps {
  gateway: PaymentGateway;
  repository: PaymentsRepository;
  getOrderById: (id: string) => Promise<OrderDetailDto | null>;
  onOrderPaid: (order: OrderDetailDto) => Promise<void>;
  provider: PaymentProviderValue;
}










export function queryPaymentStatus(deps: QueryPaymentStatusDeps) {
  return async (
    command: QueryPaymentStatusCommand,
  ): Promise<QueryPaymentStatusOutcome> => {
    const payment = await deps.repository.findById(command.paymentId);
    if (!payment) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Pago no encontrado." });
    }
    if (payment.provider !== deps.provider) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: `Este pago no se procesó con ${deps.provider}.`,
      });
    }



    const providerResult = payment.providerPaymentId
      ? await deps.gateway.getPayment(payment.providerPaymentId)
      : await deps.gateway.findByExternalReference(payment.id);

    if (!providerResult) {
      return {
        status: payment.status,
        providerStatus: "unknown",
        changed: false,
      };
    }

    const providerRefundedInCents = providerResult.amountRefundedInCents ?? 0;
    const recordedRefundedInCents = payment.amountRefundedInCents ?? 0;
    const amountRefundedInCents =
      providerRefundedInCents > 0
        ? providerRefundedInCents
        : recordedRefundedInCents > 0
          ? recordedRefundedInCents
          : providerResult.normalizedStatus === "REFUNDED"
            ? payment.amountInCents
            : 0;

    await deps.repository.syncProviderDetails?.({
      paymentId: payment.id,
      providerPaymentId: providerResult.providerPaymentId,
      providerStatus: providerResult.providerStatus,
      paymentMethodType: providerResult.paymentMethodType ?? null,
      paymentMethodId: providerResult.paymentMethodId ?? null,
      installments: providerResult.installments ?? null,
      moneyReleaseDate: providerResult.moneyReleaseDate ?? null,
      moneyReleased: providerResult.moneyReleased ?? false,
      netReceivedInCents: providerResult.netReceivedInCents ?? null,
      feeInCents: providerResult.feeInCents ?? null,
      financingFeeInCents: providerResult.financingFeeInCents ?? null,
      amountRefundedInCents,
    });

    if (providerResult.normalizedStatus === "APPROVED") {
      const wasNewlyApproved = await deps.repository.markApprovedAndPayOrder({
        paymentId: payment.id,
        providerPaymentId: providerResult.providerPaymentId,
        providerStatus: providerResult.providerStatus,
      });
      if (wasNewlyApproved) {
        const order = await deps.getOrderById(payment.orderId);
        if (order) await deps.onOrderPaid(order);
      }
      return {
        status: "APPROVED",
        providerStatus: providerResult.providerStatus,
        changed: wasNewlyApproved,
      };
    }

    if (providerResult.normalizedStatus === "PENDING") {
      return {
        status: payment.status,
        providerStatus: providerResult.providerStatus,
        changed: false,
      };
    }

    if (
      providerResult.latestProviderRefundId &&
      (providerResult.normalizedStatus === "REFUNDED" ||
        providerResult.normalizedStatus === "PARTIALLY_REFUNDED")
    ) {
      await deps.repository.recordRefund?.({
        paymentId: payment.id,
        amountRefundedInCents,
        status: providerResult.normalizedStatus,
        providerRefundId: providerResult.latestProviderRefundId,
        lastRefundAmountInCents: amountRefundedInCents,
      });
    } else {
      await deps.repository.markStatus({
        paymentId: payment.id,
        providerPaymentId: providerResult.providerPaymentId,
        status: providerResult.normalizedStatus,
        providerStatus: providerResult.providerStatus,
      });
    }
    return {
      status: providerResult.normalizedStatus,
      providerStatus: providerResult.providerStatus,
      changed: providerResult.normalizedStatus !== payment.status,
    };
  };
}
