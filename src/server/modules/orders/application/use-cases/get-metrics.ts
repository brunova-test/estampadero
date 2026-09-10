import "server-only";

import type { OrderMetricsDto } from "../dto/order-summary";
import type { OrdersRepository } from "../ports/orders-repository";

export function getMetrics(repository: OrdersRepository) {
  return (
    period: "day" | "week" | "month" | "year",
  ): Promise<OrderMetricsDto> => repository.getMetrics(period);
}
