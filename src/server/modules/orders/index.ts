import { createOrder } from "./application/use-cases/create-order";
import { expireUnpaidOrders } from "./application/use-cases/expire-unpaid-orders";
import { getOrderById } from "./application/use-cases/get-order-by-id";
import { prismaOrdersRepository } from "./infrastructure/persistence/prisma-orders-repository";

export { ordersRouter } from "./presentation/router";
export type {
  OrderDetailDto,
  OrderItemDto,
} from "./application/dto/order-detail";
export type {
  CreateOrderInput,
  CreateOrderItemInput,
  CreateExternalOrderInput,
} from "./application/ports/orders-repository";

/**
 * Public use cases for other modules (checkout, payments) to read/persist
 * orders. Bound to the Prisma repository.
 */
export const createOrderUseCase = createOrder(prismaOrdersRepository);
export const getOrderByIdUseCase = getOrderById(prismaOrdersRepository);
export const expireUnpaidOrdersUseCase = expireUnpaidOrders(
  prismaOrdersRepository,
);
