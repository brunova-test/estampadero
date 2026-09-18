import "server-only";

import { TRPCError } from "@trpc/server";

import type { OrderDetailDto } from "elestampadero/server/modules/orders";

import type {
  CreateCheckoutSessionInput,
  PaymentGateway,
} from "../ports/payment-gateway";
import type {
  PaymentChannelValue,
  PaymentProcessorValue,
  PaymentProviderValue,
  PaymentsRepository,
} from "../ports/payments-repository";

interface CreateCheckoutSessionDeps {
  gateway: PaymentGateway;
  repository: PaymentsRepository;
  getOrderById: (id: string) => Promise<OrderDetailDto | null>;
  /** Which channel/provider/processor this gateway binding represents (e.g. MP_WALLET vs MODO). */
  channel: PaymentChannelValue;
  provider: PaymentProviderValue;
  processor: PaymentProcessorValue;
  buildSplit?: (
    order: OrderDetailDto,
  ) => Promise<CreateCheckoutSessionInput["split"]>;
}

export function createCheckoutSession(deps: CreateCheckoutSessionDeps) {
  return async (
    orderId: string,
    paymentAttemptId: string,
  ): Promise<{ checkoutUrl: string; checkoutId: string }> => {
    const order = await deps.getOrderById(orderId);
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
        message: "Los pagos aún no están configurados.",
      });
    }

    const paymentAttempt = await deps.repository.createPayment({
      orderId: order.id,
      channel: deps.channel,
      provider: deps.provider,
      processor: deps.processor,
      amountInCents: order.totalInCents,
      currency: "ARS",
      idempotencyKey: paymentAttemptId,
    });
    const payment = paymentAttempt.payment;
    if (
      !paymentAttempt.created &&
      payment.idempotencyKey !== paymentAttemptId
    ) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Ya existe un pago en proceso para este pedido.",
      });
    }
    if (
      !paymentAttempt.created &&
      !["CREATED", "PENDING", "PROCESSING"].includes(payment.status)
    ) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "El intento anterior ya finalizó. Volvé a intentarlo.",
      });
    }

    let session;
    try {
      const split = await deps.buildSplit?.(order);
      session = await deps.gateway.createCheckoutSession({
        paymentId: payment.id,
        orderId: order.id,
        orderNumber: order.orderNumber,
        amountInCents: order.totalInCents,
        currency: "ARS",
        payerEmail: order.contactEmail,
        payerName: order.contactName,
        payerIdentification: order.customerDocument ?? undefined,
        payerPhone: order.contactPhone,
        description: `Pedido #${String(order.orderNumber).padStart(6, "0")} · El Estampadero`,
        items: order.items.map((item) => ({
          description: item.productName,
          quantity: item.quantity,
          totalInCents: item.lineTotalInCents,
          imageUrl: item.imageUrl,
        })),
        split,
      });
    } catch (error) {
      // Creating a redirect session does not charge the customer. Releasing
      // the local attempt is therefore safe even if the provider response was
      // lost, and lets the customer try opening the checkout again.
      await deps.repository.markAttemptFailed?.(
        payment.id,
        "checkout_session_failed",
      );
      throw error;
    }

    await deps.repository.setPreferenceId(
      payment.id,
      session.providerPreferenceId,
    );
    if (session.providerPaymentId) {
      await deps.repository.setProviderPaymentId?.(
        payment.id,
        session.providerPaymentId,
      );
    }

    return {
      checkoutUrl: session.checkoutUrl,
      checkoutId: session.providerPreferenceId,
    };
  };
}
