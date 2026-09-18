export interface SettlementItemDto {
  id: string;
  orderNumber: number;
  productName: string;
  quantity: number;
  percentageApplied: number;
  amountInCents: number;
}

export interface SettlementSummaryDto {
  id: string;
  clubId: string;
  clubName: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalInCents: number;
  createdAt: string;
  paidAt: string | null;
  receiptUrl: string | null;
  transferProvider?: string | null;
  transferId?: string | null;
  transferStatus?: string | null;
}

export interface SettlementDetailDto extends SettlementSummaryDto {
  payoutCbu: string | null;
  items: SettlementItemDto[];
  events: {
    id: string;
    action: string;
    summary: string;
    changedByUserId: string | null;
    createdAt: string;
  }[];
}

export interface SettlementGenerationResultDto {
  created: SettlementSummaryDto[];
  skipped: { clubId: string; clubName: string; reason: string }[];
}

export interface SettlementMovementDto {
  id: string;
  clubId: string;
  clubName: string;
  orderNumber: number;
  contactName: string;
  contactEmail: string;
  customerDocument: string | null;
  productName: string;
  amountInCents: number;
  percentageApplied: number;
  status: string;
  entryType: string;
  createdAt: string;
}
