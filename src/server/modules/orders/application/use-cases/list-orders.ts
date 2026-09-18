import "server-only";

import type { OrderSummaryDto } from "../dto/order-summary";
import type {
  OrdersRepository,
  OrderStatusValue,
} from "../ports/orders-repository";

export function listOrders(repository: OrdersRepository) {
  return (filters: {
    status?: OrderStatusValue;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    paymentCategory?: "ACTIVE" | "REJECTED";
  }): Promise<OrderSummaryDto[]> => repository.listOrders(filters);
}
