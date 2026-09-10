import "server-only";

import {
  createHash,
  createPublicKey,
  verify,
  type JsonWebKey as NodeJsonWebKey,
} from "node:crypto";

import { env } from "elestampadero/env";

import type {
  CreateCheckoutSessionInput,
  PaymentGateway,
  PayWithCardInput,
  ProviderPaymentResult,
  ProviderRefundResult,
  VerifiedWebhook,
  VerifyWebhookInput,
} from "../../application/ports/payment-gateway";

type JsonObject = Record<string, unknown>;

const BASE_URLS = {
  sandbox: "https://merchants.preprod.playdigital.com.ar",
  production: "https://merchants.playdigital.com.ar",
} as const;

let tokenCache: { token: string; expiresAt: number } | null = null;
type ModoJwk = NodeJsonWebKey & { kid?: string; kty?: string };

let jwksCache: { keys: ModoJwk[]; expiresAt: number } | null = null;

function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" ? (value as JsonObject) : {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? (value as unknown[]) : [];
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

function requireConfig() {
  if (
    !env.MODO_USERNAME ||
    !env.MODO_PASSWORD ||
    !env.MODO_PROCESSOR_CODE ||
    !env.MODO_CC_CODE ||
    !env.MODO_MERCHANT_NAME
  ) {
    throw new Error("MODO no está configurado en el servidor.");
  }
  return {
    baseUrl: BASE_URLS[env.MODO_ENVIRONMENT],
    username: env.MODO_USERNAME,
    password: env.MODO_PASSWORD,
    processorCode: env.MODO_PROCESSOR_CODE,
    ccCode: env.MODO_CC_CODE,
    merchantName: env.MODO_MERCHANT_NAME,
  };
}

function safeModoError(status: number, body: unknown): Error {
  const data = asObject(body);
  const message = asString(data.message) ?? asString(data.error);
  return new Error(
    message
      ? `MODO rechazó la operación (${status}): ${message}`
      : `MODO no pudo procesar la operación (${status}).`,
  );
}

async function parseResponse(response: Response): Promise<JsonObject> {
  const body: unknown = await response.json().catch(() => ({}));
  if (!response.ok) throw safeModoError(response.status, body);
  return asObject(body);
}

async function getAccessToken(forceRefresh = false): Promise<string> {
  const now = Date.now();
  if (!forceRefresh && tokenCache && tokenCache.expiresAt > now + 60_000) {
    return tokenCache.token;
  }
  const config = requireConfig();
  const response = await fetch(`${config.baseUrl}/v2/stores/companies/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": config.merchantName,
    },
    body: JSON.stringify({
      username: config.username,
      password: config.password,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const data = await parseResponse(response);
  const token = asString(data.access_token);
  if (!token) throw new Error("MODO devolvió una autenticación sin token.");
  const expiresIn = Math.max(60, asNumber(data.expires_in) ?? 604_800);
  tokenCache = { token, expiresAt: now + expiresIn * 1000 };
  return token;
}

async function modoRequest(path: string, init: RequestInit = {}) {
  const config = requireConfig();
  let token = await getAccessToken();
  const execute = () =>
    fetch(`${config.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": config.merchantName,
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

  let response = await execute();
  if (response.status === 401) {
    tokenCache = null;
    token = await getAccessToken(true);
    response = await execute();
  }
  return parseResponse(response);
}

function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let remaining = days;
  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + 1);
    if (result.getUTCDay() !== 0 && result.getUTCDay() !== 6) remaining -= 1;
  }
  return result;
}

function releaseDateFor(type: string | null, paidAt: string | null) {
  if (!paidAt) return null;
  const days =
    type?.toUpperCase() === "DEBIT"
      ? env.PAYWAY_DEBIT_RELEASE_BUSINESS_DAYS
      : env.PAYWAY_CREDIT_RELEASE_BUSINESS_DAYS;
  if (days === undefined) return null;
  const date = new Date(paidAt);
  return Number.isNaN(date.getTime())
    ? null
    : addBusinessDays(date, days).toISOString();
}

