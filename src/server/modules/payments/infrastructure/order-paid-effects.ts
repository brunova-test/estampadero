import "server-only";

import { after } from "next/server";

import { generateCommissionEntriesForOrderUseCase } from "elestampadero/server/modules/commissions";
import { assignOrderToOpenBatchUseCase } from "elestampadero/server/modules/production";
import type { OrderDetailDto } from "elestampadero/server/modules/orders";

import { sendOrderReceiptEmail } from "./order-receipt-email";






export async function runOrderPaidEffects(
  order: OrderDetailDto,
): Promise<void> {
  await Promise.all([
    generateCommissionEntriesForOrderUseCase(order),
    assignOrderToOpenBatchUseCase(order.id),
  ]);



  after(async () => {
    try {
      await sendOrderReceiptEmail(order);
    } catch (error) {
      console.error(`[receipt email] Failed for order ${order.id}`, error);
    }
  });
}
