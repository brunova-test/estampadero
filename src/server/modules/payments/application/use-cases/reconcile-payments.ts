import "server-only";

import type { OrderDetailDto } from "elestampadero/server/modules/orders";

import type { PaymentGateway } from "../ports/payment-gateway";
import type {
  PaymentProviderValue,
  PaymentRecord,
  PaymentsRepository,
} from "../ports/payments-repository";

export interface ReconcilePaymentsResult {
  checked: number;
  updated: number;
  stillPending: number;
  anomalies: Array<{ paymentId: string; reason: string }>;
}

interface ReconcilePaymentsDeps {
  gateway: PaymentGateway;
  repository: PaymentsRepository;
  getOrderById: (id: string) => Promise<OrderDetailDto | null>;
  onOrderPaid: (order: OrderDetailDto) => Promise<void>;
  onPaymentUpdated?: (paymentId: string) => Promise<void>;
  provider?: PaymentProviderValue;
}

interface ReconcilePaymentsInput {

  graceMs?: number;

  lookbackMs?: number;

  limit?: number;
}

const DEFAULT_GRACE_MS = 15 * 60_000;
const DEFAULT_LOOKBACK_MS = 3 * 24 * 60 * 60_000;
const DEFAULT_LIMIT = 200;










export function reconcilePayments(deps: ReconcilePaymentsDeps) {
  return async (
    input: ReconcilePaymentsInput = {},
  ): Promise<ReconcilePaymentsResult> => {
    const graceMs = input.graceMs ?? DEFAULT_GRACE_MS;
    const lookbackMs = input.lookbackMs ?? DEFAULT_LOOKBACK_MS;
    const limit = input.limit ?? DEFAULT_LIMIT;
    const now = Date.now();

    const stalePayments = await deps.repository.findStaleNonTerminalPayments({
      provider: deps.provider ?? "MERCADO_PAGO",
      olderThan: new Date(now - graceMs),
      newerThan: new Date(now - lookbackMs),
      limit,
    });

    const result: ReconcilePaymentsResult = {
      checked: stalePayments.length,
      updated: 0,
      stillPending: 0,
      anomalies: [],
    };

    for (const payment of stalePayments) {
      await reconcileOne(payment, deps, result);
    }

    const awaitingRelease =
      (await deps.repository.findPaymentsAwaitingRelease?.({
        provider: deps.provider ?? "MERCADO_PAGO",
        newerThan: new Date(now - 180 * 24 * 60 * 60_000),
        limit,
      })) ?? [];
    const alreadyChecked = new Set(stalePayments.map((payment) => payment.id));
    for (const payment of awaitingRelease) {
      if (alreadyChecked.has(payment.id)) continue;
      result.checked += 1;
      await reconcileOne(payment, deps, result);
    }

    return result;
  };
}

async function reconcileOne(
  payment: PaymentRecord,
  deps: ReconcilePaymentsDeps,
  result: ReconcilePaymentsResult,
): Promise<void> {
  try {
    const providerResult = payment.providerPaymentId
      ? await deps.gateway.getPayment(payment.providerPaymentId)
      : await deps.gateway.findByExternalReference(payment.id);

    if (!providerResult) {


      result.stillPending += 1;
      return;
    }

    if (
      providerResult.amountInCents !== payment.amountInCents ||
      providerResult.currency !== payment.currency
    ) {
      result.anomalies.push({
        paymentId: payment.id,
        reason: `amount_mismatch: local ${payment.amountInCents} ${payment.currency} vs provider ${providerResult.amountInCents} ${providerResult.currency}`,
      });
      return;
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
        result.updated += 1;
        const order = await deps.getOrderById(payment.orderId);
        if (order) await deps.onOrderPaid(order);
      } else {
        result.stillPending += 1;
      }
    } else if (providerResult.normalizedStatus === "PENDING") {
      result.stillPending += 1;
    } else {
      await deps.repository.markStatus({
        paymentId: payment.id,
        providerPaymentId: providerResult.providerPaymentId,
        status: providerResult.normalizedStatus,
        providerStatus: providerResult.providerStatus,
      });
      result.updated += 1;
    }

    await deps.onPaymentUpdated?.(payment.id);
  } catch (error) {
    result.anomalies.push({
      paymentId: payment.id,
      reason: `lookup_failed: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}
