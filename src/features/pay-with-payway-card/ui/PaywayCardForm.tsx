"use client";

import { useMemo, useRef, useState } from "react";

import { env } from "elestampadero/env";
import { Button } from "elestampadero/shared/ui";
import { api } from "elestampadero/trpc/react";
import {
  clearPaymentAttemptId,
  getOrCreatePaymentAttemptId,
} from "elestampadero/shared/lib/payment-attempt";

const CARD_METHODS = [
  { id: "1", label: "Visa crédito", debit: false },
  { id: "104", label: "Mastercard crédito", debit: false },
  { id: "31", label: "Visa débito", debit: true },
  { id: "105", label: "Mastercard débito", debit: true },
] as const;

const inputClass =
  "border-deep/15 focus:border-blue focus:ring-blue/15 h-14 w-full rounded-xl border bg-white px-4 text-base text-ink outline-none transition focus:ring-2";
const PAYMENT_RESPONSE_TIMEOUT_MS = 25_000;

interface PaywayCardFormProps {
  orderId: string;
  amountInPesos: number;
  onApproved: () => void;
  onClose?: () => void;
}

export function PaywayCardForm({
  orderId,
  amountInPesos,
  onApproved,
  onClose,
}: PaywayCardFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState("1");
  const [installments, setInstallments] = useState(1);
  const selectedMethod = CARD_METHODS.find(
    (method) => method.id === paymentMethodId,
  )!;
  const installmentOptions = useMemo(() => {
    const configured = env.NEXT_PUBLIC_PAYWAY_INSTALLMENTS.split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value) && value >= 1 && value <= 24);
    return [...new Set([1, ...configured])].sort((a, b) => a - b);
  }, []);
  const payWithCard = api.payments.payWithCard.useMutation();
  const tokenizeCard = api.payments.tokenizeCard.useMutation();

  function clearSensitiveFields() {
    const form = formRef.current;
    if (!form) return;
    for (const name of ["card_number", "security_code"]) {
      const input = form.querySelector<HTMLInputElement>(
        `[data-decidir="${name}"]`,
      );
      if (input) input.value = "";
    }
  }

  async function submitPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const form = formRef.current;
    if (!form) return;
    setSubmitting(true);
    const value = (name: string) =>
      form.querySelector<HTMLInputElement>(`[data-decidir="${name}"]`)?.value ??
      "";
    const timeoutId = window.setTimeout(() => {
      setSubmitting(false);
      setMessage("Payway no respondió a tiempo. Intentá nuevamente.");
    }, PAYMENT_RESPONSE_TIMEOUT_MS);

    try {




      const payerDocNumber = value("card_holder_doc_number");
      const response = await tokenizeCard.mutateAsync({
        cardNumber: value("card_number"),
        securityCode: value("security_code"),
        cardHolderName: value("card_holder_name"),
        expirationMonth: value("card_expiration_month"),
        expirationYear: value("card_expiration_year"),
        docType: value("card_holder_doc_type") || "dni",
        docNumber: payerDocNumber,
        paymentMethodId,
      });
      clearSensitiveFields();

      const result = await payWithCard.mutateAsync({
        orderId,
        paymentAttemptId: getOrCreatePaymentAttemptId(orderId, "payway-card"),
        cardToken: response.id,
        bin: response.bin,
        paymentMethodId,
        installments: selectedMethod.debit ? 1 : installments,
        payerDocType: "dni",
        payerDocNumber,
      });
      if (result.status === "APPROVED") {
        clearPaymentAttemptId(orderId, "payway-card");
        setMessage("¡Pago aprobado!");
        onApproved();
      } else if (result.status === "PENDING") {
        setMessage("El pago está siendo procesado.");
      } else {
        clearPaymentAttemptId(orderId, "payway-card");
        setMessage("El pago fue rechazado. Probá con otra tarjeta.");
      }
    } catch {
      clearPaymentAttemptId(orderId, "payway-card");
      clearSensitiveFields();
      setMessage(
        "No pudimos procesar el pago. Revisá los datos e intentá nuevamente.",
      );
    } finally {
      window.clearTimeout(timeoutId);
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <form
        ref={formRef}
        onSubmit={submitPayment}
        className="grid gap-5"
        autoComplete="on"
      >
        <div>
          <label
            htmlFor="payway-method"
            className="text-ink mb-2 block text-sm font-bold md:text-base"
          >
            Tipo de tarjeta
          </label>
          <select
            id="payway-method"
            className={inputClass}
            value={paymentMethodId}
            onChange={(event) => {
              const method = CARD_METHODS.find(
                (item) => item.id === event.target.value,
              )!;
              setPaymentMethodId(method.id);
              if (method.debit) setInstallments(1);
            }}
          >
            {CARD_METHODS.map((method) => (
              <option key={method.id} value={method.id}>
                {method.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="payway-card-number"
            className="text-ink mb-2 block text-sm font-bold md:text-base"
          >
            Número de tarjeta
          </label>
          <input
            id="payway-card-number"
            className={inputClass}
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            data-decidir="card_number"
            maxLength={19}
            required
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label
              htmlFor="payway-exp-month"
              className="text-ink mb-2 block text-sm font-bold md:text-base"
            >
              Mes
            </label>
            <input
              id="payway-exp-month"
              className={inputClass}
              type="text"
              inputMode="numeric"
              autoComplete="cc-exp-month"
              data-decidir="card_expiration_month"
              placeholder="MM"
              maxLength={2}
              required
            />
          </div>
          <div>
            <label
              htmlFor="payway-exp-year"
              className="text-ink mb-2 block text-sm font-bold md:text-base"
            >
              Año
            </label>
            <input
              id="payway-exp-year"
              className={inputClass}
              type="text"
              inputMode="numeric"
              autoComplete="cc-exp-year"
              data-decidir="card_expiration_year"
              placeholder="AA"
              maxLength={2}
              required
            />
          </div>
          <div>
            <label
              htmlFor="payway-cvv"
              className="text-ink mb-2 block text-sm font-bold md:text-base"
            >
              Código
            </label>
            <input
              id="payway-cvv"
              className={inputClass}
              type="password"
              inputMode="numeric"
              autoComplete="cc-csc"
              data-decidir="security_code"
              maxLength={4}
              required
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="payway-holder"
            className="text-ink mb-2 block text-sm font-bold md:text-base"
          >
            Titular
          </label>
          <input
            id="payway-holder"
            className={inputClass}
            type="text"
            autoComplete="cc-name"
            data-decidir="card_holder_name"
            required
          />
        </div>
        <div className="grid grid-cols-[minmax(120px,0.35fr)_1fr] items-start gap-3">
          <div>
            <label
              htmlFor="payway-doc-type"
              className="text-ink mb-2 block text-sm font-bold md:text-base"
            >
              Documento
            </label>
            <select
              id="payway-doc-type"
              className={inputClass}
              data-decidir="card_holder_doc_type"
            >
              <option value="dni">DNI</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="payway-doc-number"
              className="text-ink mb-2 block text-sm font-bold md:text-base"
            >
              Número
            </label>
            <input
              id="payway-doc-number"
              className={inputClass}
              type="text"
              inputMode="numeric"
              data-decidir="card_holder_doc_number"
              maxLength={11}
              required
            />
          </div>
        </div>
        {!selectedMethod.debit ? (
          <div>
            <label
              htmlFor="payway-installments"
              className="text-ink mb-2 block text-sm font-bold md:text-base"
            >
              Cuotas
            </label>
            <select
              id="payway-installments"
              className={inputClass}
              value={installments}
              onChange={(event) => setInstallments(Number(event.target.value))}
            >
              {installmentOptions.map((quantity) => (
                <option key={quantity} value={quantity}>
                  {quantity === 1 ? "1 pago" : `${quantity} cuotas`} ·{" "}
                  {(amountInPesos / quantity).toLocaleString("es-AR", {
                    style: "currency",
                    currency: "ARS",
                  })}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <p className="hidden">
          Tus datos de tarjeta se envían cifrados directamente a Payway. La
          tienda no recibe ni guarda el número completo ni el código de
          seguridad.
        </p>
        <Button
          type="submit"
          variant="mint"
          className="!min-h-14 !w-full !rounded-xl !text-base md:!text-lg"
          disabled={submitting}
          loading={submitting}
          loadingLabel="Procesando pago"
        >
          Pagar{" "}
          {amountInPesos.toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
          })}
        </Button>
      </form>
      {message ? (
        <p className="text-deep text-base font-semibold" role="status">
          {message}
        </p>
      ) : null}
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="min-h-10 self-center rounded-lg bg-red-600 px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700"
        >
          Cancelar
        </button>
      ) : null}
    </div>
  );
}
