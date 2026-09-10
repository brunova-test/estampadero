import "server-only";

import { env } from "elestampadero/env";

import type {
  CreateCheckoutSessionInput,
  CreateCheckoutSessionResult,
  PaymentGateway,
  PayWithCardInput,
  ProviderPaymentResult,
  ProviderRefundResult,
  VerifyWebhookInput,
} from "../../application/ports/payment-gateway";

type JsonObject = Record<string, unknown>;

class PaywayRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "PaywayRequestError";
  }
}

const BASE_URLS = {
  // BASEPATH as issued by the certification portal for this merchant
  // (certification ID 37e1a409-1409-482e-b205-805bf21d6442). The generic
  // Payway docs list developers-ventasonline.payway.com.ar as "the"
  // sandbox host, but our keys were issued against api-homo.payway.com.ar
  // specifically, so that's the host that has to be used.
  sandbox: "https://api-homo.payway.com.ar/api/v2",
  production: "https://ventasonline.payway.com.ar/api/v2",
} as const;

const STATUS_MAP: Record<string, ProviderPaymentResult["normalizedStatus"]> = {
  approved: "APPROVED",
  pre_approved: "PROCESSING",
  review: "PROCESSING",
  pending: "PENDING",
  rejected: "REJECTED",
  cancelled: "CANCELLED",
  voided: "CANCELLED",
  refunded: "REFUNDED",
  partially_refunded: "PARTIALLY_REFUNDED",
};

function requireConfig() {
  if (!env.PAYWAY_PRIVATE_API_KEY) {
    throw new Error("Payway no está configurado en el servidor.");
  }
  return {
    baseUrl: BASE_URLS[env.PAYWAY_ENVIRONMENT],
    privateApiKey: env.PAYWAY_PRIVATE_API_KEY,
  };
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" ? (value as JsonObject) : {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asIdentifier(value: unknown): string | null {
  return typeof value === "number" && Number.isFinite(value)
    ? String(value)
    : asString(value);
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (
    typeof value === "string" &&
    value.trim() &&
    Number.isFinite(Number(value))
  ) {
    return Number(value);
  }
  return null;
}

function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let remaining = days;
  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + 1);
    const weekday = result.getUTCDay();
    if (weekday !== 0 && weekday !== 6) remaining -= 1;
  }
  return result;
}

function releaseDateFor(paymentMethodId: string | null, paidAt: string | null) {
  if (!paidAt) return null;
  const isDebit = paymentMethodId === "31" || paymentMethodId === "105";
  const days = isDebit
    ? env.PAYWAY_DEBIT_RELEASE_BUSINESS_DAYS
    : env.PAYWAY_CREDIT_RELEASE_BUSINESS_DAYS;
  if (days === undefined) return null;
  const date = new Date(paidAt);
  if (Number.isNaN(date.getTime())) return null;
  return addBusinessDays(date, days).toISOString();
}

function safeProviderError(status: number, body: unknown): PaywayRequestError {
  // Decidir/Payway returns two very different shapes depending on the
  // failure: a rejected *payment* comes back as an object with
  // status_details.error.{reason,type}, while a *request validation*
  // error (bad apikey, malformed param, disallowed field, etc.) comes
  // back as a bare array of { error, param, code } at the root. Handle
  // both so validation errors don't collapse into a useless generic
  // message. Neither shape can contain card data: we only ever send a
  // one-time token, never PAN/CVV.
  if (isUnknownArray(body)) {
    const first = asObject(body[0]);
    const reason = asString(first.error) ?? asString(first.code);
    const param = asString(first.param);
    return new PaywayRequestError(
      reason
        ? `Payway rechazó la solicitud (${status}): ${reason}${param ? ` [param: ${param}]` : ""}`
        : `Payway no pudo procesar la operación (${status}).`,
      status,
    );
  }
  const data = asObject(body);
  const validationErrors = isUnknownArray(data.validation_errors)
    ? data.validation_errors
    : [];
  const firstValidationError = asObject(validationErrors[0]);
  const details = asObject(data.status_details);
  const providerError = asObject(details.error);
  const providerReason = asObject(providerError.reason);
  const reason =
    asString(firstValidationError.param) ??
    asString(firstValidationError.code) ??
    asString(providerReason.description) ??
    asString(providerError.reason) ??
    asString(providerError.type) ??
    asString(data.error_type) ??
    asString(data.message) ??
    asString(data.error);
  return new PaywayRequestError(
    reason
      ? `Payway rechazó la operación (${status}): ${reason}`
      : `Payway no pudo procesar la operación (${status}).`,
    status,
  );
}

