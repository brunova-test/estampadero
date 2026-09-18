import { describe, expect, it, vi } from "vitest";

import type { OrderDetailDto } from "elestampadero/server/modules/orders";

import type { PaymentGateway } from "../ports/payment-gateway";
import type {
  PaymentRecord,
  PaymentsRepository,
} from "../ports/payments-repository";
import { createCheckoutSession } from "./create-checkout-session";

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
    providerPreferenceId: null,
    providerPaymentId: null,
    amountInCents: 10_000,
    currency: "ARS",
    status: "CREATED",
    idempotencyKey: "idem-1",
    ...overrides,
  };
}

function makeDeps(
  overrides: {
    gateway?: Partial<PaymentGateway>;
    repository?: Partial<PaymentsRepository>;
    order?: OrderDetailDto | null;
  } = {},
) {
  const gateway: PaymentGateway = {
    isConfigured: vi.fn(() => true),
    createCheckoutSession: vi.fn(async () => ({
      providerPreferenceId: "pref-1",
      checkoutUrl: "https://mercadopago.com/checkout/pref-1",
    })),
    getPayment: vi.fn(),
    payWithCard: vi.fn(),
    verifyWebhook: vi.fn(),
    findByExternalReference: vi.fn(),
    ...overrides.gateway,
  };

  const repository: PaymentsRepository = {
    createPayment: vi.fn(async () => ({
      payment: makePayment(),
      created: true,
    })),
    setPreferenceId: vi.fn(),
    findById: vi.fn(),
    findByOrderId: vi.fn(),
    findByProviderPaymentId: vi.fn(),
    findByPreferenceId: vi.fn(),
    recordWebhookEventOnce: vi.fn(),
    markApprovedAndPayOrder: vi.fn(),
    markStatus: vi.fn(),
    findStaleNonTerminalPayments: vi.fn(async () => []),
    ...overrides.repository,
  };

  const order = "order" in overrides ? overrides.order : makeOrder();
  const getOrderById = vi.fn(async () => order ?? null);

  return {
    gateway,
    repository,
    getOrderById,
    channel: "MP_WALLET" as const,
    provider: "MERCADO_PAGO" as const,
    processor: "MERCADO_PAGO" as const,
  };
}

describe("createCheckoutSession", () => {
  it("throws NOT_FOUND when the order does not exist", async () => {
    const deps = makeDeps({ order: null });

    await expect(
      createCheckoutSession(deps)("order-1", "idem-1"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("throws CONFLICT when the order is not pending payment", async () => {
    const deps = makeDeps({ order: makeOrder({ status: "PAID" }) });

    await expect(
      createCheckoutSession(deps)("order-1", "idem-1"),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("throws PRECONDITION_FAILED when the gateway is not configured", async () => {
    const deps = makeDeps({ gateway: { isConfigured: vi.fn(() => false) } });

    await expect(
      createCheckoutSession(deps)("order-1", "idem-1"),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(deps.repository.createPayment).not.toHaveBeenCalled();
  });

  it("creates a payment for the order's total, stores the preference id, and returns the checkout url", async () => {
    const deps = makeDeps({ order: makeOrder({ totalInCents: 42_000 }) });

    const result = await createCheckoutSession(deps)("order-1", "idem-1");

    expect(deps.repository.createPayment).toHaveBeenCalledWith(
      expect.objectContaining({ amountInCents: 42_000, channel: "MP_WALLET" }),
    );
    expect(deps.gateway.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        amountInCents: 42_000,
        paymentId: "payment-1",
      }),
    );
    expect(deps.repository.setPreferenceId).toHaveBeenCalledWith(
      "payment-1",
      "pref-1",
    );
    expect(result).toEqual({
      checkoutUrl: "https://mercadopago.com/checkout/pref-1",
      checkoutId: "pref-1",
    });
  });

  it("tags the payment with whichever channel/provider/processor this binding represents", async () => {
    const deps = makeDeps();
    const modoDeps = {
      ...deps,
      channel: "MODO" as const,
      provider: "MODO" as const,
      processor: "PAYWAY" as const,
    };

    await createCheckoutSession(modoDeps)("order-1", "idem-1");

    expect(modoDeps.repository.createPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: "MODO",
        provider: "MODO",
        processor: "PAYWAY",
      }),
    );
  });

  it("blocks a different payment attempt while one is still active", async () => {
    const deps = makeDeps({
      repository: {
        createPayment: vi.fn(async () => ({
          payment: makePayment({ idempotencyKey: "another-attempt" }),
          created: false,
        })),
      },
    });

    await expect(
      createCheckoutSession(deps)("order-1", "idem-1"),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(deps.gateway.createCheckoutSession).not.toHaveBeenCalled();
  });
});
