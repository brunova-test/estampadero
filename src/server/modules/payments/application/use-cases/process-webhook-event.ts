import "server-only";

import type { OrderDetailDto } from "elestampadero/server/modules/orders";

import type {
  PaymentGateway,
  VerifyWebhookInput,
} from "../ports/payment-gateway";
import type {
  PaymentProviderValue,
  PaymentsRepository,
} from "../ports/payments-repository";

export type ProcessWebhookResult =
  | { outcome: "invalid_signature" }
  | { outcome: "duplicate" }
  | { outcome: "payment_not_found" }
  | { outcome: "amount_mismatch" }
  | { outcome: "processed" };

interface ProcessWebhookDeps {
  gateway: PaymentGateway;
  repository: PaymentsRepository;
  getOrderById: (id: string) => Promise<OrderDetailDto | null>;
  onOrderPaid: (order: OrderDetailDto) => Promise<void>;
  onPaymentUpdated?: (paymentId: string) => Promise<void>;
  provider?: PaymentProviderValue;
}

export function processWebhookEvent(deps: ProcessWebhookDeps) {
  return async (input: VerifyWebhookInput): Promise<ProcessWebhookResult> => {
    const verified = await deps.gateway.verifyWebhook(input);
    if (!verified?.providerPaymentId) {
      return { outcome: "invalid_signature" };
    }

    const isNewEvent = await deps.repository.recordWebhookEventOnce({
      provider: deps.provider ?? "MERCADO_PAGO",
      providerEventId: verified.providerEventId,
      eventType: verified.eventType,
    });
    if (!isNewEvent) {
      return { outcome: "duplicate" };
    }

    if (
      deps.provider === "MODO" &&
      ["CREATED", "SCANNED", "PROCESSING"].includes(verified.eventType)
    ) {
      const payment = verified.externalReference
        ? await deps.repository.findById(verified.externalReference)
        : await deps.repository.findByProviderPaymentId(
            deps.provider,
            verified.providerPaymentId,
          );
      if (!payment) return { outcome: "payment_not_found" };
      await deps.repository.markStatus({
        paymentId: payment.id,
        providerPaymentId: verified.providerPaymentId,
        status: verified.eventType === "CREATED" ? "PENDING" : "PROCESSING",
        providerStatus: verified.eventType,
      });
      return { outcome: "processed" };
    }



    const providerResult = await deps.gateway.getPayment(
      verified.providerPaymentId,
    );

    const externalReference =
      providerResult.externalReference ?? verified.externalReference ?? null;
    const payment = externalReference
      ? await deps.repository.findById(externalReference)
      : await deps.repository.findByProviderPaymentId(
          deps.provider ?? "MERCADO_PAGO",
          providerResult.providerPaymentId,
        );
    if (!payment) {
      return { outcome: "payment_not_found" };
    }

    if (
      providerResult.amountInCents !== payment.amountInCents ||
      providerResult.currency !== payment.currency
    ) {
      return { outcome: "amount_mismatch" };
    }

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
      amountRefundedInCents: providerResult.amountRefundedInCents,
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
    } else {
      await deps.repository.markStatus({
        paymentId: payment.id,
        providerPaymentId: providerResult.providerPaymentId,
        status: providerResult.normalizedStatus,
        providerStatus: providerResult.providerStatus,
      });
    }

    await deps.onPaymentUpdated?.(payment.id);

    return { outcome: "processed" };
  };
}