async function paywayRequest(
  path: string,
  init: RequestInit = {},
): Promise<JsonObject> {
  const config = requireConfig();
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      // Per Payway's official docs ("Headers obligatorios"): the API key
      // header is `apikey`, not `X-Api-Key`.
      apikey: config.privateApiKey,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const body: unknown = await response.json().catch(() => ({}));
  // Payway returns a fully formed payment with status=rejected as HTTP 402.
  // It is a business outcome, not a malformed request.
  if (!response.ok && response.status !== 402) {
    // TEMP DIAGNOSTIC: safeProviderError couldn't extract a reason from
    // this body shape (neither the array-of-errors nor the
    // status_details.error object we know about), so log the redacted
    // raw body once to see what Payway actually sent back. Redacts any
    // token/card-ish field even though we never send PAN/CVV, per the
    // "never log payment tokens" rule in docs/payments-configuration.md.
    // Remove this once the real cause is identified.
    console.error(
      `[payway diagnostic] ${response.status} ${path} body=${redactForLog(body)}`,
    );
    throw safeProviderError(response.status, body);
  }
  return asObject(body);
}

export interface TokenizeCardInput {
  cardNumber: string;
  securityCode: string;
  cardHolderName: string;
  expirationMonth: string;
  expirationYear: string;
  docType: string;
  docNumber: string;
  paymentMethodId: string;
}

export interface TokenizeCardResult {
  id: string;
  bin: string;
}

/**
 * Server-to-server tokenization. Payway's /tokens CORS config doesn't allow
 * a browser to call it directly with the keys issued for this merchant's
 * BASEPATH (api-homo.payway.com.ar) — confirmed via the browser's network
 * tab: the preflight explicitly rejects the `apikey` header for this
 * origin. This mirrors the "Requisitos técnicos" doc's server-to-server
 * requirement: the browser posts raw card data to our own domain (no CORS
 * involved), and this function relays it to Payway from the server, which
 * has no CORS restriction. The card data passes through in memory only —
 * it is never logged or persisted, only forwarded and immediately
 * discarded once the token comes back.
 */
