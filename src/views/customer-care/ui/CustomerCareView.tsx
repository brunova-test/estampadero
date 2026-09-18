"use client";

import Image from "next/image";
import { useState } from "react";

import { formatCents } from "elestampadero/shared/lib/money";
import { Button, Container } from "elestampadero/shared/ui";
import { api } from "elestampadero/trpc/react";
import { StoreFooter } from "elestampadero/widgets/store-footer";
import { StoreHeader } from "elestampadero/widgets/store-header";

type RequestType = "WITHDRAWAL" | "RETURN" | "CLAIM";

const COPY: Record<RequestType, { eyebrow: string; title: string; description: string }> = {
  WITHDRAWAL: {
    eyebrow: "Botón de arrepentimiento",
    title: "Solicitá la cancelación de tu compra",
    description: "Identificá el pedido y las prendas. El equipo verificará el estado, el plazo aplicable y el pago antes de confirmar la devolución.",
  },
  RETURN: {
    eyebrow: "Cambios y devoluciones",
    title: "Iniciá una devolución",
    description: "Seleccioná las prendas y cantidades. La solicitud queda registrada y el reintegro se procesa por el mismo medio de pago una vez aprobado.",
  },
  CLAIM: {
    eyebrow: "Reclamos",
    title: "Contanos qué pasó con tu pedido",
    description: "Podés registrar un inconveniente por una o varias prendas y seguirlo con un código único.",
  },
};

