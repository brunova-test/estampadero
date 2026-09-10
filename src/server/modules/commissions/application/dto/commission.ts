export interface CommissionEntryDto {
  id: string;
  orderId: string;
  orderNumber: number;
  productName: string;
  baseAmountInCents: number;
  percentageApplied: number;
  amountInCents: number;
  status: string;
  entryType: string;
  releasedAt: string | null;
  returnWindowEndsAt: string | null;
  availableAt: string | null;
  paymentMethodType: string | null;
  paymentMethodId: string | null;
  installments: number | null;
  moneyReleaseDate: string | null;
  createdAt: string;
}

export interface ClubBalanceDto {
  salesInCents: number;
  accruedInCents: number;
  pendingReleaseInCents: number;
  pendingDeliveryInCents: number;
  returnWindowInCents: number;
  availableInCents: number;
  settledInCents: number;
}
