import "server-only";

import { TRPCError } from "@trpc/server";

import type { OrderDetailDto } from "elestampadero/server/modules/orders";

import type { PaymentGateway } from "../ports/payment-gateway";
import type {
  PaymentProcessorValue,
  PaymentProviderValue,
  PaymentsRepository,
} from "../ports/payments-repository";

export interface PayWithCardCommand {
  orderId: string;
  paymentAttemptId: string;
  cardToken: string;
  bin?: string;
  paymentMethodId: string;
  issuerId: string | null;
  installments: number;
  payerDocType: string | null;
  payerDocNumber: string | null;
}

export interface PayWithCardOutcome {
  status: "APPROVED" | "REJECTED" | "PENDING";
  providerStatus: string;
}

interface PayWithCardDeps {
  gateway: PaymentGateway;
  repository: PaymentsRepository;
  getOrderById: (id: string) => Promise<OrderDetailDto | null>;
  onOrderPaid: (order: OrderDetailDto) => Promise<void>;
  provider?: PaymentProviderValue;
  processor?: PaymentProcessorValue;
}

export function payWithCard(deps: PayWithCardDeps) {
  return async (command: PayWithCardCommand): Promise<PayWithCardOutcome> => {
    const order = await deps.getOrderById(command.orderId);
    if (!order) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Pedido no encontrado.",
      });
    }
    if (order.status !== "PENDING_PAYMENT") {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Este pedido ya no está pendiente de pago.",
      });
    }
    if (!deps.gateway.isConfigured()) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "El pago con tarjeta no está disponible en este momento.",
      });
    }

    const paymentAttempt = await deps.repository.createPayment({
      orderId: order.id,
      channel: "CARD",
      provider: deps.provider ?? "MERCADO_PAGO",
      processor: deps.processor ?? "MERCADO_PAGO",
      amountInCents: order.totalInCents,
      currency: "ARS",
      idempotencyKey: command.paymentAttemptId,
    });
    const payment = paymentAttempt.payment;

    if (!paymentAttempt.created) {
      if (payment.status === "APPROVED") {
        return { status: "APPROVED", providerStatus: "approved" };
      }
      if (payment.status === "REJECTED") {
        return { status: "REJECTED", providerStatus: "rejected" };
      }
      return { status: "PENDING", providerStatus: "processing" };
    }

    let result;
    try {
      result = await deps.gateway.payWithCard({
        paymentId: payment.id,
        amountInCents: order.totalInCents,
        currency: "ARS",
        cardToken: command.cardToken,
        bin: command.bin ?? "",
        paymentMethodId: command.paymentMethodId,
        issuerId: command.issuerId,
        installments: command.installments,
        payerEmail: order.contactEmail,
        payerDocType: command.payerDocType,
        payerDocNumber: command.payerDocNumber,
        description: `Pedido #${String(order.orderNumber).padStart(6, "0")} · El Estampadero`,
      });
    } catch (error) {
      if (deps.gateway.isDefinitiveFailure?.(error)) {
        await deps.repository.markAttemptFailed?.(
          payment.id,
          "provider_request_rejected",
        );
      }
      throw error;
    }

    await deps.repository.syncProviderDetails?.({
      paymentId: payment.id,
      providerPaymentId: result.providerPaymentId,
      providerStatus: result.providerStatus,
      paymentMethodType: result.paymentMethodType ?? null,
      paymentMethodId: result.paymentMethodId ?? null,
      installments: result.installments ?? null,
      moneyReleaseDate: result.moneyReleaseDate ?? null,
      moneyReleased: result.moneyReleased ?? false,
      netReceivedInCents: result.netReceivedInCents ?? null,
      feeInCents: result.feeInCents ?? null,
      financingFeeInCents: result.financingFeeInCents ?? null,
      amountRefundedInCents: result.amountRefundedInCents ?? 0,
    });

    if (result.normalizedStatus === "APPROVED") {
      const wasNewlyApproved = await deps.repository.markApprovedAndPayOrder({
        paymentId: payment.id,
        providerPaymentId: result.providerPaymentId,
        providerStatus: result.providerStatus,
      });
      if (wasNewlyApproved) {
        const paidOrder = await deps.getOrderById(order.id);
        if (paidOrder) await deps.onOrderPaid(paidOrder);
      }

      return { status: "APPROVED", providerStatus: result.providerStatus };
    }

    await deps.repository.markStatus({
      paymentId: payment.id,
      providerPaymentId: result.providerPaymentId,
      status: result.normalizedStatus,
      providerStatus: result.providerStatus,
    });

    return {
      status: result.normalizedStatus === "REJECTED" ? "REJECTED" : "PENDING",
      providerStatus: result.providerStatus,
    };
  };
}
