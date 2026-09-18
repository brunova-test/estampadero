import type { ClubBalanceDto, CommissionEntryDto } from "../dto/commission";

export interface CreateCommissionEntryInput {
  clubId: string;
  agreementId: string;
  orderId: string;
  orderItemId: string;
  orderNumber: number;
  productName: string;
  baseAmountInCents: number;
  percentageApplied: number;
  amountInCents: number;
  paymentId: string | null;
  status:
    | "PENDING_RELEASE"
    | "PENDING_DELIVERY"
    | "RETURN_WINDOW"
    | "AVAILABLE"
    | "SETTLED";
  releasedAt: Date | null;
  returnWindowEndsAt: Date | null;
  availableAt: Date | null;
}

export interface CommissionsRepository {
  /** Idempotent: no-ops if an entry for this orderItemId already exists. */
  createEntryIfNotExists(input: CreateCommissionEntryInput): Promise<void>;
  listByClub(clubId: string): Promise<CommissionEntryDto[]>;
  getClubBalance(clubId: string): Promise<ClubBalanceDto>;
}
