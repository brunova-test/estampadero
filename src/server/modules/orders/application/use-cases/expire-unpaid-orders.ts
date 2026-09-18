import "server-only";

import type { OrdersRepository } from "../ports/orders-repository";

export function expireUnpaidOrders(repository: OrdersRepository) {
  return (input: {
    createdBefore: Date;
    paymentActivityBefore: Date;
    limit?: number;
  }) =>
    repository.expireUnpaidOrders({
      createdBefore: input.createdBefore,
      paymentActivityBefore: input.paymentActivityBefore,
      limit: input.limit ?? 200,
    });
}
