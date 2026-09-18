"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function PendingPaymentRefresh() {
  const router = useRouter();

  useEffect(() => {
    let refreshCount = 0;
    const intervalId = window.setInterval(() => {
      refreshCount += 1;
      router.refresh();

      if (refreshCount >= 20) window.clearInterval(intervalId);
    }, 3_000);

    return () => window.clearInterval(intervalId);
  }, [router]);

  return null;
}