export async function paywayTokenizeCard(
  input: TokenizeCardInput,
): Promise<TokenizeCardResult> {
  const publicKey = env.NEXT_PUBLIC_PAYWAY_PUBLIC_API_KEY;
  if (!publicKey) {
    throw new Error("Payway no está configurado en el servidor.");
  }
  const baseUrl = BASE_URLS[env.PAYWAY_ENVIRONMENT];
  // NOTE: payment_method_id was added here twice (as a Number, then as a
  // string) chasing a Payway "invalid_param: payment_method_id" error on
  // /tokens. Neither change altered Payway's response one bit — same
  // error, byte-for-byte, whether the field was a Number, a string, or
  // absent entirely. That means the field's presence/format was never the
  // actual cause; the error is coming from something else (BIN-level
  // classification on Payway's side, or an account/site config issue —
  // see docs/payway-troubleshooting.md). Reverting to the form that
  // successfully tokenized cards during certification Step 1.
  const requestBody = {
    card_number: input.cardNumber,
    security_code: input.securityCode,
    card_holder_name: input.cardHolderName,
    card_expiration_month: input.expirationMonth,
    card_expiration_year: input.expirationYear,
    card_holder_identification: {
      type: input.docType,
      number: input.docNumber,
    },
  };
  const response = await fetch(`${baseUrl}/tokens`, {
    method: "POST",
    headers: { apikey: publicKey, "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const body: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error(
      `[payway diagnostic] ${response.status} /tokens sent=${redactForLog(requestBody)} body=${redactForLog(body)}`,
    );
    throw safeProviderError(response.status, body);
  }
  const data = asObject(body);
  const id = asString(data.id);
  if (!id) throw new Error("Payway no pudo generar el token de la tarjeta.");
  return { id, bin: asString(data.bin) ?? "" };
}

const SENSITIVE_KEY_PATTERN = /token|card|cvv|security_code|pan\b/i;

function redactReplacer(key: string, val: unknown): unknown {
  return SENSITIVE_KEY_PATTERN.test(key) ? "[redacted]" : val;
}

function redactForLog(value: unknown): string {
  const serialized: string = JSON.stringify(value, redactReplacer) ?? "null";
  return serialized.slice(0, 1000);
}

function toProviderPaymentResult(data: JsonObject): ProviderPaymentResult {
  const providerPaymentId = asIdentifier(data.id);
  if (!providerPaymentId)
    throw new Error("Payway devolvió un pago sin identificador.");
  const providerStatus = (asString(data.status) ?? "unknown").toLowerCase();
  const amountInCents = Math.round(asNumber(data.amount) ?? 0);
  const amountRefundedInCents = Math.round(
    asNumber(data.amount_refunded) ?? asNumber(data.refunded_amount) ?? 0,
  );
  const paymentMethodId = asIdentifier(data.payment_method_id);
  const paidAt = asString(data.date);
  const moneyReleaseDate = releaseDateFor(paymentMethodId, paidAt);
  const refunds = isUnknownArray(data.refunds) ? data.refunds : [];
  const latestRefund = asObject(refunds.at(-1));
  const latestProviderRefundId =
    asIdentifier(data.refund_id) ??
    asIdentifier(data.last_refund_id) ??
    asIdentifier(asObject(data.refund).id) ??
    asIdentifier(latestRefund.id);

  return {
    providerPaymentId,
    providerStatus,
    normalizedStatus:
      amountRefundedInCents >= amountInCents && amountInCents > 0
        ? "REFUNDED"
        : amountRefundedInCents > 0
          ? "PARTIALLY_REFUNDED"
          : (STATUS_MAP[providerStatus] ?? "PENDING"),
    amountInCents,
    currency: (asString(data.currency) ?? "ARS").toUpperCase(),
    externalReference: asString(data.site_transaction_id),
    paymentMethodType:
      paymentMethodId === "31" || paymentMethodId === "105"
        ? "debit_card"
        : "credit_card",
    paymentMethodId,
    installments: asNumber(data.installments),
    moneyReleaseDate,
    moneyReleased: false,
    amountRefundedInCents,
    latestProviderRefundId,
  };
}

export const paywayGateway: PaymentGateway = {
  isConfigured() {
    return Boolean(env.PAYWAY_PRIVATE_API_KEY);
  },

  isDefinitiveFailure(error) {
    return (
      error instanceof PaywayRequestError &&
      error.status >= 400 &&
      error.status < 500 &&
      error.status !== 408 &&
      error.status !== 429
    );
  },

  createCheckoutSession(
    _input: CreateCheckoutSessionInput,
  ): Promise<CreateCheckoutSessionResult> {
    return Promise.reject(
      new Error(
        "Payway tarjeta utiliza tokenización directa, no una sesión de checkout.",
      ),
    );
  },

  async payWithCard(input: PayWithCardInput) {
    requireConfig();
    const allowedMethods = new Set(["1", "31", "104", "105"]);
    const allowedInstallments = new Set(
      env.NEXT_PUBLIC_PAYWAY_INSTALLMENTS.split(",")
        .map((value) => Number(value.trim()))
        .filter(
          (value) => Number.isInteger(value) && value >= 1 && value <= 24,
        ),
    );
    allowedInstallments.add(1);
    if (
      !/^\d{6,8}$/.test(input.bin) ||
      !allowedMethods.has(input.paymentMethodId)
    ) {
      throw new Error("Los datos tokenizados de la tarjeta son inválidos.");
    }
    const isDebit =
      input.paymentMethodId === "31" || input.paymentMethodId === "105";
    if (
      (isDebit && input.installments !== 1) ||
      !allowedInstallments.has(input.installments)
    ) {
      throw new Error(
        "La cantidad de cuotas no está habilitada para este comercio.",
      );
    }
    const body = await paywayRequest("/payments", {
      method: "POST",
      body: JSON.stringify({
        site_transaction_id: input.paymentId,
        token: input.cardToken,
        payment_method_id: Number(input.paymentMethodId),
        bin: input.bin,
        amount: input.amountInCents,
        currency: input.currency,
        installments: input.installments,
        description: input.description.slice(0, 100),
        payment_type: "single",
        sub_payments: [],
      }),
    });
    return toProviderPaymentResult(body);
  },

  async getPayment(providerPaymentId: string) {
    const body = await paywayRequest(
      `/payments/${encodeURIComponent(providerPaymentId)}`,
    );
    // TEMP DIAGNOSTIC: need to see whether Payway's payment-detail response
    // exposes the refund's own id (to backfill lastProviderRefundId for
    // refunds created before that field existed). Remove once confirmed.
    console.error(
      `[payway diagnostic] GET /payments body=${redactForLog(body)}`,
    );
    return toProviderPaymentResult(body);
  },

  async findByExternalReference(externalReference: string) {
    requireConfig();
    try {
      const result = await paywayRequest(
        `/payments?siteOperationId=${encodeURIComponent(externalReference)}`,
      );
      if (result.id) return toProviderPaymentResult(result);
      const possibleLists = [
        result,
        result.results,
        result.content,
        result.payments,
      ];
      const list = possibleLists.find(isUnknownArray);
      const first = list?.[0];
      return first ? toProviderPaymentResult(asObject(first)) : null;
    } catch (error) {
      // Some homologation sites reject the documented siteOperationId filter
      // with `query_params_siteOperationId`. The unfiltered paginated listing
      // is part of the same public API, so use it as a compatibility fallback
      // and match the original site_transaction_id locally.
      if (
        env.PAYWAY_ENVIRONMENT !== "sandbox" ||
        !(error instanceof PaywayRequestError) ||
        error.status !== 400
      ) {
        throw error;
      }

      const pageSize = 50;
      for (let page = 0; page < 5; page += 1) {
        const result = await paywayRequest(
          `/payments?offset=${page * pageSize}&pageSize=${pageSize}`,
        );
        const possibleLists = [result.results, result.content, result.payments];
        const list = possibleLists.find(isUnknownArray) ?? [];
        const match = list.find(
          (payment) =>
            asString(asObject(payment).site_transaction_id) ===
            externalReference,
        );
        if (match) return toProviderPaymentResult(asObject(match));
        if (result.hasMore !== true || list.length < pageSize) return null;
      }
      return null;
    }
  },

  async refundPayment(input): Promise<ProviderRefundResult> {
    // Payway's /refunds endpoint requires an explicit "amount" in every
    // request — an empty body (which some Payway docs describe as meaning
    // "full reversal") is rejected with a 400 invalid_param on "amount".
    // Always send the amount, whether it's the full remaining balance or a
    // partial refund.
    const body = await paywayRequest(
      `/payments/${encodeURIComponent(input.providerPaymentId)}/refunds`,
      {
        method: "POST",
        headers: { "X-Idempotency-Key": input.idempotencyKey },
        body: JSON.stringify({ amount: input.amountInCents }),
      },
    );
    const id = asIdentifier(body.id);
    if (!id) throw new Error("Payway devolvió un reembolso sin identificador.");
    return {
      providerRefundId: id,
      providerStatus: asString(body.status) ?? "unknown",
      amountInCents: Math.round(asNumber(body.amount) ?? input.amountInCents),
      createdAt: asString(body.date) ?? asString(body.date_created),
    };
  },

  async voidRefund(input): Promise<void> {
    // Distinct from refundPayment: this cancels a refund that was already
    // created, targeting it by its own provider id — confirmed against the
    // official Payway SDK (sdk-net-ventaonline's DeleteRefund/
    // DeletePartialRefund), since Payway's e-commerce REST reference isn't
    // published. Certification step "Anulación de devolución total/parcial".
    await paywayRequest(
      `/payments/${encodeURIComponent(input.providerPaymentId)}/refunds/${encodeURIComponent(input.providerRefundId)}`,
      {
        method: "DELETE",
        // Payway's homologation endpoint validates `amount` for a DELETE
        // even though its public reference omits a request body. Sending the
        // original refund amount is required by the live 400 `amount` error.
        body: JSON.stringify({ amount: input.amountInCents }),
      },
    );
  },

  async verifyWebhook(_input: VerifyWebhookInput) {
    // Payway Ventas Online does not document a signed payment webhook for
    // this direct-card API. Status is confirmed by the synchronous response
    // and the authenticated reconciliation job.
    return null;
  },
};
