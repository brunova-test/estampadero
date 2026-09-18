import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import type { PaymentSearchResult } from "mercadopago/dist/clients/payment/search/types";
import {
  MercadoPagoConfig,
  Payment as MpPayment,
  PaymentRefund,
  Preference,
} from "mercadopago";

import { env } from "elestampadero/env";

import type {
  CreateCheckoutSessionInput,
  CreateCheckoutSessionResult,
  PaymentGateway,
  PayWithCardInput,
  ProviderPaymentResult,
  VerifiedWebhook,
  VerifyWebhookInput,
} from "../../application/ports/payment-gateway";

function requireAccessToken(): string {
  if (!env.MERCADOPAGO_ACCESS_TOKEN) {
    throw new Error(
      "MERCADOPAGO_ACCESS_TOKEN is not configured. Set it in your environment to enable Mercado Pago payments.",
    );
  }
  return env.MERCADOPAGO_ACCESS_TOKEN;
}

function getClient(): MercadoPagoConfig {
  return new MercadoPagoConfig({ accessToken: requireAccessToken() });
}

const MP_STATUS_MAP: Record<string, ProviderPaymentResult["normalizedStatus"]> =
  {
    pending: "PENDING",
    in_process: "PROCESSING",
    in_mediation: "PROCESSING",
    approved: "APPROVED",
    rejected: "REJECTED",
    cancelled: "CANCELLED",
    refunded: "REFUNDED",
    charged_back: "REFUNDED",
  };

function toCents(value: number | undefined): number | null {
  return typeof value === "number" ? Math.round(value * 100) : null;
}

function toProviderPaymentResult(result: {
  id?: number | string;
  status?: string;
  transaction_amount?: number;
  currency_id?: string;
  external_reference?: string;
  payment_type_id?: string;
  payment_method_id?: string;
  installments?: number;
  money_release_date?: string;
  money_release_status?: string;
  transaction_amount_refunded?: number;
  transaction_details?: { net_received_amount?: number };
  fee_details?: Array<{ type?: string; amount?: number }>;
}): ProviderPaymentResult {
  const providerStatus = result.status ?? "unknown";
  const amountInCents = Math.round((result.transaction_amount ?? 0) * 100);
  const amountRefundedInCents = Math.round(
    (result.transaction_amount_refunded ?? 0) * 100,
  );
  const normalizedStatus =
    amountRefundedInCents >= amountInCents && amountInCents > 0
      ? "REFUNDED"
      : amountRefundedInCents > 0
        ? "PARTIALLY_REFUNDED"
        : (MP_STATUS_MAP[providerStatus] ?? "PENDING");
  const feeInCents = toCents(
    result.fee_details?.reduce((sum, fee) => sum + (fee.amount ?? 0), 0),
  );
  const financingFeeInCents = toCents(
    result.fee_details
      ?.filter((fee) => fee.type === "financing_fee")
      .reduce((sum, fee) => sum + (fee.amount ?? 0), 0),
  );

  return {
    providerPaymentId: String(result.id),
    providerStatus,
    normalizedStatus,
    amountInCents,
    currency: result.currency_id ?? "ARS",
    externalReference: result.external_reference ?? null,
    paymentMethodType: result.payment_type_id ?? null,
    paymentMethodId: result.payment_method_id ?? null,
    installments: result.installments ?? null,
    moneyReleaseDate: result.money_release_date ?? null,
    moneyReleased: result.money_release_status === "released",
    netReceivedInCents: toCents(
      result.transaction_details?.net_received_amount,
    ),
    feeInCents,
    financingFeeInCents,
    amountRefundedInCents,
  };
}

