"use client";

import { useState } from "react";

import { Button } from "elestampadero/shared/ui";
import {
  clearPaymentAttemptId,
  getOrCreatePaymentAttemptId,
} from "elestampadero/shared/lib/payment-attempt";
import { api } from "elestampadero/trpc/react";

interface PayWithMercadoPagoButtonProps {
  orderId: string;
}

export function PayWithMercadoPagoButton({
  orderId,
}: PayWithMercadoPagoButtonProps) {
  const [error, setError] = useState<string | null>(null);

  const createSession = api.payments.createCheckoutSession.useMutation({
    onSuccess: (result) => {
      window.location.assign(result.checkoutUrl);
    },
    onError: (mutationError) => {
      clearPaymentAttemptId(orderId, "mercado-pago-wallet");
      setError(mutationError.message);
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="mint"
        className="!min-h-11 !w-full !px-4 !py-2.5 !text-sm !leading-tight"
        disabled={createSession.isPending}
        loading={createSession.isPending}
        loadingLabel="Abriendo Mercado Pago"
        onClick={() => {
          setError(null);
          createSession.mutate({
            orderId,
            paymentAttemptId: getOrCreatePaymentAttemptId(
              orderId,
              "mercado-pago-wallet",
            ),
          });
        }}
      >
        {createSession.isPending
          ? "Redirigiendo a Mercado Pago..."
          : "Pagar con Mercado Pago"}
      </Button>
      {error ? (
        <p className="text-xs font-semibold text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
