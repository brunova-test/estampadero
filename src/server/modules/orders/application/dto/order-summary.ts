export interface OrderSummaryDto {
  id: string;
  orderNumber: number;
  status: string;
  contactName: string;
  contactEmail: string;
  totalInCents: number;
  itemCount: number;
  imageUrls: string[];
  createdAt: string;
  paymentStatus: string | null;
}

export interface OrderMetricsDto {
  period: "day" | "week" | "month" | "year";
  periodLabel: string;
  totalOrders: number;
  pendingPaymentOrders: number;
  paidOrders: number;
  inProductionOrders: number;
  readyOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  revenueInCents: number;
  averageTicketInCents: number;
  pendingCommissionsInCents: number;
  activeAgreementCount: number;
  revenueChangePercentage: number | null;
  ordersChangePercentage: number | null;
  averageTicketChangePercentage: number | null;
  salesSeries: { label: string; amountInCents: number; orderCount: number }[];
  attention: {
    pendingDesigns: number;
    outOfStockProducts: number;
    expiringAgreements: number;
    newSpecialRequests: number;
  };
}
