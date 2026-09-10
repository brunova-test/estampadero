"use client";

import { useState } from "react";

import { Button } from "elestampadero/shared/ui";
import {
  clearPaymentAttemptId,
  getOrCreatePaymentAttemptId,
} from "elestampadero/shared/lib/payment-attempt";
import { api } from "elestampadero/trpc/react";

interface PayWithModoButtonProps {
  orderId: string;
}

/**
 * MODO isn't live yet (see modo-gateway.ts) — createModoSession always
 * throws PRECONDITION_FAILED server-side. Rather than surface that raw
 * tRPC error to a shopper, this button recognizes that specific case and
 * shows the same "próximamente" message the panel used to show statically.
 * Once real MODO credentials are configured, this starts working with no
 * UI changes needed.
 */
export function PayWithModoButton({ orderId }: PayWithModoButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  const createSession = api.payments.createModoSession.useMutation({
    onSuccess: (result) => {
      window.location.assign(result.checkoutUrl);
    },
    onError: (mutationError) => {
      clearPaymentAttemptId(orderId, "modo");
      if (mutationError.data?.code === "PRECONDITION_FAILED") {
        setUnavailable(true);
        return;
      }
      setError(mutationError.message);
    },
  });

  if (unavailable) {
    return (
      <p className="text-muted rounded border border-dashed border-black/10 p-4 text-sm">
        MODO estará disponible próximamente.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="mint"
        className="!min-h-11 !w-full !px-4 !py-2.5 !text-sm !leading-tight"
        disabled={createSession.isPending}
        loading={createSession.isPending}
        loadingLabel="Abriendo MODO"
        onClick={() => {
          setError(null);
          createSession.mutate({
            orderId,
            paymentAttemptId: getOrCreatePaymentAttemptId(orderId, "modo"),
          });
        }}
      >
        {createSession.isPending ? "Redirigiendo a MODO..." : "Pagar con MODO"}
      </Button>
      {error ? (
        <p className="text-xs font-semibold text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
