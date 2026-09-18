import { describe, expect, it, vi } from "vitest";

import type { OrderDetailDto } from "elestampadero/server/modules/orders";

import type { PaymentGateway, ProviderPaymentResult } from "../ports/payment-gateway";
import type { PaymentRecord, PaymentsRepository } from "../ports/payments-repository";
import { reconcilePayments } from "./reconcile-payments";

function makePayment(overrides: Partial<PaymentRecord> = {}): PaymentRecord {
  return {
    id: "payment-1",
    orderId: "order-1",
    channel: "MP_WALLET",
    provider: "MERCADO_PAGO",
    processor: "MERCADO_PAGO",
    providerPreferenceId: "pref-1",
    providerPaymentId: null,
    amountInCents: 10_000,
    currency: "ARS",
    status: "PENDING",
    idempotencyKey: "idem-1",
    ...overrides,
  };
}

function makeOrder(): OrderDetailDto {
  return {
    id: "order-1",
    orderNumber: 1,
    status: "PENDING_PAYMENT",
    contactName: "Juana Pérez",
    contactEmail: "juana@example.com",
    contactPhone: "1122334455",
    deliveryMethod: "PICKUP",
    shippingAddress: null,
    shippingCity: null,
    shippingPostalCode: null,
    subtotalInCents: 10_000,
    shippingInCents: 0,
    totalInCents: 10_000,
    createdAt: new Date().toISOString(),
    items: [],
  };
}

function makeDeps(overrides: {
  gateway?: Partial<PaymentGateway>;
  repository?: Partial<PaymentsRepository>;
  staleFindResult?: PaymentRecord[];
  onOrderPaid?: (order: OrderDetailDto) => Promise<void>;
} = {}) {
  const gateway: PaymentGateway = {
    isConfigured: vi.fn(() => true),
    createCheckoutSession: vi.fn(),
    getPayment: vi.fn(),
    payWithCard: vi.fn(),
    verifyWebhook: vi.fn(),
    findByExternalReference: vi.fn(async () => null),
    ...overrides.gateway,
  };

  const repository: PaymentsRepository = {
    createPayment: vi.fn(),
    setPreferenceId: vi.fn(),
    findById: vi.fn(),
    findByOrderId: vi.fn(),
    findByProviderPaymentId: vi.fn(),
    findByPreferenceId: vi.fn(),
    recordWebhookEventOnce: vi.fn(),
    markApprovedAndPayOrder: vi.fn(async () => true),
    markStatus: vi.fn(async () => undefined),
    findStaleNonTerminalPayments: vi.fn(
      async () => overrides.staleFindResult ?? [makePayment()],
    ),
    ...overrides.repository,
  };

  const getOrderById = vi.fn(async () => makeOrder());
  const onOrderPaid = overrides.onOrderPaid ?? vi.fn(async () => undefined);

  return { gateway, repository, getOrderById, onOrderPaid };
}

function approvedResult(
  overrides: Partial<ProviderPaymentResult> = {},
): ProviderPaymentResult {
  return {
    providerPaymentId: "mp-payment-1",
    providerStatus: "approved",
    normalizedStatus: "APPROVED",
    amountInCents: 10_000,
    currency: "ARS",
    externalReference: "payment-1",
    ...overrides,
  };
}