function toPaymentResult(data: JsonObject): ProviderPaymentResult {
  const id = asString(data.id);
  if (!id) throw new Error("MODO devolvió un pago sin identificador.");
  const transaction = asObject(data.transaction_data);
  const method = asObject(transaction.payment_method_detail);
  const installments = asObject(transaction.installments);
  const providerStatus = (asString(data.status) ?? "CREATED").toUpperCase();
  const amountInPesos =
    asNumber(transaction.amount) ?? asNumber(data.amount) ?? 0;
  const paymentType = asString(method.type);
  const transactions = asArray(data.transactions);
  const refundedInPesos = transactions.reduce((sum: number, item) => {
    const row = asObject(item);
    const status = (asString(row.status) ?? "").toUpperCase();
    return status.includes("REFUND") ? sum + (asNumber(row.amount) ?? 0) : sum;
  }, 0);
  const normalizedStatus =
    providerStatus === "ACCEPTED"
      ? "APPROVED"
      : providerStatus === "REJECTED"
        ? "REJECTED"
        : providerStatus === "REFUNDED"
          ? "REFUNDED"
          : providerStatus === "PARTIAL_REFUND"
            ? "PARTIALLY_REFUNDED"
            : providerStatus === "PROCESSING" || providerStatus === "SCANNED"
              ? "PROCESSING"
              : "PENDING";

  return {
    providerPaymentId: id,
    providerStatus,
    normalizedStatus,
    amountInCents: Math.round(amountInPesos * 100),
    currency: (asString(data.currency) ?? "ARS").toUpperCase(),
    externalReference: asString(data.external_intention_id),
    paymentMethodType:
      paymentType?.toUpperCase() === "CREDIT"
        ? "credit_card"
        : paymentType?.toUpperCase() === "DEBIT"
          ? "debit_card"
          : paymentType?.toLowerCase() ?? null,
    paymentMethodId: asString(method.issuer_name),
    installments: asNumber(installments.real_quantity),
    moneyReleaseDate: releaseDateFor(
      paymentType,
      asString(transaction.paid_at),
    ),
    moneyReleased: false,
    amountRefundedInCents: Math.round(refundedInPesos * 100),
  };
}

function fromBase64Url(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

function jsonEqual(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length &&
      left.every((item, i) => jsonEqual(item, right[i]))
    );
  }
  if (left && right && typeof left === "object" && typeof right === "object") {
    const a = left as JsonObject;
    const b = right as JsonObject;
    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();
    return (
      jsonEqual(keysA, keysB) && keysA.every((key) => jsonEqual(a[key], b[key]))
    );
  }
  return false;
}

async function getJwks(): Promise<ModoJwk[]> {
  if (jwksCache && jwksCache.expiresAt > Date.now()) return jwksCache.keys;
  const config = requireConfig();
  const response = await fetch(
    `${config.baseUrl}/v2/payment-requests/.well-known/jwks.json`,
    { cache: "no-store", signal: AbortSignal.timeout(10_000) },
  );
  const data = await parseResponse(response);
  const keys = Array.isArray(data.keys) ? (data.keys as ModoJwk[]) : [];
  if (keys.length === 0)
    throw new Error("MODO no devolvió claves públicas de firma.");
  jwksCache = { keys, expiresAt: Date.now() + 6 * 60 * 60_000 };
  return keys;
}

