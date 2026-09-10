import "server-only";

import { TRPCError } from "@trpc/server";

import type {
  PaymentProviderValue,
  PaymentsRepository,
} from "../ports/payments-repository";

function isRealProviderId(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 && normalized !== "0";
}

/** Stores a refund id obtained from Payway for a refund created before it was persisted. */
export function setRefundReference(deps: {
  repository: PaymentsRepository;
  provider: PaymentProviderValue;
}) {
  return async (input: { paymentId: string; providerRefundId: string }) => {
    const payment = await deps.repository.findById(input.paymentId);
    if (!payment) throw new TRPCError({ code: "NOT_FOUND", message: "Pago no encontrado." });
    if (payment.provider !== deps.provider) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Este pago no se procesó con Payway." });
    }
    if (!isRealProviderId(input.providerRefundId)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Ingresá el ID real de devolución informado por Payway." });
    }
    if (
      payment.status !== "REFUNDED" &&
      payment.status !== "PARTIALLY_REFUNDED"
    ) {
      throw new TRPCError({ code: "CONFLICT", message: "Este pago no tiene una devolución registrada para asociar." });
    }
    const recordedRefundedInCents = payment.amountRefundedInCents ?? 0;
    const refundedInCents =
      recordedRefundedInCents > 0
        ? recordedRefundedInCents
        : payment.status === "REFUNDED"
          ? payment.amountInCents
          : 0;
    if (!refundedInCents) {
      throw new TRPCError({ code: "CONFLICT", message: "Payway no informó el importe de esta devolución parcial." });
    }
    await deps.repository.setRefundReference?.({
      paymentId: payment.id,
      providerRefundId: input.providerRefundId.trim(),
      lastRefundAmountInCents: refundedInCents,
    });
  };
}
