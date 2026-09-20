import "server-only";

import { env } from "elestampadero/env";

import type {
  CreateCheckoutSessionInput,
  PaymentGateway,
  ProviderPaymentResult,
  VerifiedWebhook,
} from "../../application/ports/payment-gateway";

const API_BASE = "https://api.mobbex.com";

function configured(): boolean {
  return Boolean(env.MOBBEX_API_KEY && env.MOBBEX_ACCESS_TOKEN);
}

function credentials(): Record<string, string> {
  if (!env.MOBBEX_API_KEY || !env.MOBBEX_ACCESS_TOKEN) {
    throw new Error("Mobbex no está configurado.");
  }
  return {
    "content-type": "application/json",
    "x-lang": "es",
    "x-api-key": env.MOBBEX_API_KEY,
    "x-access-token": env.MOBBEX_ACCESS_TOKEN,
  };
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...credentials(), ...init?.headers },
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const detail =
      body && typeof body === "object" && "error" in body
        ? String(body.error)
        : `HTTP ${response.status}`;
    throw new Error(`Mobbex rechazó la solicitud: ${detail}`);
  }
  return body;
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function string(value: unknown): string | undefined {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : undefined;
}

function number(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function normalizedStatus(
  code: string,
  message?: string,
): ProviderPaymentResult["normalizedStatus"] {
  if (["200", "201", "300", "301", "302"].includes(code)) {
    return "APPROVED";
  }
  if (code === "602") return "REFUNDED";
  if (code === "605") return "PARTIALLY_REFUNDED";



  if (code === "601" && /anulaci[oó]n exitosa/i.test(message ?? "")) {
    return "REFUNDED";
  }
  if (["401", "402", "600", "601", "610"].includes(code)) {
    return "CANCELLED";
  }
  if (Number(code) >= 400) return "REJECTED";
  if (["3", "4", "100", "210", "299", "303"].includes(code)) {
    return "PROCESSING";
  }
  return "PENDING";
}

function paymentFromOperation(body: unknown): Record<string, unknown> {
  const root = object(body);
  const data = object(root.data);
  const transaction = object(data.transaction);
  const payment = object(transaction.payment);
  if (Object.keys(payment).length > 0) return payment;
  return object(data.payment);
}

function toPaymentResult(body: unknown): ProviderPaymentResult {
  const payment = paymentFromOperation(body);
  if (Object.keys(payment).length === 0) {
    throw new Error("Mobbex no devolvió una operación de pago válida.");
  }
  const status = object(payment.status);
  const source = object(payment.source);
  const installment = object(source.installment);
  const currency = object(
    payment.requestedcurrency ?? payment.requestedCurrency,
  );
  const fallbackCurrency = object(payment.currency);
  const code = string(status.code) ?? "0";
  const statusMessage = string(status.message);
  const paymentStatus = normalizedStatus(code, statusMessage);
  const currencyCode =
    string(currency.code) ?? string(fallbackCurrency.code) ?? "ARS";
  const paymentTotal =
    number(payment.requestedtotal ?? payment.requestedTotal) ??
    number(payment.total) ??
    0;

  return {
    providerPaymentId: string(payment.id) ?? "",
    providerStatus: code,
    normalizedStatus: paymentStatus,
    amountInCents: Math.round(paymentTotal * 100),
    currency:
      env.MOBBEX_TEST_MODE && currencyCode.toUpperCase() === "TEST"
        ? "ARS"
        : currencyCode.toUpperCase(),
    externalReference: string(payment.reference) ?? null,
    paymentMethodType: string(source.type) ?? null,
    paymentMethodId: string(source.reference) ?? null,
    installments: number(installment.count) ?? null,
    moneyReleaseDate: null,
    moneyReleased: ["300", "301", "302"].includes(code),
    netReceivedInCents: null,
    feeInCents: null,
    financingFeeInCents: null,
    amountRefundedInCents:
      paymentStatus === "REFUNDED"
        ? Math.round(paymentTotal * 100)
        : paymentStatus === "PARTIALLY_REFUNDED"
          ? undefined
          : 0,
  };
}

export const mobbexGateway: PaymentGateway = {
  isConfigured: configured,

  async createCheckoutSession(input: CreateCheckoutSessionInput) {
    if (!input.payerName || !input.payerIdentification) {
      throw new Error(
        "Mobbex requiere nombre y documento del comprador para crear el checkout.",
      );
    }
    const payload = {
      total: input.amountInCents / 100,
      currency: "ars",
      reference: input.paymentId,
      description: input.description,
      test: env.MOBBEX_TEST_MODE,
      return_url: `${env.APP_URL}/pedido/${input.orderId}`,
      webhook: `${env.APP_URL}/api/webhooks/mobbex`,
      webhookstype: "intermediateandfinal",
      options: {
        embed: true,
        domain: new URL(env.APP_URL).hostname,
        embedversion: "1.2.0",
      },
      customer: {
        name: input.payerName,
        identification: input.payerIdentification,
        email: input.payerEmail,
        phone: input.payerPhone,
      },
      items: input.items?.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        total: item.totalInCents / 100,
        ...(item.imageUrl?.startsWith("https://")
          ? { image: item.imageUrl }
          : {}),
      })),
      split: input.split?.map((item) => ({
        entity: item.entity,
        total: item.totalInCents / 100,
        fee: item.feeInCents / 100,
        reference: item.reference,
        description: item.description,
        hold: false,
        refundFee: true,
      })),
    };
    const response = object(
      await request("/p/checkout", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
    const data = object(response.data);
    const checkoutId = string(data.id) ?? string(data.uid);
    const checkoutUrl = string(data.url);
    if (response.result !== true || !checkoutId || !checkoutUrl) {
      throw new Error("Mobbex no devolvió un checkout utilizable.");
    }
    return {
      providerPreferenceId: checkoutId,
      checkoutUrl,
    };
  },

  async getPayment(providerPaymentId: string) {
    return toPaymentResult(
      await request(`/p/operations/${encodeURIComponent(providerPaymentId)}`),
    );
  },

  async findByExternalReference(externalReference: string) {
    try {
      return toPaymentResult(
        await request(`/p/operations/${encodeURIComponent(externalReference)}`),
      );
    } catch {
      return null;
    }
  },

  async payWithCard() {
    throw new Error(
      "El pago con tarjeta se realiza dentro del checkout Mobbex.",
    );
  },

  verifyWebhook(input): VerifiedWebhook | null {
    let body: unknown;
    try {
      body = JSON.parse(input.rawBody) as unknown;
    } catch {
      return null;
    }
    const root = object(body);
    if (!string(root.type)?.startsWith("checkout")) return null;
    const data = object(root.data);
    const nestedData = object(data.data);
    const payment = object(data.payment ?? nestedData.payment);
    const status = object(payment.status);
    const paymentId = string(payment.id);
    const reference = string(payment.reference);
    const statusCode = string(status.code) ?? "0";
    if (!paymentId) return null;
    return {
      providerEventId: `${paymentId}:${statusCode}:${string(payment.updated) ?? "event"}`,
      eventType: statusCode,
      providerPaymentId: paymentId,
      externalReference: reference ?? null,
    };
  },

  async refundPayment({ providerPaymentId, amountInCents }) {
    const current = await this.getPayment(providerPaymentId);
    const isFullRefund = amountInCents >= current.amountInCents;
    const response = object(
      await request(
        `/p/operations/${encodeURIComponent(providerPaymentId)}/refund`,
        isFullRefund
          ? { method: "GET" }
          : {
              method: "POST",
              body: JSON.stringify({ total: amountInCents / 100 }),
            },
      ),
    );
    if (response.result !== true) {
      throw new Error("Mobbex no confirmó la devolución.");
    }
    const data = object(response.data);
    const status = object(response.status);
    return {
      providerRefundId:
        string(data.uid) ?? string(data.id) ?? `${providerPaymentId}-refund`,
      providerStatus: string(status.code) ?? string(data.status) ?? "refunded",
      amountInCents,
      createdAt: new Date().toISOString(),
    };
  },
};
