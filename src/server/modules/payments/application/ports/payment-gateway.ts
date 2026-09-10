export interface CreateCheckoutSessionInput {
  paymentId: string;
  orderId: string;
  orderNumber: number;
  amountInCents: number;
  currency: string;
  payerEmail: string;
  payerName?: string;
  payerIdentification?: string;
  payerPhone?: string;
  description: string;
  items?: Array<{
    description: string;
    quantity: number;
    totalInCents: number;
    imageUrl?: string | null;
  }>;
  split?: Array<{
    entity: string;
    totalInCents: number;
    feeInCents: number;
    reference: string;
    description: string;
  }>;
}

export interface CreateCheckoutSessionResult {
  providerPreferenceId: string;
  /** Some providers (MODO) use the payment-request id as both identifiers. */
  providerPaymentId?: string;
  checkoutUrl: string;
}

export interface ProviderPaymentResult {
  providerPaymentId: string;
  providerStatus: string;
  normalizedStatus:
    | "PENDING"
    | "PROCESSING"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED"
    | "REFUNDED"
    | "PARTIALLY_REFUNDED";
  amountInCents: number;
  currency: string;
  externalReference: string | null;
  paymentMethodType?: string | null;
  paymentMethodId?: string | null;
  installments?: number | null;
  moneyReleaseDate?: string | null;
  moneyReleased?: boolean;
  netReceivedInCents?: number | null;
  feeInCents?: number | null;
  financingFeeInCents?: number | null;
  amountRefundedInCents?: number;
  /** Most recent refund id when the provider exposes it in payment detail. */
  latestProviderRefundId?: string | null;
}

export interface ProviderRefundResult {
  providerRefundId: string;
  providerStatus: string;
  amountInCents: number;
  createdAt: string | null;
}

export interface PayWithCardInput {
  paymentId: string;
  amountInCents: number;
  currency: string;
  cardToken: string;
  bin: string;
  paymentMethodId: string;
  issuerId: string | null;
  installments: number;
  payerEmail: string;
  payerDocType: string | null;
  payerDocNumber: string | null;
  description: string;
}

export interface VerifyWebhookInput {
  rawBody: string;
  headers: Record<string, string | undefined>;
  searchParams: URLSearchParams;
}

export interface VerifiedWebhook {
  providerEventId: string;
  eventType: string;
  providerPaymentId: string | null;
  externalReference?: string | null;
}

/**
 * Port implemented by each payment provider adapter.
 * Application code and routers depend only on this interface — SDK details
 * live in infrastructure/providers.
 */
export interface PaymentGateway {
  isConfigured(): boolean;
  /** True only when retrying cannot duplicate a provider-side operation. */
  isDefinitiveFailure?(error: unknown): boolean;
  createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<CreateCheckoutSessionResult>;
  getPayment(providerPaymentId: string): Promise<ProviderPaymentResult>;
  payWithCard(input: PayWithCardInput): Promise<ProviderPaymentResult>;
  verifyWebhook(
    input: VerifyWebhookInput,
  ): VerifiedWebhook | null | Promise<VerifiedWebhook | null>;
  /**
   * Looks up a payment by the external reference we set at checkout-session
   * creation (our internal paymentId). Used by reconciliation to find a
   * Checkout Pro payment that never triggered a webhook — those payments
   * have no providerPaymentId locally until we learn it this way. Returns
   * null if the provider has no matching payment yet (still unpaid).
   */
  findByExternalReference(
    externalReference: string,
  ): Promise<ProviderPaymentResult | null>;
  refundPayment?(input: {
    providerPaymentId: string;
    amountInCents: number;
    idempotencyKey: string;
  }): Promise<ProviderRefundResult>;
  /**
   * Voids a refund that was already created (Payway certification step
   * "Anulación de devolución total/parcial") — a distinct operation from
   * refundPayment, targeting the specific refund by its own provider id.
   */
  voidRefund?(input: {
    providerPaymentId: string;
    providerRefundId: string;
    amountInCents: number;
  }): Promise<void>;
}