export const mercadoPagoGateway: PaymentGateway = {
  isConfigured(): boolean {
    return Boolean(env.MERCADOPAGO_ACCESS_TOKEN);
  },

  async createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<CreateCheckoutSessionResult> {
    const preference = new Preference(getClient());
    const expirationFrom = new Date();
    const expirationTo = new Date(
      expirationFrom.getTime() +
        env.UNPAID_ORDER_EXPIRATION_HOURS * 60 * 60_000,
    );

    const result = await preference.create({
      body: {
        items: [
          {
            id: input.orderId,
            title: input.description,
            quantity: 1,
            unit_price: input.amountInCents / 100,
            currency_id: input.currency,
          },
        ],
        payer: { email: input.payerEmail },
        external_reference: input.paymentId,
        notification_url: `${env.APP_URL}/api/webhooks/mercado-pago`,
        back_urls: {
          success: `${env.APP_URL}/pedido/${input.orderId}?pago=exito`,
          pending: `${env.APP_URL}/pedido/${input.orderId}?pago=pendiente`,
          failure: `${env.APP_URL}/pedido/${input.orderId}?pago=error`,
        },
        auto_return: "approved",
        expires: true,
        expiration_date_from: expirationFrom.toISOString(),
        expiration_date_to: expirationTo.toISOString(),
        statement_descriptor: "EL ESTAMPADERO",
      },
    });

    if (!result.id || !result.init_point) {
      throw new Error("Mercado Pago did not return a usable preference.");
    }

    return {
      providerPreferenceId: result.id,
      checkoutUrl: result.init_point,
    };
  },

  async getPayment(providerPaymentId: string): Promise<ProviderPaymentResult> {
    const paymentClient = new MpPayment(getClient());
    const result = await paymentClient.get({ id: providerPaymentId });

    return toProviderPaymentResult(result);
  },

  async payWithCard(input: PayWithCardInput): Promise<ProviderPaymentResult> {
    const paymentClient = new MpPayment(getClient());

    const result = await paymentClient.create({
      body: {
        transaction_amount: input.amountInCents / 100,
        token: input.cardToken,
        description: input.description,
        installments: input.installments,
        payment_method_id: input.paymentMethodId,
        issuer_id: input.issuerId ? Number(input.issuerId) : undefined,
        external_reference: input.paymentId,
        payer: {
          email: input.payerEmail,
          identification:
            input.payerDocType && input.payerDocNumber
              ? { type: input.payerDocType, number: input.payerDocNumber }
              : undefined,
        },
      },
      requestOptions: { idempotencyKey: input.paymentId },
    });

    if (!result.id) {
      throw new Error("Mercado Pago did not return a payment id.");
    }

    return toProviderPaymentResult(result);
  },

  async findByExternalReference(
    externalReference: string,
  ): Promise<ProviderPaymentResult | null> {
    const paymentClient = new MpPayment(getClient());
    const { results } = await paymentClient.search({
      options: {
        external_reference: externalReference,
        sort: "date_created",
        criteria: "desc",
        limit: 1,
      },
    });

    const result: PaymentSearchResult | undefined = results?.[0];
    if (!result?.id) return null;

    return toProviderPaymentResult(result);
  },

  async refundPayment(input) {
    const refunds = new PaymentRefund(getClient());
    const result = await refunds.create({
      payment_id: input.providerPaymentId,
      body: { amount: input.amountInCents / 100 },
      requestOptions: { idempotencyKey: input.idempotencyKey },
    });
    if (!result.id) {
      throw new Error(
        "Mercado Pago no devolvió un identificador de reembolso.",
      );
    }
    return {
      providerRefundId: String(result.id),
      providerStatus: result.status ?? "unknown",
      amountInCents: Math.round((result.amount ?? 0) * 100),
      createdAt: result.date_created ?? null,
    };
  },

  async verifyWebhook(
    input: VerifyWebhookInput,
  ): Promise<VerifiedWebhook | null> {
    const signatureHeader = input.headers["x-signature"];
    const requestId = input.headers["x-request-id"];
    const dataId =
      input.searchParams.get("data.id") ?? input.searchParams.get("id");

    if (!signatureHeader || !requestId || !dataId) return null;
    if (!env.MERCADOPAGO_WEBHOOK_SECRET) return null;

    const signatureParts = Object.fromEntries(
      signatureHeader
        .split(",")
        .map((part) => part.trim().split("=") as [string, string | undefined]),
    );
    const ts = signatureParts.ts;
    const v1 = signatureParts.v1;
    if (!ts || !v1) return null;

    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const expected = createHmac("sha256", env.MERCADOPAGO_WEBHOOK_SECRET)
      .update(manifest)
      .digest("hex");

    const expectedBuffer = Buffer.from(expected, "hex");
    const receivedBuffer = Buffer.from(v1, "hex");
    const isValid =
      expectedBuffer.length === receivedBuffer.length &&
      timingSafeEqual(expectedBuffer, receivedBuffer);

    if (!isValid) return null;

    return {
      providerEventId: `${dataId}:${ts}`,
      eventType: "payment",
      providerPaymentId: dataId,
    };
  },
};