async function verifyModoWebhook(
  rawBody: string,
): Promise<VerifiedWebhook | null> {
  let body: JsonObject;
  try {
    body = asObject(JSON.parse(rawBody));
  } catch {
    return null;
  }
  const signature = asObject(body.signature);
  const protectedValue = asString(signature.protected);
  const signatureValue = asString(signature.signature);
  const payloadValue = asString(signature.payload);
  if (!protectedValue || !signatureValue || !payloadValue) return null;

  let header: JsonObject;
  let signedPayload: JsonObject;
  try {
    header = asObject(
      JSON.parse(fromBase64Url(protectedValue).toString("utf8")),
    );
    signedPayload = asObject(
      JSON.parse(fromBase64Url(payloadValue).toString("utf8")),
    );
  } catch {
    return null;
  }
  const alg = asString(header.alg);
  const kid = asString(header.kid);
  const algorithm =
    alg === "RS256"
      ? "RSA-SHA256"
      : alg === "RS384"
        ? "RSA-SHA384"
        : alg === "RS512"
          ? "RSA-SHA512"
          : null;
  if (!algorithm || !kid) return null;
  const key = (await getJwks()).find((candidate) => candidate.kid === kid);
  if (!key) return null;
  if (key.kty !== "RSA") return null;
  const valid = verify(
    algorithm,
    Buffer.from(`${protectedValue}.${payloadValue}`),
    createPublicKey({ key, format: "jwk" }),
    fromBase64Url(signatureValue),
  );
  if (!valid) return null;
  const unsignedBody = { ...body };
  delete unsignedBody.signature;
  if (!jsonEqual(unsignedBody, signedPayload)) return null;

  const providerPaymentId =
    asString(signedPayload.id) ?? asString(signedPayload.payment_request_id);
  const status = asString(signedPayload.status) ?? "unknown";
  if (!providerPaymentId) return null;
  return {
    providerEventId: createHash("sha256")
      .update(`${providerPaymentId}:${status}:${signatureValue}`)
      .digest("hex"),
    eventType: status,
    providerPaymentId,
    externalReference: asString(signedPayload.external_intention_id),
  };
}

export const modoGateway: PaymentGateway = {
  isConfigured() {
    return Boolean(
      env.MODO_USERNAME &&
      env.MODO_PASSWORD &&
      env.MODO_PROCESSOR_CODE &&
      env.MODO_CC_CODE &&
      env.MODO_MERCHANT_NAME,
    );
  },

  async createCheckoutSession(input: CreateCheckoutSessionInput) {
    const config = requireConfig();
    const data = await modoRequest("/v2/payment-requests/", {
      method: "POST",
      body: JSON.stringify({
        description: input.description.slice(0, 100),
        amount: input.amountInCents / 100,
        currency: input.currency,
        cc_code: config.ccCode,
        processor_code: config.processorCode,
        external_intention_id: input.paymentId,
        webhook_notification: `${env.APP_URL}/api/webhooks/modo`,
      }),
    });
    const id = asString(data.id);
    const deeplink = asString(data.deeplink);
    if (!id || !deeplink)
      throw new Error("MODO no devolvió una solicitud de pago utilizable.");
    return {
      providerPreferenceId: id,
      providerPaymentId: id,
      checkoutUrl: deeplink,
    };
  },

  async getPayment(providerPaymentId: string) {
    return toPaymentResult(
      await modoRequest(
        `/v2/payment-requests/${encodeURIComponent(providerPaymentId)}/data`,
      ),
    );
  },

  payWithCard(_input: PayWithCardInput): Promise<ProviderPaymentResult> {
    return Promise.reject(
      new Error("MODO no procesa tarjetas ingresadas en la tienda."),
    );
  },

  async findByExternalReference(_externalReference: string) {
    return null;
  },

  async refundPayment(input): Promise<ProviderRefundResult> {
    const payment = await this.getPayment(input.providerPaymentId);
    const remaining = Math.max(
      0,
      payment.amountInCents - (payment.amountRefundedInCents ?? 0),
    );
    const full = input.amountInCents >= remaining;
    const data = await modoRequest(
      `/v2/payment-requests/${encodeURIComponent(input.providerPaymentId)}/refund`,
      {
        method: "POST",
        headers: { "X-Idempotency-Key": input.idempotencyKey },
        body: JSON.stringify(full ? {} : { amount: input.amountInCents / 100 }),
      },
    );
    const refundId =
      asString(data.reference_transaction_token) ??
      createHash("sha256")
        .update(`${input.providerPaymentId}:${input.idempotencyKey}`)
        .digest("hex");
    return {
      providerRefundId: refundId,
      providerStatus: asString(data.status) ?? "unknown",
      amountInCents: Math.round(
        (asNumber(data.amount) ?? input.amountInCents / 100) * 100,
      ),
      createdAt: null,
    };
  },

  async verifyWebhook(input: VerifyWebhookInput) {
    return verifyModoWebhook(input.rawBody);
  },
};
