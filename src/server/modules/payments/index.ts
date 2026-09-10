import { getOrderByIdUseCase } from "elestampadero/server/modules/orders";
import { syncCommissionEligibilityForPayment } from "elestampadero/server/modules/commissions";

import { processWebhookEvent } from "./application/use-cases/process-webhook-event";
import { reconcilePayments } from "./application/use-cases/reconcile-payments";
import { runOrderPaidEffects } from "./infrastructure/order-paid-effects";
import { mercadoPagoGateway } from "./infrastructure/providers/mercado-pago-gateway";
import { modoGateway } from "./infrastructure/providers/modo-gateway";
import { paywayGateway } from "./infrastructure/providers/payway-gateway";
import { mobbexGateway } from "./infrastructure/providers/mobbex-gateway";
import { prismaPaymentsRepository } from "./infrastructure/persistence/prisma-payments-repository";

export { paymentsRouter } from "./presentation/router";
export type { ProcessWebhookResult } from "./application/use-cases/process-webhook-event";
export type { ReconcilePaymentsResult } from "./application/use-cases/reconcile-payments";

/**
 * Bound webhook processor for the Mercado Pago Route Handler
 * (src/app/api/webhooks/mercado-pago/route.ts). Route Handlers are thin
 * HTTP adapters that delegate straight to this use case.
 */
export const processMercadoPagoWebhookEvent = processWebhookEvent({
  gateway: mercadoPagoGateway,
  repository: prismaPaymentsRepository,
  getOrderById: getOrderByIdUseCase,
  onOrderPaid: runOrderPaidEffects,
  onPaymentUpdated: syncCommissionEligibilityForPayment,
  provider: "MERCADO_PAGO",
});

/**
 * Bound webhook processor for the MODO Route Handler
 * (src/app/api/webhooks/modo/route.ts). See modo-gateway.ts for why this
 * is inert scaffolding rather than a working integration — verifyWebhook
 * always returns null until real signature verification is implemented.
 */
export const processModoWebhookEvent = processWebhookEvent({
  gateway: modoGateway,
  repository: prismaPaymentsRepository,
  getOrderById: getOrderByIdUseCase,
  onOrderPaid: runOrderPaidEffects,
  onPaymentUpdated: syncCommissionEligibilityForPayment,
  provider: "MODO",
});

export const processMobbexWebhookEvent = processWebhookEvent({
  gateway: mobbexGateway,
  repository: prismaPaymentsRepository,
  getOrderById: getOrderByIdUseCase,
  onOrderPaid: runOrderPaidEffects,
  onPaymentUpdated: syncCommissionEligibilityForPayment,
  provider: "MOBBEX",
});

/**
 * Bound daily reconciliation job for the cron Route Handler
 * (src/app/api/cron/reconcile-payments/route.ts).
 */
export const reconcileMercadoPagoPayments = reconcilePayments({
  gateway: mercadoPagoGateway,
  repository: prismaPaymentsRepository,
  getOrderById: getOrderByIdUseCase,
  onOrderPaid: runOrderPaidEffects,
  onPaymentUpdated: syncCommissionEligibilityForPayment,
  provider: "MERCADO_PAGO",
});

export const reconcilePaywayPayments = reconcilePayments({
  gateway: paywayGateway,
  repository: prismaPaymentsRepository,
  getOrderById: getOrderByIdUseCase,
  onOrderPaid: runOrderPaidEffects,
  onPaymentUpdated: syncCommissionEligibilityForPayment,
  provider: "PAYWAY",
});

export const reconcileModoPayments = reconcilePayments({
  gateway: modoGateway,
  repository: prismaPaymentsRepository,
  getOrderById: getOrderByIdUseCase,
  onOrderPaid: runOrderPaidEffects,
  onPaymentUpdated: syncCommissionEligibilityForPayment,
  provider: "MODO",
});

export const reconcileMobbexPayments = reconcilePayments({
  gateway: mobbexGateway,
  repository: prismaPaymentsRepository,
  getOrderById: getOrderByIdUseCase,
  onOrderPaid: runOrderPaidEffects,
  onPaymentUpdated: syncCommissionEligibilityForPayment,
  provider: "MOBBEX",
});

export async function reconcileAllPayments() {
  const results = await Promise.all([
    reconcileMobbexPayments(),
    reconcileMercadoPagoPayments(),
    reconcilePaywayPayments(),
    reconcileModoPayments(),
  ]);
  return results.reduce(
    (total, result) => ({
      checked: total.checked + result.checked,
      updated: total.updated + result.updated,
      stillPending: total.stillPending + result.stillPending,
      anomalies: [...total.anomalies, ...result.anomalies],
    }),
    {
      checked: 0,
      updated: 0,
      stillPending: 0,
      anomalies: [] as Array<{ paymentId: string; reason: string }>,
    },
  );
}
