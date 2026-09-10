"use client";

import { useEffect } from "react";

import { useCartStore } from "elestampadero/entities/cart";

interface PaidOrderCartCleanupProps {
  orderId: string;
  lines: Array<{
    productId: string;
    size: string;
    color: string;
    quantity: number;
  }>;
}

export function PaidOrderCartCleanup({
  orderId,
  lines,
}: PaidOrderCartCleanupProps) {
  useEffect(() => {
    useCartStore.getState().removePurchasedOrder(orderId, lines);
  }, [lines, orderId]);

  return null;
}
