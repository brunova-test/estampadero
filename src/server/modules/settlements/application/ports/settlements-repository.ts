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
  /**
   * Selects the club's unassigned ACCRUED commission entries, creates a
   * Settlement covering them, and reserves those entries (settlementId) in
   * the same transaction so they cannot be picked up by another generation
   * run. Returns null if there is nothing to settle.
   */
  generateSettlement(
    clubId: string,
    periodLabel: string,
    periodStart: Date,
    periodEnd: Date,
    cutoffExclusive: Date,
    createdByUserId: string,
    commissionEntryId?: string,
  ): Promise<SettlementDetailDto | null>;
  /** Creates one settlement per AVAILABLE commission entry for automatic payouts. */
  generateAutomaticSettlements?(
    createdByUserId: string,
    now: Date,
  ): Promise<SettlementDetailDto[]>;
  /**
   * Marks a PENDING_PAYMENT settlement as PAID and its reserved entries as
   * SETTLED, atomically. Returns false if it was already paid/cancelled
   * (idempotent no-op) — a paid settlement is never silently re-processed.
   */
  markPaid(input: {
    settlementId: string;
    receiptUrl: string;
    confirmedByUserId: string;
  }): Promise<boolean>;
}
