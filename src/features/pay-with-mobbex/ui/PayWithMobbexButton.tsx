"use client";

import { useState } from "react";

import {
  clearPaymentAttemptId,
  getOrCreatePaymentAttemptId,
} from "elestampadero/shared/lib/payment-attempt";
import { Button } from "elestampadero/shared/ui";
import { api } from "elestampadero/trpc/react";

const MOBBEX_EMBED_SDK = "https://api.mobbex.com/p/embed/1.2.0/lib.js";

interface MobbexEmbedInstance {
  open(input: {
    type: "checkout";
    id: string;
    paymentMethod?: string;
  }): void;
}

interface MobbexWindow extends Window {
  MobbexEmbed?: {
    close(): void;
    init(callbacks: {
      onResult(data: unknown): void;
      onPayment(data: unknown): void;
      onOpen(): void;
      onClose(cancelled: boolean): void;
      onError(error: unknown): void;
    }): MobbexEmbedInstance;
  };
}

let sdkPromise: Promise<void> | null = null;

function loadMobbexSdk(): Promise<void> {
  const mobbexWindow = window as MobbexWindow;
  if (mobbexWindow.MobbexEmbed) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  const loading = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${MOBBEX_EMBED_SDK}"]`,
    );
    const script = existing ?? document.createElement("script");
    const onLoad = () =>
      mobbexWindow.MobbexEmbed
        ? resolve()
        : reject(new Error("El SDK de Mobbex no quedó disponible."));
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("No se pudo cargar el checkout de Mobbex.")),
      { once: true },
    );
    if (!existing) {
      script.src = MOBBEX_EMBED_SDK;
      script.async = true;
      document.head.appendChild(script);
    }
  });
  const pending = loading.catch((error: unknown) => {
    sdkPromise = null;
    throw error;
  });
  sdkPromise = pending;
  return pending;
}

interface PayWithMobbexButtonProps {
  orderId: string;
  paymentMethod?: string;
  label?: string;
}

export function PayWithMobbexButton({
  orderId,
  paymentMethod,
  label = "Ir al pago seguro",
}: PayWithMobbexButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const createSession = api.payments.createCheckoutSession.useMutation({
    onSuccess: async ({ checkoutId, checkoutUrl }) => {
      try {
        await loadMobbexSdk();
        const mobbexWindow = window as MobbexWindow;
        if (!mobbexWindow.MobbexEmbed) throw new Error("SDK no disponible");

        const embed = mobbexWindow.MobbexEmbed.init({
          onResult: () => mobbexWindow.MobbexEmbed?.close(),
          onPayment: () => {
            clearPaymentAttemptId(orderId, "mobbex-checkout");
            window.location.assign(`/pedido/${orderId}`);
          },
          onOpen: () => setCheckoutOpen(true),
          onClose: () => setCheckoutOpen(false),
          onError: () => {
            setCheckoutOpen(false);
            window.location.assign(checkoutUrl);
          },
        });
        embed.open({
          type: "checkout",
          id: checkoutId,
          ...(paymentMethod ? { paymentMethod } : {}),
        });
      } catch {
        window.location.assign(checkoutUrl);
      }
    },
    onError: (mutationError) => {
      clearPaymentAttemptId(orderId, "mobbex-checkout");
      setError(mutationError.message);
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="mint"
        className="!min-h-12 !w-full !px-4 !py-3 !text-base !leading-tight"
        disabled={createSession.isPending || checkoutOpen}
        loading={createSession.isPending}
        loadingLabel="Abriendo el pago seguro"
        onClick={() => {
          setError(null);
          createSession.mutate({
            orderId,
            paymentAttemptId: getOrCreatePaymentAttemptId(
              orderId,
              "mobbex-checkout",
            ),
          });
        }}
      >
        {checkoutOpen ? "Checkout abierto" : label}
      </Button>
      <div id="mbbx-container" />
      {error ? (
        <p className="text-xs font-semibold text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
