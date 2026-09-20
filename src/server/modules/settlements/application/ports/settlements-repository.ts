import type {
  SettlementDetailDto,
  SettlementSummaryDto,
} from "../dto/settlement";

export type SettlementStatusValue = "PENDING_PAYMENT" | "PAID" | "CANCELLED";
export type SettlementFrequencyValue = "AUTOMATIC" | "BIWEEKLY" | "MONTHLY";

export interface SettlementConfiguration {
  clubId: string;
  clubName: string;
  payoutCbu: string | null;
  frequency: SettlementFrequencyValue;
}

export interface SettlementsRepository {
  listSettlements(filters: {
    clubId?: string;
    status?: SettlementStatusValue;
  }): Promise<SettlementSummaryDto[]>;
  listMovements?(filters: {
    search?: string;
    from?: Date;
    to?: Date;
    hourFrom?: number;
    hourTo?: number;
  }): Promise<import("../dto/settlement").SettlementMovementDto[]>;
  getById(id: string): Promise<SettlementDetailDto | null>;
  listSettlementConfigurations(): Promise<SettlementConfiguration[]>;






  generateSettlement(
    clubId: string,
    periodLabel: string,
    periodStart: Date,
    periodEnd: Date,
    cutoffExclusive: Date,
    createdByUserId: string,
    commissionEntryId?: string,
  ): Promise<SettlementDetailDto | null>;

  generateAutomaticSettlements?(
    createdByUserId: string,
    now: Date,
  ): Promise<SettlementDetailDto[]>;





  markPaid(input: {
    settlementId: string;
    receiptUrl: string;
    confirmedByUserId: string;
  }): Promise<boolean>;
}
