export interface BatchOrderDto {
  id: string;
  orderNumber: number;
  contactName: string;
  clubName: string | null;
  unitCount: number;
  status: string;
}

export interface BatchSummaryDto {
  id: string;
  batchNumber: number;
  periodDays: number;
  status: string;
  orderCount: number;
  unitCount: number;
  totalPendingInCents: number;
  createdAt: string;
  closedAt: string | null;
}

export interface BatchDetailDto extends BatchSummaryDto {
  orders: BatchOrderDto[];
}

export type ProductionItemStatusDto =
  "WAITING" | "SCHEDULED" | "IN_PRODUCTION" | "READY" | "SHIPPED" | "DELIVERED";

export interface ProductionItemDto {
  id: string;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  size: string;
  color: string;
  quantity: number;
  notes: string | null;
  status: ProductionItemStatusDto;
  scheduledAt: string | null;
  startedAt: string | null;
  readyAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  club: {
    id: string;
    name: string;
    logoUrl: string | null;
  } | null;
}

export interface ProductionOrderGroupDto {
  orderId: string;
  orderNumber: number | null;
  isManual: boolean;
  contactName: string;
  contactEmail: string | null;
  paidAt: string;
  paymentStatus: string | null;
  batchNumber: number | null;
  items: ProductionItemDto[];
}

export interface ProductionHistoryEntryDto extends ProductionOrderGroupDto {
  historyStatus: "SHIPPED" | "REMOVED";
  historyAt: string;
}

export interface RemovedProductionOrderDto {
  orderId: string;
  orderNumber: number;
  contactName: string;
  contactEmail: string;
  removedAt: string;
  itemCount: number;
  unitCount: number;
}

export interface CreateManualProductionItemInput {
  productName: string;
  size: string;
  color: string;
  quantity: number;
  notes?: string;
}
