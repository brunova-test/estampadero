import "server-only";

import { after } from "next/server";

import { generateCommissionEntriesForOrderUseCase } from "elestampadero/server/modules/commissions";
import { assignOrderToOpenBatchUseCase } from "elestampadero/server/modules/production";
import type { OrderDetailDto } from "elestampadero/server/modules/orders";

import { sendOrderReceiptEmail } from "./order-receipt-email";

/**
 * Side effects run once an order is confirmed paid (via webhook or a
 * synchronous card payment). Each effect is independently idempotent, so
 * running this more than once for the same order is safe.
 */
export async function runOrderPaidEffects(
  order: OrderDetailDto,
): Promise<void> {
  await Promise.all([
    generateCommissionEntriesForOrderUseCase(order),
    assignOrderToOpenBatchUseCase(order.id),
  ]);

  // The customer does not need to wait for the external email provider after
  // the paid order, commission and production assignment are already durable.
  after(async () => {
    try {
      await sendOrderReceiptEmail(order);
    } catch (error) {
      console.error(`[receipt email] Failed for order ${order.id}`, error);
    }
  });
}
