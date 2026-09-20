import "server-only";

import { TRPCError } from "@trpc/server";

import type { PaymentGateway } from "../ports/payment-gateway";
import type {
  PaymentProviderValue,
  PaymentsRepository,
} from "../ports/payments-repository";

export interface VoidRefundCommand {
  paymentId: string;
}

export interface VoidRefundOutcome {
  status: "APPROVED" | "PARTIALLY_REFUNDED";
  amountRefundedInCents: number;
}

interface VoidRefundDeps {
  gateway: PaymentGateway;
  repository: PaymentsRepository;
  provider: PaymentProviderValue;
}






function isRealProviderId(value: string | null | undefined): value is string {
  if (!value) return false;
  const normalizedValue = value.trim();
  return normalizedValue.length > 0 && normalizedValue !== "0";
}







export function voidRefund(deps: VoidRefundDeps) {
  return async (command: VoidRefundCommand): Promise<VoidRefundOutcome> => {
    const payment = await deps.repository.findById(command.paymentId);
    if (!payment) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Pago no encontrado.",
      });
    }
    if (payment.provider !== deps.provider) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: `Este pago no se procesó con ${deps.provider}.`,
      });
    }
    if (!isRealProviderId(payment.providerPaymentId)) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
          "Este pago no tiene un identificador real de Payway; no se puede revertir el reintegro.",
      });
    }
    if (!isRealProviderId(payment.lastProviderRefundId)) {
      throw new TRPCError({
        code: "CONFLICT",
        message:
          "Este pago no tiene el identificador del reintegro de Payway necesario para revertirlo.",
      });
    }
    if (!deps.gateway.voidRefund) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
          "Este medio de pago no admite revertir reintegros desde el sistema.",
      });
    }
    const voidedAmountInCents =
      payment.lastRefundAmountInCents ?? payment.amountRefundedInCents ?? 0;
    if (voidedAmountInCents <= 0) {
      throw new TRPCError({
        code: "CONFLICT",
        message:
          "No se conoce el importe del reintegro de Payway que se quiere revertir.",
      });
    }

    try {


      console.log({
        paywayPaymentId: payment.providerPaymentId,
        paywayRefundId: payment.lastProviderRefundId,
      });
      await deps.gateway.voidRefund({
        providerPaymentId: payment.providerPaymentId,
        providerRefundId: payment.lastProviderRefundId,
        amountInCents: voidedAmountInCents,
      });
    } catch (err) {
      throw new TRPCError({
        code: "CONFLICT",
        message:
          err instanceof Error
            ? err.message
            : "Payway rechazó la reversión del reintegro.",
      });
    }

    const previouslyRefundedInCents = payment.amountRefundedInCents ?? 0;
    const amountRefundedInCents = Math.max(
      0,
      previouslyRefundedInCents - voidedAmountInCents,
    );
    const status =
      amountRefundedInCents > 0 ? "PARTIALLY_REFUNDED" : "APPROVED";

    await deps.repository.recordRefundVoided?.({
      paymentId: payment.id,
      amountRefundedInCents,
      status,
    });

    return { status, amountRefundedInCents };
  };
}
