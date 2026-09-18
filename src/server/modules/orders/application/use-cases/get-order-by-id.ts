import "server-only";

import type { OrderDetailDto } from "../dto/order-detail";
import type { OrdersRepository } from "../ports/orders-repository";

export function getOrderById(repository: OrdersRepository) {
  return (id: string): Promise<OrderDetailDto | null> =>
    repository.getOrderById(id);
}
