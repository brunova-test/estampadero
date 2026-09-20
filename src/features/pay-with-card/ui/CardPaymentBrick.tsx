"use client";

import Script from "next/script";
import { useEffect, useId, useRef, useState } from "react";

import { env } from "elestampadero/env";
import { api } from "elestampadero/trpc/react";
import { getOrCreatePaymentAttemptId } from "elestampadero/shared/lib/payment-attempt";

interface CardFormData {
  token: string;
  payment_method_id: string;
  issuer_id?: string;
  installments: number;
  payer?: { identification?: { type?: string; number?: string } };
}

interface MercadoPagoBricksController {
  create: (
    brickType: string,
    containerId: string,
    settings: {
      initialization: { amount: number };
      customization?: {
        paymentMethods?: { minInstallments?: number; maxInstallments?: number };
        visual?: { style?: { theme?: string } };
      };
      callbacks: {
        onReady?: () => void;
        onSubmit: (formData: CardFormData) => Promise<void>;
        onError?: (error: unknown) => void;
      };
    },
  ) => Promise<{ unmount: () => void }>;
}

interface MercadoPagoInstance {
  bricks: () => MercadoPagoBricksController;
}

declare global {
  interface Window {
    MercadoPago?: new (
      publicKey: string,
      options?: { locale?: string },
    ) => MercadoPagoInstance;
  }
}

interface CardPaymentBrickProps {
  orderId: string;
  amountInPesos: number;
  onApproved: () => void;
}

export function CardPaymentBrick({
  orderId,
  amountInPesos,
  onApproved,
}: CardPaymentBrickProps) {
  const containerId = `card-payment-brick-${useId().replace(/[:]/g, "")}`;
  const brickControllerRef = useRef<{ unmount: () => void } | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [brickReady, setBrickReady] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const payWithCard = api.payments.payWithCard.useMutation();

  useEffect(() => {
    if (!sdkReady) return;
    if (!env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY) {
      setResultMessage("El pago con tarjeta no está configurado.");
      return;
    }
    if (!window.MercadoPago) {
      setResultMessage(
        "No pudimos iniciar el formulario seguro de Mercado Pago.",
      );
      return;
    }

    const mp = new window.MercadoPago(env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY, {
      locale: "es-AR",
    });

    let cancelled = false;

    void mp
      .bricks()
      .create("cardPayment", containerId, {
        initialization: { amount: amountInPesos },
        customization: {
          paymentMethods: { maxInstallments: 12 },
          visual: { style: { theme: "default" } },
        },
        callbacks: {
          onReady: () => {
            setBrickReady(true);
            setResultMessage(null);
          },
          onSubmit: async (formData) => {
            try {
              const result = await payWithCard.mutateAsync({
                orderId,
                paymentAttemptId: getOrCreatePaymentAttemptId(orderId, "card"),
                cardToken: formData.token,
                paymentMethodId: formData.payment_method_id,
                issuerId: formData.issuer_id,
                installments: formData.installments,
                payerDocType: formData.payer?.identification?.type,
                payerDocNumber: formData.payer?.identification?.number,
              });

              if (result.status === "APPROVED") {
                setResultMessage("¡Pago aprobado!");
                onApproved();
              } else if (result.status === "PENDING") {
                setResultMessage("Tu pago está siendo procesado.");
              } else {
                setResultMessage(
                  "El pago fue rechazado. Probá con otra tarjeta.",
                );
              }
            } catch (error) {
              setResultMessage(
                error instanceof Error
                  ? error.message
                  : "No pudimos procesar el pago.",
              );
            }
          },
          onError: (error) => {
            console.error("[Mercado Pago Card Brick]", error);
            setResultMessage(
              "Ocurrió un error al cargar el formulario de tarjeta.",
            );
          },
        },
      })
      .then((controller) => {
        if (cancelled) {
          controller.unmount();
          return;
        }
        brickControllerRef.current = controller;
      })
      .catch((error: unknown) => {
        console.error("[Mercado Pago Card Brick initialization]", error);
        if (!cancelled) {
          setResultMessage(
            "Mercado Pago no pudo iniciar el formulario. Revisá la Public Key y recargá la página.",
          );
        }
      });

    return () => {
      cancelled = true;
      brickControllerRef.current?.unmount();
      brickControllerRef.current = null;
    };

  }, [sdkReady, containerId, amountInPesos, orderId]);

  return (
    <div className="flex flex-col gap-2">
      <Script
        src="https://sdk.mercadopago.com/js/v2"
        onLoad={() => setSdkReady(true)}
        onReady={() => setSdkReady(true)}
        onError={() =>
          setResultMessage(
            "No se pudo descargar el formulario seguro de Mercado Pago.",
          )
        }
      />
      {!brickReady && !resultMessage ? (
        <p className="text-muted py-4 text-center text-sm" role="status">
          Cargando...
        </p>
      ) : null}
      <div id={containerId} className={brickReady ? "" : "min-h-4"} />
      {resultMessage ? (
        <p className="text-deep text-sm font-semibold">{resultMessage}</p>
      ) : null}
    </div>
  );
}
