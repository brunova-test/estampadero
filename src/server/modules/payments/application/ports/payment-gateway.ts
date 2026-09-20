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






export interface PaymentGateway {
  isConfigured(): boolean;

  isDefinitiveFailure?(error: unknown): boolean;
  createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<CreateCheckoutSessionResult>;
  getPayment(providerPaymentId: string): Promise<ProviderPaymentResult>;
  payWithCard(input: PayWithCardInput): Promise<ProviderPaymentResult>;
  verifyWebhook(
    input: VerifyWebhookInput,
  ): VerifiedWebhook | null | Promise<VerifiedWebhook | null>;







  findByExternalReference(
    externalReference: string,
  ): Promise<ProviderPaymentResult | null>;
  refundPayment?(input: {
    providerPaymentId: string;
    amountInCents: number;
    idempotencyKey: string;
  }): Promise<ProviderRefundResult>;





  voidRefund?(input: {
    providerPaymentId: string;
    providerRefundId: string;
    amountInCents: number;
  }): Promise<void>;
}
