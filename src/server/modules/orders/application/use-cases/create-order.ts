import "server-only";

import type { OrderDetailDto } from "../dto/order-detail";
import type {
  CreateOrderInput,
  OrdersRepository,
} from "../ports/orders-repository";

export function createOrder(repository: OrdersRepository) {
  return (input: CreateOrderInput): Promise<OrderDetailDto> =>
    repository.createOrder(input);
}
