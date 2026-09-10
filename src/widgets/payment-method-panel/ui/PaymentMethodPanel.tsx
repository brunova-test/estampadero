"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import { PayWithMobbexButton } from "elestampadero/features/pay-with-mobbex";

interface PaymentMethodPanelProps {
  orderId: string;
  totalInCents: number;
}

export function PaymentMethodPanel({
  orderId,
  totalInCents,
}: PaymentMethodPanelProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-ink mb-2 text-lg font-bold md:text-xl">
          Elegí cómo querés pagar
        </p>
        <p className="text-muted text-sm md:text-base">
          En el checkout seguro vas a poder elegir tarjeta de crédito, débito,
          cuotas o pagar con QR desde Mercado Pago, MODO y otras apps bancarias.
        </p>
      </div>

      <div className="border-deep/15 grid gap-3 rounded-xl border bg-white p-4 shadow-[0_8px_24px_-22px_rgba(46,4,112,.45)] sm:grid-cols-3">
        <PaymentOption
          icon={<CardIcon />}
          title="Crédito y débito"
          detail="Cuotas según tu tarjeta"
        />
        <PaymentOption
          icon={
            <Image
              src="/images/payments/mercado-pago.svg"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
          }
          title="Mercado Pago"
          detail="Mediante QR interoperable"
        />
        <PaymentOption
          icon={
            <Image
              src="/images/payments/modo.png"
              alt=""
              width={46}
              height={20}
              className="h-5 w-11 object-contain"
            />
          }
          title="MODO"
          detail="Mediante QR interoperable"
        />
      </div>

      <p className="text-ink text-center text-sm">
        Total a pagar:{" "}
        <strong>
          {(totalInCents / 100).toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
          })}
        </strong>
      </p>
      <PayWithMobbexButton orderId={orderId} />
      <p className="text-muted text-center text-xs">
        El pago y la distribución entre los participantes se procesan mediante
        Mobbex.
      </p>
    </div>
  );
}

function PaymentOption({
  icon,
  title,
  detail,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="bg-paper flex items-center gap-3 rounded-lg p-3">
      <span className="bg-mint text-deep grid h-11 w-11 shrink-0 place-items-center rounded-lg">
        {icon}
      </span>
      <span>
        <strong className="text-ink block text-sm">{title}</strong>
        <small className="text-muted block text-xs">{detail}</small>
      </span>
    </div>
  );
}

function CardIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 9h18M7 14h4" />
    </svg>
  );
}