describe("reconcilePayments", () => {
  it("returns immediately when there is nothing stale", async () => {
    const deps = makeDeps({ staleFindResult: [] });
    const result = await reconcilePayments(deps)();

    expect(result).toEqual({
      checked: 0,
      updated: 0,
      stillPending: 0,
      anomalies: [],
    });
  });

  it("looks up by providerPaymentId when the payment already has one (card channel)", async () => {
    const getPayment = vi.fn(async () => approvedResult());
    const deps = makeDeps({
      staleFindResult: [makePayment({ channel: "CARD", providerPaymentId: "mp-payment-1" })],
      gateway: { getPayment },
    });
    await reconcilePayments(deps)();

    expect(getPayment).toHaveBeenCalledWith("mp-payment-1");
    expect(deps.gateway.findByExternalReference).not.toHaveBeenCalled();
  });

  it("falls back to external-reference lookup when there is no providerPaymentId yet (wallet channel)", async () => {
    const findByExternalReference = vi.fn(async () => approvedResult());
    const deps = makeDeps({
      staleFindResult: [makePayment({ providerPaymentId: null })],
      gateway: { findByExternalReference },
    });
    await reconcilePayments(deps)();

    expect(findByExternalReference).toHaveBeenCalledWith("payment-1");
  });

  it("counts as still pending when the provider has no record yet", async () => {
    const deps = makeDeps({
      gateway: { findByExternalReference: vi.fn(async () => null) },
    });
    const result = await reconcilePayments(deps)();

    expect(result.stillPending).toBe(1);
    expect(result.updated).toBe(0);
    expect(deps.repository.markApprovedAndPayOrder).not.toHaveBeenCalled();
  });

  it("flags an amount mismatch as an anomaly instead of updating", async () => {
    const deps = makeDeps({
      gateway: {
        findByExternalReference: vi.fn(async () =>
          approvedResult({ amountInCents: 5_000 }),
        ),
      },
    });
    const result = await reconcilePayments(deps)();

    expect(result.anomalies).toHaveLength(1);
    expect(result.anomalies[0]?.reason).toContain("amount_mismatch");
    expect(deps.repository.markApprovedAndPayOrder).not.toHaveBeenCalled();
  });

  it("marks approved and runs order-paid effects when newly approved", async () => {
    const onOrderPaid = vi.fn(async () => undefined);
    const deps = makeDeps({
      gateway: { findByExternalReference: vi.fn(async () => approvedResult()) },
      onOrderPaid,
    });
    const result = await reconcilePayments(deps)();

    expect(result.updated).toBe(1);
    expect(onOrderPaid).toHaveBeenCalledTimes(1);
  });

  it("does not double-count or re-run effects when already approved", async () => {
    const onOrderPaid = vi.fn(async () => undefined);
    const deps = makeDeps({
      gateway: { findByExternalReference: vi.fn(async () => approvedResult()) },
      repository: { markApprovedAndPayOrder: vi.fn(async () => false) },
      onOrderPaid,
    });
    const result = await reconcilePayments(deps)();

    expect(result.updated).toBe(0);
    expect(result.stillPending).toBe(1);
    expect(onOrderPaid).not.toHaveBeenCalled();
  });

  it("updates status for a non-approved, non-pending terminal outcome (e.g. rejected)", async () => {
    const deps = makeDeps({
      gateway: {
        findByExternalReference: vi.fn(async () =>
          approvedResult({ normalizedStatus: "REJECTED", providerStatus: "rejected" }),
        ),
      },
    });
    const result = await reconcilePayments(deps)();

    expect(result.updated).toBe(1);
    expect(deps.repository.markStatus).toHaveBeenCalledWith(
      expect.objectContaining({ status: "REJECTED" }),
    );
  });

  it("treats a still-PENDING provider status as still pending, not an update", async () => {
    const deps = makeDeps({
      gateway: {
        findByExternalReference: vi.fn(async () =>
          approvedResult({ normalizedStatus: "PENDING", providerStatus: "pending" }),
        ),
      },
    });
    const result = await reconcilePayments(deps)();

    expect(result.stillPending).toBe(1);
    expect(result.updated).toBe(0);
    expect(deps.repository.markStatus).not.toHaveBeenCalled();
  });

  it("captures a lookup failure as an anomaly instead of throwing", async () => {
    const deps = makeDeps({
      gateway: {
        findByExternalReference: vi.fn(async () => {
          throw new Error("network timeout");
        }),
      },
    });
    const result = await reconcilePayments(deps)();

    expect(result.anomalies).toEqual([
      { paymentId: "payment-1", reason: "lookup_failed: network timeout" },
    ]);
  });

  it("passes the grace/lookback window through to the repository query", async () => {
    const deps = makeDeps({ staleFindResult: [] });
    const before = Date.now();
    await reconcilePayments(deps)({ graceMs: 1_000, lookbackMs: 5_000, limit: 7 });

    expect(deps.repository.findStaleNonTerminalPayments).toHaveBeenCalledTimes(1);
    const call = vi.mocked(deps.repository.findStaleNonTerminalPayments).mock.calls[0]?.[0];
    expect(call?.limit).toBe(7);
    expect(call?.olderThan.getTime()).toBeLessThanOrEqual(before - 1_000 + 5);
    expect(call?.newerThan.getTime()).toBeLessThanOrEqual(before - 5_000 + 5);
  });
});
