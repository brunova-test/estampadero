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






export const processMercadoPagoWebhookEvent = processWebhookEvent({
  gateway: mercadoPagoGateway,
  repository: prismaPaymentsRepository,
  getOrderById: getOrderByIdUseCase,
  onOrderPaid: runOrderPaidEffects,
  onPaymentUpdated: syncCommissionEligibilityForPayment,
  provider: "MERCADO_PAGO",
});







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
