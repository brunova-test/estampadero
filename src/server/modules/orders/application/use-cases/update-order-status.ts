import "server-only";

import type { OrderDetailDto } from "../dto/order-detail";
import type { OrdersRepository, OrderStatusValue } from "../ports/orders-repository";

export function updateOrderStatus(repository: OrdersRepository) {
  return (
    id: string,
    status: OrderStatusValue,
    note: string | null,
  ): Promise<OrderDetailDto> => repository.updateOrderStatus(id, status, note);
}
