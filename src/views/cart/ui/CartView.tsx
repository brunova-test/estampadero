"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { cartSubtotalCents, useCartStore } from "elestampadero/entities/cart";
import type { CartLine } from "elestampadero/entities/cart";
import { routes } from "elestampadero/shared/config/routes";
import { formatCents } from "elestampadero/shared/lib/money";
import {
  Button,
  ButtonLink,
  BackLink,
  Container,
  TrashIcon,
} from "elestampadero/shared/ui";
import { StoreHeader } from "elestampadero/widgets/store-header";
import { ProductQuickViewModal } from "elestampadero/widgets/product-grid/ui/ProductQuickViewModal";
import { api } from "elestampadero/trpc/react";

const CART_ITEMS_PER_PAGE = 5;

export function CartView() {
  const lines = useCartStore((state) => state.lines);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeLine = useCartStore((state) => state.removeLine);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLine, setSelectedLine] = useState<CartLine | null>(null);
  const availabilityQuery = api.checkout.availability.useQuery(
    {
      lines: lines.map((line) => ({
        variantId: line.variantId,
        quantity: line.quantity,
      })),
    },
    { enabled: lines.length > 0, refetchOnWindowFocus: true },
  );
  const availabilityByVariantId = new Map(
    availabilityQuery.data?.map((availability) => [
      availability.variantId,
      availability,
    ]) ?? [],
  );
  const unavailableVariantIds = new Set(
    availabilityQuery.data
      ?.filter((availability) => !availability.isAvailable)
      .map((availability) => availability.variantId) ?? [],
  );
  const subtotal = cartSubtotalCents(
    lines.filter((line) => !unavailableVariantIds.has(line.variantId)),
  );
  const hasUnavailableLines = unavailableVariantIds.size > 0;
  const isCheckingAvailability =
    lines.length > 0 && availabilityQuery.isPending;
  const canContinueToCheckout =
    !isCheckingAvailability &&
    !availabilityQuery.isError &&
    !hasUnavailableLines;
  const pageCount = Math.ceil(lines.length / CART_ITEMS_PER_PAGE);
  const visibleLines = lines.slice(
    (currentPage - 1) * CART_ITEMS_PER_PAGE,
    currentPage * CART_ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [lines]);

  useEffect(() => {
    if (
      selectedLine &&
      !lines.some((line) => line.variantId === selectedLine.variantId)
    ) {
      setSelectedLine(null);
    }
  }, [lines, selectedLine]);

  function openProductDetail(line: CartLine) {
    setSelectedLine(line);
  }

  function closeProductDetail() {
    setSelectedLine(null);
  }

  return (
    <div className="bg-paper flex min-h-screen flex-col">
      <StoreHeader />
      <main className="flex-1">
        <Container className="py-6 md:py-10">
          <div className="mb-5 flex flex-col items-start gap-3 md:mb-6">
            <BackLink fallback={routes.catalog} className="catalog-back-link" />
            <h1 className="font-display text-ink text-[26px] font-black md:text-3xl">
              Tu carrito
            </h1>
          </div>

          {lines.length === 0 ? (
            <div className="rounded-lg border border-dashed border-black/10 bg-white p-12 text-center">
              <p className="text-muted mb-4">Todavía no agregaste productos.</p>
              <Link
                href={routes.catalog}
                className="text-deep font-semibold hover:underline"
              >
                Ver catálogo
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
              <div className="flex flex-col divide-y divide-black/5 rounded-lg bg-white">
                {visibleLines.map((line) => {
                  const availability = availabilityByVariantId.get(
                    line.variantId,
                  );
                  const isUnavailable = availability?.isAvailable === false;

                  return (
                    <div
                      key={line.variantId}
                      aria-disabled={isUnavailable || undefined}
                      className={`cart-product-row flex flex-wrap gap-4 p-5 transition md:flex-nowrap md:gap-5 md:p-6 ${
                        isUnavailable ? "bg-black/[0.04] grayscale" : ""
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => openProductDetail(line)}
                        disabled={isUnavailable}
                        aria-label={`Ver detalle de ${line.productName}`}
                        className="bg-paper relative h-20 w-20 shrink-0 overflow-hidden rounded-lg disabled:cursor-not-allowed disabled:opacity-45 md:h-24 md:w-24"
                      >
                        {line.imageUrl ? (
                          <Image
                            src={line.imageUrl}
                            alt={line.productName}
                            fill
                            className="object-cover"
                          />
                        ) : null}
                      </button>
                      <div
                        className={`flex min-w-0 flex-1 flex-col gap-1.5 ${
                          isUnavailable ? "opacity-55" : ""
                        }`}
                      >
                        <h2 className="text-ink text-lg leading-tight font-extrabold md:text-xl">
                          {line.productName}
                        </h2>
                        <span className="text-muted text-base leading-snug font-semibold md:text-lg">
                          Talle {line.size} · {line.color} · {line.quantity}{" "}
                          {line.quantity === 1 ? "unidad" : "unidades"}
                        </span>
                        {line.clubName ? (
                          <span className="text-deep text-base font-semibold">
                            Producto de {line.clubName}
                          </span>
                        ) : null}
                        {isUnavailable ? (
                          <span className="w-fit rounded-full bg-black/10 px-2.5 py-1 text-xs font-extrabold text-black/70">
                            {availability.reason === "INSUFFICIENT_STOCK"
                              ? "Stock insuficiente"
                              : "Producto no disponible"}
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => removeLine(line.variantId)}
                          aria-label={`Eliminar ${line.productName} del carrito`}
                          className="brand-action bg-deep hover:bg-mid focus-visible:bg-mid mt-2 inline-flex w-fit items-center gap-2 px-3 py-2 text-sm font-bold text-white"
                        >
                          <TrashIcon className="h-4 w-4" />
                          Eliminar
                        </button>
                      </div>
                      <div className="flex w-full shrink-0 items-center justify-between pl-24 md:w-auto md:flex-col md:items-end md:pl-0">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(line.variantId, line.quantity - 1)
                            }
                            disabled={isUnavailable}
                            className="h-9 w-9 rounded border border-black/10 text-lg font-bold disabled:cursor-not-allowed disabled:opacity-35"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-lg font-bold">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(line.variantId, line.quantity + 1)
                            }
                            disabled={isUnavailable}
                            className="h-9 w-9 rounded border border-black/10 text-lg font-bold disabled:cursor-not-allowed disabled:opacity-35"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-display text-deep text-xl font-bold">
                          {formatCents(line.priceInCents * line.quantity)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {pageCount > 1 ? (
                <nav
                  className="flex flex-wrap items-center justify-center gap-2 lg:col-start-1"
                  aria-label="Paginación del carrito"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    disabled={currentPage === 1}
                    className="border-deep/20 text-deep hover:border-deep hover:bg-paper min-h-10 border px-3 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  {Array.from(
                    { length: pageCount },
                    (_, index) => index + 1,
                  ).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      aria-current={currentPage === page ? "page" : undefined}
                      className={`grid size-10 place-items-center border text-sm font-bold transition-colors ${
                        currentPage === page
                          ? "border-deep bg-deep text-white"
                          : "border-deep/20 text-deep hover:border-deep hover:bg-paper"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.min(pageCount, page + 1))
                    }
                    disabled={currentPage === pageCount}
                    className="border-deep/20 text-deep hover:border-deep hover:bg-paper min-h-10 border px-3 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </nav>
              ) : null}

              <div className="h-fit rounded-lg bg-white p-6 lg:p-7">
                <h2 className="font-display mb-4 text-xl font-bold">Resumen</h2>
                <div className="flex justify-between text-base">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-semibold">{formatCents(subtotal)}</span>
                </div>
                <div className="mt-2 flex justify-between text-base">
                  <span className="text-muted">Envío</span>
                  <span className="text-muted">A calcular</span>
                </div>
                <div className="mt-4 flex justify-between border-t border-black/10 pt-4">
                  <span className="font-display font-bold">Total</span>
                  <span className="font-display text-deep text-xl font-bold">
                    {formatCents(subtotal)}
                  </span>
                </div>
                {canContinueToCheckout ? (
                  <ButtonLink
                    href={routes.checkout}
                    className="mt-4 !min-h-11 w-full !px-4 !py-3 !text-sm !leading-tight"
                  >
                    Continuar al pago
                  </ButtonLink>
                ) : (
                  <Button
                    type="button"
                    disabled
                    className="mt-4 !min-h-11 w-full !px-4 !py-3 !text-sm !leading-tight disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {isCheckingAvailability
                      ? "Verificando disponibilidad"
                      : "Continuar al pago"}
                  </Button>
                )}
                {hasUnavailableLines ? (
                  <p className="mt-3 text-sm font-semibold text-red-600">
                    Eliminá los productos no disponibles para continuar.
                  </p>
                ) : null}
                {availabilityQuery.isError ? (
                  <div className="mt-3 text-sm text-red-600">
                    <p>No pudimos verificar la disponibilidad.</p>
                    <button
                      type="button"
                      onClick={() => void availabilityQuery.refetch()}
                      className="mt-1 font-bold underline"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </Container>
      </main>
      {selectedLine ? (
        <ProductQuickViewModal
          product={{
            id: selectedLine.productId,
            slug: selectedLine.productSlug,
            name: selectedLine.productName,
            images: selectedLine.imageUrl
              ? [{ url: selectedLine.imageUrl, color: selectedLine.color }]
              : [],
            imageUrls: selectedLine.imageUrl ? [selectedLine.imageUrl] : [],
          }}
          open
          onClose={closeProductDetail}
        />
      ) : null}
    </div>
  );
}