export function CustomerCareView({ type }: { type: RequestType }) {
  const [requestType, setRequestType] = useState(type);
  const copy = COPY[requestType];
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [lookupInput, setLookupInput] = useState<{ orderNumber: number; email: string } | null>(null);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const lookup = api.customerRequests.lookupOrder.useQuery(
    lookupInput ?? { orderNumber: 1, email: "pendiente@ejemplo.com" },
    { enabled: lookupInput !== null, retry: false },
  );
  const create = api.customerRequests.create.useMutation();

  if (create.data) {
    return (
      <div className="bg-paper flex min-h-screen flex-col">
        <StoreHeader />
        <main className="flex flex-1 items-center py-16">
          <Container>
            <section className="mx-auto max-w-2xl rounded-2xl bg-white p-8 text-center shadow-sm sm:p-12">
              <span className="bg-mint text-deep inline-flex rounded-full px-4 py-2 font-mono text-xs font-bold uppercase">Solicitud registrada</span>
              <h1 className="font-display text-ink mt-5 text-3xl font-black">Recibimos tu solicitud</h1>
              <p className="text-muted mt-3">Guardá este código para cualquier consulta:</p>
              <strong className="text-deep mt-4 block font-mono text-xl">{create.data.publicCode}</strong>
              <p className="text-muted mt-5 text-sm leading-relaxed">La devolución no se ejecuta automáticamente al enviar el formulario. Primero verificamos las prendas, el plazo y el pago; si corresponde, el reintegro se realiza por Mercado Pago al mismo medio utilizado.</p>
            </section>
          </Container>
        </main>
        <StoreFooter />
      </div>
    );
  }

  return (
    <div className="bg-paper flex min-h-screen flex-col">
      <StoreHeader />
      <main className="flex-1 py-10 sm:py-14">
        <Container>
          <div className="mx-auto grid max-w-6xl overflow-hidden rounded-2xl bg-white shadow-[0_24px_70px_-42px_rgba(46,4,112,.5)] lg:grid-cols-[.8fr_1.2fr]">
            <aside className="from-deep to-mid flex flex-col gap-5 bg-gradient-to-br p-7 text-white sm:p-10 lg:p-12">
              <span className="text-mint font-mono text-xs font-bold tracking-widest uppercase">{copy.eyebrow}</span>
              <h1 className="font-display text-3xl leading-tight font-black sm:text-4xl">{copy.title}</h1>
              <p className="leading-relaxed text-white/80">{copy.description}</p>
              <div className="mt-auto rounded-xl border border-white/15 bg-white/10 p-4 text-sm leading-relaxed">Necesitás el número de pedido y el correo usado en la compra. Nunca te pediremos contraseñas ni datos completos de la tarjeta.</div>
            </aside>

            <section className="flex flex-col gap-6 p-6 sm:p-10 lg:p-12">
              {type !== "WITHDRAWAL" ? (
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-black/5 p-1">
                  {(["RETURN", "CLAIM"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setRequestType(option)}
                      className={`rounded-lg px-4 py-3 text-sm font-extrabold ${requestType === option ? "bg-deep text-white shadow" : "text-deep"}`}
                    >
                      {option === "RETURN" ? "Devolución" : "Reclamo"}
                    </button>
                  ))}
                </div>
              ) : null}
              <form className="grid gap-4 sm:grid-cols-[1fr_1.5fr_auto]" onSubmit={(event) => { event.preventDefault(); setSelected({}); setLookupInput({ orderNumber: Number(orderNumber), email }); }}>
                <label className="text-ink flex flex-col gap-2 text-sm font-bold">Número de pedido
                  <input required min="1" inputMode="numeric" value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} className="rounded-lg border-2 border-black/10 px-4 py-3 font-normal" placeholder="000123" />
                </label>
                <label className="text-ink flex flex-col gap-2 text-sm font-bold">Correo de la compra
                  <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-lg border-2 border-black/10 px-4 py-3 font-normal" placeholder="tu@email.com" />
                </label>
                <Button type="submit" className="self-end" disabled={lookup.isFetching}>Buscar</Button>
              </form>

              {lookup.error ? <p className="rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-700">{lookup.error.message}</p> : null}

              {lookup.data ? (
                <form className="flex flex-col gap-5 border-t border-black/10 pt-6" onSubmit={(event) => {
                  event.preventDefault();
                  if (!lookupInput) return;
                  const items = Object.entries(selected).filter(([, quantity]) => quantity > 0).map(([orderItemId, quantity]) => ({ orderItemId, quantity }));
                  create.mutate({ ...lookupInput, type: requestType, reason, details: details || undefined, items });
                }}>
                  <div>
                    <h2 className="font-display text-ink text-2xl font-black">Pedido #{String(lookup.data.orderNumber).padStart(6, "0")}</h2>
                    <p className="text-muted mt-1 text-sm">Elegí al menos una prenda y la cantidad.</p>
                  </div>
                  <div className="grid gap-3">
                    {lookup.data.items.map((item) => {
                      const quantity = selected[item.id] ?? 0;
                      return (
                        <label key={item.id} className={`grid cursor-pointer grid-cols-[64px_1fr_auto] items-center gap-4 rounded-xl border-2 p-3 ${quantity ? "border-mid bg-paper" : "border-black/10"}`}>
                          <span className="relative h-16 w-16 overflow-hidden rounded-lg bg-black/5">{item.imageUrl ? <Image src={item.imageUrl} alt="" fill className="object-contain" sizes="64px" /> : null}</span>
                          <span><strong className="text-ink block">{item.productName}</strong><small className="text-muted">{item.size} · {item.color}{item.clubName ? ` · ${item.clubName}` : ""} · {formatCents(item.unitAmountInCents)}</small></span>
                          <select aria-label={`Cantidad de ${item.productName}`} value={quantity} onChange={(event) => setSelected((current) => ({ ...current, [item.id]: Number(event.target.value) }))} className="rounded-lg border border-black/20 bg-white px-3 py-2">
                            {Array.from({ length: item.quantity + 1 }, (_, index) => <option key={index} value={index}>{index === 0 ? "No" : index}</option>)}
                          </select>
                        </label>
                      );
                    })}
                  </div>
                  <label className="text-ink flex flex-col gap-2 text-sm font-bold">Motivo
                    <input required minLength={3} value={reason} onChange={(event) => setReason(event.target.value)} className="rounded-lg border-2 border-black/10 px-4 py-3 font-normal" />
                  </label>
                  <label className="text-ink flex flex-col gap-2 text-sm font-bold">Detalle (opcional)
                    <textarea rows={4} value={details} onChange={(event) => setDetails(event.target.value)} className="rounded-lg border-2 border-black/10 px-4 py-3 font-normal" />
                  </label>
                  {create.error ? <p className="text-sm font-semibold text-red-700">{create.error.message}</p> : null}
                  <Button type="submit" disabled={create.isPending || !Object.values(selected).some((value) => value > 0)} loading={create.isPending} loadingLabel="Registrando solicitud">Enviar solicitud</Button>
                </form>
              ) : null}
            </section>
          </div>
        </Container>
      </main>
      <StoreFooter />
    </div>
  );
}
