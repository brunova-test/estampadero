import { describe, expect, it, vi } from "vitest";

import type { OrderDetailDto } from "elestampadero/server/modules/orders";

import type { PaymentGateway, ProviderPaymentResult } from "../ports/payment-gateway";
import type { PaymentRecord, PaymentsRepository } from "../ports/payments-repository";
import { processWebhookEvent } from "./process-webhook-event";

function makeOrder(overrides: Partial<OrderDetailDto> = {}): OrderDetailDto {
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
    ...overrides,
  };
}

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

function makeProviderResult(
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

function makeDeps(overrides: {
  gateway?: Partial<PaymentGateway>;
  repository?: Partial<PaymentsRepository>;
  getOrderById?: (id: string) => Promise<OrderDetailDto | null>;
  onOrderPaid?: (order: OrderDetailDto) => Promise<void>;
} = {}) {
  const gateway: PaymentGateway = {
    isConfigured: vi.fn(() => true),
    createCheckoutSession: vi.fn(),
    getPayment: vi.fn(),
    payWithCard: vi.fn(),
    verifyWebhook: vi.fn(() => ({
      providerEventId: "evt-1",
      eventType: "payment",
      providerPaymentId: "mp-payment-1",
    })),
    findByExternalReference: vi.fn(),
    ...overrides.gateway,
  };

  const repository: PaymentsRepository = {
    createPayment: vi.fn(),
    setPreferenceId: vi.fn(),
    findById: vi.fn(),
    findByOrderId: vi.fn(),
    findByProviderPaymentId: vi.fn(),
    findByPreferenceId: vi.fn(),
    recordWebhookEventOnce: vi.fn(async () => true),
    markApprovedAndPayOrder: vi.fn(async () => true),
    markStatus: vi.fn(async () => undefined),
    findStaleNonTerminalPayments: vi.fn(async () => []),
    ...overrides.repository,
  };

  const getOrderById = overrides.getOrderById ?? vi.fn(async () => makeOrder());
  const onOrderPaid = overrides.onOrderPaid ?? vi.fn(async () => undefined);

  return { gateway, repository, getOrderById, onOrderPaid };
}

const webhookInput = {
  rawBody: "{}",
  headers: {},
  searchParams: new URLSearchParams(),
};

describe("processWebhookEvent", () => {
  it("rejects when the gateway cannot verify the signature", async () => {
    const deps = makeDeps({ gateway: { verifyWebhook: vi.fn(() => null) } });
    const result = await processWebhookEvent(deps)(webhookInput);

    expect(result).toEqual({ outcome: "invalid_signature" });
    expect(deps.repository.recordWebhookEventOnce).not.toHaveBeenCalled();
  });

  it("short-circuits on a duplicate event without re-querying the provider", async () => {
    const deps = makeDeps({
      repository: { recordWebhookEventOnce: vi.fn(async () => false) },
    });
    const result = await processWebhookEvent(deps)(webhookInput);

    expect(result).toEqual({ outcome: "duplicate" });
    expect(deps.gateway.getPayment).not.toHaveBeenCalled();
  });

  it("reports payment_not_found when the external reference has no matching local payment", async () => {
    const deps = makeDeps({
      gateway: {
        getPayment: vi.fn(async () => makeProviderResult({ externalReference: null })),
      },
    });
    const result = await processWebhookEvent(deps)(webhookInput);

    expect(result).toEqual({ outcome: "payment_not_found" });
  });

  it("reports amount_mismatch and does not touch the order when provider amount disagrees", async () => {
    const deps = makeDeps({
      gateway: {
        // local payment below is 10_000
        getPayment: vi.fn(async () => makeProviderResult({ amountInCents: 5_000 })),
      },
      repository: {
        findById: vi.fn(async () => makePayment()),
      },
    });
    const result = await processWebhookEvent(deps)(webhookInput);

    expect(result).toEqual({ outcome: "amount_mismatch" });
    expect(deps.repository.markApprovedAndPayOrder).not.toHaveBeenCalled();
    expect(deps.repository.markStatus).not.toHaveBeenCalled();
  });

  it("marks approved and runs order-paid effects exactly once when newly approved", async () => {
    const onOrderPaid = vi.fn(async () => undefined);
    const deps = makeDeps({
      gateway: { getPayment: vi.fn(async () => makeProviderResult()) },
      repository: {
        findById: vi.fn(async () => makePayment()),
        markApprovedAndPayOrder: vi.fn(async () => true),
      },
      onOrderPaid,
    });
    const result = await processWebhookEvent(deps)(webhookInput);

    expect(result).toEqual({ outcome: "processed" });
    expect(onOrderPaid).toHaveBeenCalledTimes(1);
  });

  it("does not re-run order-paid effects when the payment was already approved", async () => {
    const onOrderPaid = vi.fn(async () => undefined);
    const deps = makeDeps({
      gateway: { getPayment: vi.fn(async () => makeProviderResult()) },
      repository: {
        findById: vi.fn(async () =>
          makePayment({ providerPaymentId: "mp-payment-1", status: "APPROVED" }),
        ),
        // already approved: repository guard returns false
        markApprovedAndPayOrder: vi.fn(async () => false),
      },
      onOrderPaid,
    });
    const result = await processWebhookEvent(deps)(webhookInput);

    expect(result).toEqual({ outcome: "processed" });
    expect(onOrderPaid).not.toHaveBeenCalled();
  });

  it("records a non-approved status without touching the order", async () => {
    const deps = makeDeps({
      gateway: {
        getPayment: vi.fn(async () =>
          makeProviderResult({ providerStatus: "rejected", normalizedStatus: "REJECTED" }),
        ),
      },
      repository: {
        findById: vi.fn(async () => makePayment()),
      },
    });
    const result = await processWebhookEvent(deps)(webhookInput);

    expect(result).toEqual({ outcome: "processed" });
    expect(deps.repository.markStatus).toHaveBeenCalledWith(
      expect.objectContaining({ status: "REJECTED" }),
    );
    expect(deps.repository.markApprovedAndPayOrder).not.toHaveBeenCalled();
  });
});
