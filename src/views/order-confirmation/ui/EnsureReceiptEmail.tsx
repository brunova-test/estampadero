"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { api } from "elestampadero/trpc/react";

interface EnsureReceiptEmailProps {
  orderId: string;
  alreadySent: boolean;
}

export function EnsureReceiptEmail({
  orderId,
  alreadySent,
}: EnsureReceiptEmailProps) {
  const router = useRouter();
  const { mutate } = api.orders.sendReceipt.useMutation({
    onSuccess: () => router.refresh(),
  });

  useEffect(() => {
    if (!alreadySent) mutate({ id: orderId });
  }, [alreadySent, mutate, orderId]);

  return null;
}
