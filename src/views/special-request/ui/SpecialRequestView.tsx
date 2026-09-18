"use client";

import Link from "next/link";
import { useState } from "react";

import { routes } from "elestampadero/shared/config/routes";
import { Button, Container } from "elestampadero/shared/ui";
import { StoreHeader } from "elestampadero/widgets/store-header";
import { api } from "elestampadero/trpc/react";

const STEPS = [
  "Enviás el pedido",
  "Recibís la propuesta de diseño",
  "Aprobás y entramos en producción",
];

export function SpecialRequestAuthRequired() {
  return (
    <div className="bg-paper flex min-h-screen flex-col">
      <StoreHeader />
      <main className="flex flex-1 items-center py-16">
        <Container>
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 rounded-2xl bg-white px-6 py-12 text-center shadow-[0_24px_70px_-42px_rgba(46,4,112,.5)] sm:px-12">
            <span className="text-deep bg-mint rounded-full px-4 py-2 font-mono text-xs font-bold tracking-[.16em] uppercase">
              Pedido especial
            </span>
            <h1 className="font-display text-ink text-3xl leading-tight font-black sm:text-4xl">
              Iniciá sesión para pedir un diseño a medida
            </h1>
            <p className="text-muted max-w-xl text-base leading-relaxed sm:text-lg">
              Necesitamos tu cuenta para guardar la solicitud y poder seguirla
              junto con nuestro equipo. Para comprar productos del catálogo no
              necesitás iniciar sesión.
            </p>
            <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href={`${routes.signIn}?callbackUrl=${encodeURIComponent(routes.specialRequest)}`}
                className="brand-action brand-cut bg-deep inline-flex items-center justify-center px-7 py-3 text-sm font-extrabold text-white uppercase"
              >
                Iniciar sesión
              </Link>
              <Link
                href={routes.catalog}
                className="brand-action brand-cut border-deep text-deep inline-flex items-center justify-center border-2 px-7 py-3 text-sm font-extrabold uppercase"
              >
                Comprar del catálogo
              </Link>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}

export function SpecialRequestView() {
  const [contactName, setContactName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [garmentType, setGarmentType] = useState("");
  const [estimatedQty, setEstimatedQty] = useState("");
  const [sizesAndColors, setSizesAndColors] = useState("");
  const [neededBy, setNeededBy] = useState("");
  const [comments, setComments] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createRequest = api.specialRequests.create.useMutation({
    onError: (mutationError) => setError(mutationError.message),
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    createRequest.mutate({
      contactName,
      whatsapp,
      garmentType,
      estimatedQty,
      sizesAndColors,
      neededBy: neededBy || undefined,
      comments: comments || undefined,
    });
  }

  if (createRequest.isSuccess) {
    return (
      <div className="bg-paper flex min-h-screen flex-col">
        <StoreHeader />
        <main className="flex-1">
          <Container className="flex flex-col items-center gap-3 py-24 text-center">
            <h1 className="font-display text-ink text-3xl font-black">
              ¡Recibimos tu pedido!
            </h1>
            <p className="text-muted max-w-md">
              Te vamos a escribir por WhatsApp con la propuesta de diseño y el
              presupuesto para que apruebes antes de producir.
            </p>
          </Container>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-paper flex min-h-screen flex-col">
      <StoreHeader />
      <main className="flex-1">
        <Container className="py-10">
          <div className="grid overflow-hidden rounded-lg bg-white shadow-sm lg:grid-cols-[1fr_1.2fr]">
            <div className="from-deep to-mid flex flex-col gap-6 bg-gradient-to-br p-6 text-white md:gap-8 md:p-10 lg:p-14">
              <span className="text-mint font-mono text-xs tracking-widest uppercase">
                Pedido especial
              </span>
              <h1 className="font-display text-3xl leading-[1.02] font-black sm:text-4xl">
                Contanos qué querés estampar
              </h1>
              <p className="text-white/80">
                Nos contás tu idea, elegimos la prenda y te enviamos la
                propuesta para aprobar antes de producir.
              </p>
              <div className="mt-auto flex flex-col gap-4">
                {STEPS.map((step, index) => (
                  <div key={step} className="flex items-center gap-4">
                    <span className="text-mint font-mono text-sm">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-5 p-6 md:p-10 lg:p-14"
            >
              <h2 className="font-display text-ink text-2xl font-black">
                Datos del pedido
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  required
                  placeholder="Nombre o institución"
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                  className="rounded border-2 border-black/10 px-4 py-3 text-sm"
                />
                <input
                  required
                  placeholder="WhatsApp"
                  value={whatsapp}
                  onChange={(event) => setWhatsapp(event.target.value)}
                  className="rounded border-2 border-black/10 px-4 py-3 text-sm"
                />
                <input
                  required
                  placeholder="Tipo de prenda"
                  value={garmentType}
                  onChange={(event) => setGarmentType(event.target.value)}
                  className="rounded border-2 border-black/10 px-4 py-3 text-sm"
                />
                <input
                  required
                  placeholder="Cantidad estimada"
                  value={estimatedQty}
                  onChange={(event) => setEstimatedQty(event.target.value)}
                  className="rounded border-2 border-black/10 px-4 py-3 text-sm"
                />
                <input
                  required
                  placeholder="Talles y colores"
                  value={sizesAndColors}
                  onChange={(event) => setSizesAndColors(event.target.value)}
                  className="rounded border-2 border-black/10 px-4 py-3 text-sm"
                />
                <input
                  placeholder="Fecha necesaria"
                  value={neededBy}
                  onChange={(event) => setNeededBy(event.target.value)}
                  className="rounded border-2 border-black/10 px-4 py-3 text-sm"
                />
              </div>

              <textarea
                rows={3}
                placeholder="Comentarios: ubicación del estampado, colores, referencias…"
                value={comments}
                onChange={(event) => setComments(event.target.value)}
                className="rounded border-2 border-black/10 px-4 py-3 text-sm"
              />

              <p className="text-muted text-xs leading-relaxed">
                Por seguridad, este formulario no admite archivos, scripts ni
                código de programación. Podrás compartir referencias cuando te
                contactemos por WhatsApp.
              </p>

              {error ? (
                <p className="text-sm font-semibold text-red-600">{error}</p>
              ) : null}

              <Button
                type="submit"
                className="w-full"
                disabled={createRequest.isPending}
                loading={createRequest.isPending}
                loadingLabel="Enviando pedido"
              >
                {createRequest.isPending ? "Enviando..." : "Enviar pedido"}
              </Button>
            </form>
          </div>
        </Container>
      </main>
    </div>
  );
}
