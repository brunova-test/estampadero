export type PaymentStatusValue =
  | "CREATED"
  | "PENDING"
  | "PROCESSING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED";

export type PaymentChannelValue =
  "MP_WALLET" | "CARD" | "MODO" | "MOBBEX_CHECKOUT";
export type PaymentProviderValue =
  "MERCADO_PAGO" | "PAYWAY" | "MODO" | "MOBBEX";
export type PaymentProcessorValue = "MERCADO_PAGO" | "PAYWAY" | "MOBBEX";

export interface PaymentRecord {
  id: string;
  orderId: string;
  channel: PaymentChannelValue;
  provider: PaymentProviderValue;
  processor: PaymentProcessorValue;
  providerPreferenceId: string | null;
  providerPaymentId: string | null;
  amountInCents: number;
  currency: string;
  status: PaymentStatusValue;
  idempotencyKey: string;
  moneyReleasedAt?: Date | null;
  amountRefundedInCents?: number;
  lastProviderRefundId?: string | null;
  lastRefundAmountInCents?: number | null;
  paymentMethodId?: string | null;
}

export interface CreatePaymentInput {
  orderId: string;
  channel: PaymentChannelValue;
  provider: PaymentProviderValue;
  processor: PaymentProcessorValue;
  amountInCents: number;
  currency: string;
  idempotencyKey: string;
}

export interface CreatePaymentResult {
  payment: PaymentRecord;
  created: boolean;
}

export interface PaymentsRepository {
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  setPreferenceId(
    paymentId: string,
    providerPreferenceId: string,
  ): Promise<void>;
  setProviderPaymentId?(
    paymentId: string,
    providerPaymentId: string,
  ): Promise<void>;
  findById(paymentId: string): Promise<PaymentRecord | null>;
  findByOrderId(orderId: string): Promise<PaymentRecord[]>;
  findByProviderPaymentId(
    provider: PaymentProviderValue,
    providerPaymentId: string,
  ): Promise<PaymentRecord | null>;
  findByPreferenceId(
    providerPreferenceId: string,
  ): Promise<PaymentRecord | null>;






  recordWebhookEventOnce(input: {
    provider: PaymentProviderValue;
    providerEventId: string;
    eventType: string;
  }): Promise<boolean>;

  syncProviderDetails?(input: {
    paymentId: string;
    providerPaymentId: string;
    providerStatus: string;
    paymentMethodType: string | null;
    paymentMethodId: string | null;
    installments: number | null;
    moneyReleaseDate: string | null;
    moneyReleased: boolean;
    netReceivedInCents: number | null;
    feeInCents: number | null;
    financingFeeInCents: number | null;
    amountRefundedInCents?: number;
  }): Promise<void>;






  markApprovedAndPayOrder(input: {
    paymentId: string;
    providerPaymentId: string;
    providerStatus: string;
  }): Promise<boolean>;

  markStatus(input: {
    paymentId: string;
    providerPaymentId: string;
    status: PaymentStatusValue;
    providerStatus: string;
  }): Promise<void>;
  markAttemptFailed?(paymentId: string, providerStatus: string): Promise<void>;









  recordRefund?(input: {
    paymentId: string;
    amountRefundedInCents: number;
    status: Extract<PaymentStatusValue, "PARTIALLY_REFUNDED" | "REFUNDED">;
    providerRefundId: string;
    lastRefundAmountInCents: number;
  }): Promise<void>;







  recordRefundVoided?(input: {
    paymentId: string;
    amountRefundedInCents: number;
    status: Extract<PaymentStatusValue, "APPROVED" | "PARTIALLY_REFUNDED">;
  }): Promise<void>;
  setRefundReference?(input: {
    paymentId: string;
    providerRefundId: string;
    lastRefundAmountInCents: number;
  }): Promise<void>;








  findStaleNonTerminalPayments(input: {
    provider?: PaymentProviderValue;
    olderThan: Date;
    newerThan: Date;
    limit: number;
  }): Promise<PaymentRecord[]>;
  findPaymentsAwaitingRelease?(input: {
    provider?: PaymentProviderValue;
    newerThan: Date;
    limit: number;
  }): Promise<PaymentRecord[]>;
}
