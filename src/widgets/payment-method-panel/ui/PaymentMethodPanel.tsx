"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

import { PayWithMobbexButton } from "elestampadero/features/pay-with-mobbex";

interface PaymentMethodPanelProps {
  orderId: string;
  totalInCents: number;
}

type PaymentChoice = "card" | "mercado-pago" | "modo";

const PAYMENT_CHOICES: Record<
  PaymentChoice,
  { paymentMethod: string }
> = {
  card: {
    paymentMethod: "card:card_input",
  },
  "mercado-pago": {
    paymentMethod: "qr:arg_interoperable",
  },
  modo: {
    paymentMethod: "qr:arg_interoperable",
  },
};

export function PaymentMethodPanel({
  orderId,
  totalInCents,
}: PaymentMethodPanelProps) {
  const [selectedMethod, setSelectedMethod] =
    useState<PaymentChoice>("card");
  const [optionsOpen, setOptionsOpen] = useState(false);
  const selection = PAYMENT_CHOICES[selectedMethod];
  const selectedLabel =
    selectedMethod === "card"
      ? "Crédito y débito"
      : selectedMethod === "mercado-pago"
        ? "Mercado Pago"
        : "MODO";

  return (
    <div className="flex flex-col gap-5">
      <div className="border-deep/15 overflow-hidden rounded-xl border bg-white shadow-[0_8px_24px_-22px_rgba(46,4,112,.45)]">
        <button
          type="button"
          aria-expanded={optionsOpen}
          aria-controls="payment-method-options"
          onClick={() => setOptionsOpen((open) => !open)}
          className="group flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet-700"
        >
          <span className="flex min-w-0 items-center gap-3">
            <SelectedPaymentIcon method={selectedMethod} />
            <span className="min-w-0">
              <strong className="text-ink block text-base">
                Elegí cómo querés pagar
              </strong>
              <small className="text-muted mt-0.5 block truncate text-xs">
                Seleccionado: {selectedLabel}
              </small>
            </span>
          </span>
          <ChevronIcon open={optionsOpen} />
        </button>

        <div
          id="payment-method-options"
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            optionsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div
              className="border-deep/10 grid gap-2 border-t p-3"
              role="radiogroup"
              aria-label="Medio de pago"
            >
              <PaymentOption
                icon={<CardIcon />}
                title="Crédito y débito"
                detail="Cuotas según tu tarjeta"
                selected={selectedMethod === "card"}
                onSelect={() => {
                  setSelectedMethod("card");
                  setOptionsOpen(false);
                }}
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
                selected={selectedMethod === "mercado-pago"}
                onSelect={() => {
                  setSelectedMethod("mercado-pago");
                  setOptionsOpen(false);
                }}
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
                selected={selectedMethod === "modo"}
                onSelect={() => {
                  setSelectedMethod("modo");
                  setOptionsOpen(false);
                }}
              />
            </div>
          </div>
        </div>
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
      <PayWithMobbexButton
        orderId={orderId}
        paymentMethod={selection.paymentMethod}
        label="Pagar"
      />
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
  selected,
  onSelect,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 ${
        selected
          ? "border-violet-700 bg-violet-50 shadow-[0_8px_24px_-18px_rgba(76,0,170,.65)]"
          : "border-transparent bg-paper hover:border-violet-300 hover:bg-white hover:shadow-sm"
      }`}
    >
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg transition-colors ${
          selected
            ? "bg-violet-700 text-white"
            : "bg-mint text-deep group-hover:bg-mint/70"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <strong className="text-ink block text-sm">{title}</strong>
        <small className="text-muted block text-xs">{detail}</small>
      </span>
      <span
        aria-hidden="true"
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-xs font-black transition-colors ${
          selected
            ? "border-violet-700 bg-violet-700 text-white"
            : "border-violet-200 bg-white text-transparent"
        }`}
      >
        ✓
      </span>
    </button>
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

function SelectedPaymentIcon({ method }: { method: PaymentChoice }) {
  return (
    <span className="bg-mint text-deep grid h-10 w-10 shrink-0 place-items-center rounded-xl">
      {method === "card" ? (
        <CardIcon />
      ) : method === "mercado-pago" ? (
        <Image
          src="/images/payments/mercado-pago.svg"
          alt="Mercado Pago"
          width={30}
          height={30}
          className="h-7 w-7 object-contain"
        />
      ) : (
        <Image
          src="/images/payments/modo.png"
          alt="MODO"
          width={42}
          height={18}
          className="h-4 w-9 object-contain"
        />
      )}
    </span>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`text-deep grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-100 transition-transform duration-300 ${
        open ? "rotate-180" : ""
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
}
