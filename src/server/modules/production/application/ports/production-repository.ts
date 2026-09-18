import type {
  BatchDetailDto,
  BatchSummaryDto,
  CreateManualProductionItemInput,
  ProductionHistoryEntryDto,
  ProductionOrderGroupDto,
  RemovedProductionOrderDto,
} from "../dto/batch";

export interface ProductionRepository {
  getOpenBatch(): Promise<BatchDetailDto>;
  getBatchById(id: string): Promise<BatchDetailDto | null>;
  listBatches(): Promise<BatchSummaryDto[]>;
  setPeriodDays(batchId: string, periodDays: number): Promise<void>;
  /** Assigns a just-paid order to the current open batch (creating one if needed). */
  assignOrderToOpenBatch(orderId: string): Promise<void>;
  /**
   * Closes a batch, bulk-transitions its still-PAID orders to
   * IN_PRODUCTION, and opens a new batch for subsequent orders. Returns
   * false if the batch was already closed (idempotent no-op).
   */
  closeBatch(batchId: string): Promise<boolean>;
  listProductionOrders(): Promise<ProductionOrderGroupDto[]>;
  listProductionHistory(): Promise<ProductionHistoryEntryDto[]>;
  sendItems(itemIds: string[], delayDays: number): Promise<string[]>;
  markItemsReady(itemIds: string[]): Promise<string[]>;
  markItemsShipped(itemIds: string[]): Promise<string[]>;
  listRemovedOrders(): Promise<RemovedProductionOrderDto[]>;
  removeOrderFromProduction(orderId: string): Promise<boolean>;
  restoreOrderToProduction(orderId: string): Promise<boolean>;
  createManualItem(input: CreateManualProductionItemInput): Promise<void>;
}
