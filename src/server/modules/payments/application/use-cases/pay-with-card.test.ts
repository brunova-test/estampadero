import { describe, expect, it, vi } from "vitest";

import type { TRPCError } from "@trpc/server";

import type { OrderDetailDto } from "elestampadero/server/modules/orders";

import type { PaymentGateway } from "../ports/payment-gateway";
import type {
  PaymentRecord,
  PaymentsRepository,
} from "../ports/payments-repository";
import { payWithCard, type PayWithCardCommand } from "./pay-with-card";

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
    channel: "CARD",
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

const command: PayWithCardCommand = {
  orderId: "order-1",
  paymentAttemptId: "idem-1",
  cardToken: "tok_test",
  paymentMethodId: "visa",
  issuerId: null,
  installments: 1,
  payerDocType: null,
  payerDocNumber: null,
};

function makeDeps(
  overrides: {
    gateway?: Partial<PaymentGateway>;
    repository?: Partial<PaymentsRepository>;
    order?: OrderDetailDto | null;
    onOrderPaid?: (order: OrderDetailDto) => Promise<void>;
  } = {},
) {
  const gateway: PaymentGateway = {
    isConfigured: vi.fn(() => true),
    createCheckoutSession: vi.fn(),
    getPayment: vi.fn(),
    payWithCard: vi.fn(async () => ({
      providerPaymentId: "mp-payment-1",
      providerStatus: "approved",
      normalizedStatus: "APPROVED" as const,
      amountInCents: 10_000,
      currency: "ARS",
      externalReference: "payment-1",
    })),
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
    markApprovedAndPayOrder: vi.fn(async () => true),
    markStatus: vi.fn(async () => undefined),
    findStaleNonTerminalPayments: vi.fn(async () => []),
    ...overrides.repository,
  };

  const order = "order" in overrides ? overrides.order : makeOrder();
  const getOrderById = vi.fn(async () => order ?? null);
  const onOrderPaid = overrides.onOrderPaid ?? vi.fn(async () => undefined);

  return { gateway, repository, getOrderById, onOrderPaid };
}

describe("payWithCard", () => {
  it("throws NOT_FOUND when the order does not exist", async () => {
    const deps = makeDeps({ order: null });

    await expect(payWithCard(deps)(command)).rejects.toMatchObject({
      code: "NOT_FOUND",
    } satisfies Partial<TRPCError>);
  });

  it("throws CONFLICT when the order is not pending payment", async () => {
    const deps = makeDeps({ order: makeOrder({ status: "PAID" }) });

    await expect(payWithCard(deps)(command)).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("throws PRECONDITION_FAILED when the gateway is not configured", async () => {
    const deps = makeDeps({ gateway: { isConfigured: vi.fn(() => false) } });

    await expect(payWithCard(deps)(command)).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
    expect(deps.repository.createPayment).not.toHaveBeenCalled();
  });

  it("approves, pays the order, and runs order-paid effects when the gateway approves", async () => {
    const onOrderPaid = vi.fn(async () => undefined);
    const deps = makeDeps({ onOrderPaid });

    const outcome = await payWithCard(deps)(command);

    expect(outcome).toEqual({ status: "APPROVED", providerStatus: "approved" });
    expect(onOrderPaid).toHaveBeenCalledTimes(1);
  });

  it("does not run order-paid effects when markApprovedAndPayOrder reports no change", async () => {
    const onOrderPaid = vi.fn(async () => undefined);
    const deps = makeDeps({
      repository: { markApprovedAndPayOrder: vi.fn(async () => false) },
      onOrderPaid,
    });

    await payWithCard(deps)(command);

    expect(onOrderPaid).not.toHaveBeenCalled();
  });

  it("reports REJECTED and records status without paying the order", async () => {
    const deps = makeDeps({
      gateway: {
        payWithCard: vi.fn(async () => ({
          providerPaymentId: "mp-payment-1",
          providerStatus: "cc_rejected_insufficient_amount",
          normalizedStatus: "REJECTED" as const,
          amountInCents: 10_000,
          currency: "ARS",
          externalReference: "payment-1",
        })),
      },
    });

    const outcome = await payWithCard(deps)(command);

    expect(outcome.status).toBe("REJECTED");
    expect(deps.repository.markApprovedAndPayOrder).not.toHaveBeenCalled();
    expect(deps.repository.markStatus).toHaveBeenCalled();
  });

  it("reports PENDING for a processing status", async () => {
    const deps = makeDeps({
      gateway: {
        payWithCard: vi.fn(async () => ({
          providerPaymentId: "mp-payment-1",
          providerStatus: "in_process",
          normalizedStatus: "PROCESSING" as const,
          amountInCents: 10_000,
          currency: "ARS",
          externalReference: "payment-1",
        })),
      },
    });

    const outcome = await payWithCard(deps)(command);

    expect(outcome.status).toBe("PENDING");
  });

  it("does not charge again when the same attempt is retried", async () => {
    const deps = makeDeps({
      repository: {
        createPayment: vi.fn(async () => ({
          payment: makePayment({ status: "PROCESSING" }),
          created: false,
        })),
      },
    });

    const outcome = await payWithCard(deps)(command);

    expect(outcome.status).toBe("PENDING");
    expect(deps.gateway.payWithCard).not.toHaveBeenCalled();
  });

  it("charges the order's total, not a client-supplied amount", async () => {
    const deps = makeDeps({ order: makeOrder({ totalInCents: 25_000 }) });

    await payWithCard(deps)(command);

    expect(deps.gateway.payWithCard).toHaveBeenCalledWith(
      expect.objectContaining({ amountInCents: 25_000 }),
    );
    expect(deps.repository.createPayment).toHaveBeenCalledWith(
      expect.objectContaining({ amountInCents: 25_000 }),
    );
  });
});
