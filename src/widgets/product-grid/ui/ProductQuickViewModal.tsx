"use client";

import Image from "next/image";
import { m } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { AddToCartPanel } from "elestampadero/features/add-to-cart";
import { formatCents } from "elestampadero/shared/lib/money";
import { getClubStoreBranding } from "elestampadero/shared/config/club-store-branding";
import { api } from "elestampadero/trpc/react";
import type { ProductSummary } from "elestampadero/entities/product";

interface ProductQuickViewModalProps {
  product: Pick<
    ProductSummary,
    "id" | "slug" | "name" | "images" | "imageUrls"
  >;
  open: boolean;
  onClose: () => void;
}

export function ProductQuickViewModal({
  product,
  open,
  onClose,
}: ProductQuickViewModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
  const detailQuery = api.catalog.bySlug.useQuery(
    { slug: product.slug },
    { enabled: open, staleTime: 60_000 },
  );

  useEffect(() => {
    if (!open) return;

    setActiveImageIndex(0);
    setIsZoomed(false);
    setZoomOrigin("50% 50%");

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, open]);

  if (!open || typeof document === "undefined") return null;

  const detail = detailQuery.data;
  const images =
    detail && detail.images.length > 0
      ? detail.images
      : product.images.length > 0
        ? product.images.map((image) => ({
            ...image,
            alt: product.name,
          }))
        : product.imageUrls.map((url) => ({
            url,
            alt: product.name,
            color: null,
          }));
  const activeImage = images[activeImageIndex] ?? images[0];
  const ownerName = detail?.club?.name ?? "El Estampadero";
  const ownerBranding = detail?.club
    ? getClubStoreBranding(detail.club.slug)
    : {};
  const ownerLogo =
    ownerBranding.logoUrl ?? detail?.club?.logoUrl ?? "/images/icono.jpg";

  return createPortal(
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-ink/70 modal-scrollbar-hidden fixed inset-0 z-[10000] grid place-items-center overflow-y-auto p-2 backdrop-blur-md sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <m.section
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`quick-view-${product.id}`}
        className="product-quick-view modal-scrollbar-hidden relative my-auto max-h-[calc(100svh-16px)] w-full max-w-[1180px] overflow-y-auto rounded-2xl border border-white/60 bg-white shadow-[0_34px_100px_-34px_rgba(14,10,26,.75)] sm:max-h-[calc(100svh-32px)] lg:h-[min(660px,calc(100svh-48px))] lg:overflow-hidden"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalle"
          className="product-modal-close text-deep absolute top-3 right-4 z-40 text-[30px] leading-none font-medium transition-colors duration-200 sm:top-4 sm:right-5"
        >
          ×
        </button>

        {detailQuery.isLoading ? (
          <div className="grid min-h-[420px] place-items-center lg:h-full lg:min-h-0">
            <div
              role="status"
              className="flex flex-col items-center gap-4 text-center"
            >
              <span className="global-loader__spinner" aria-hidden="true" />
              <span className="text-deep font-mono text-xs font-semibold tracking-[.15em] uppercase">
                Cargando...
              </span>
            </div>
          </div>
        ) : detailQuery.error || !detail ? (
          <div className="grid min-h-[420px] place-items-center px-8 text-center">
            <div>
              <h2 className="font-display text-ink text-2xl font-black">
                No pudimos cargar el producto
              </h2>
              <p className="text-muted mt-2 text-sm">
                Cerrá el modal e intentá nuevamente.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid lg:h-full lg:grid-cols-[1.04fr_.96fr]">
            <div
              className={`product-quick-view__media relative min-h-[300px] overflow-hidden bg-white sm:min-h-[380px] lg:h-full lg:min-h-0 ${
                isZoomed ? "cursor-zoom-out" : ""
              }`}
              onMouseMove={(event) => {
                if (!isZoomed) return;
                const bounds = event.currentTarget.getBoundingClientRect();
                const x = ((event.clientX - bounds.left) / bounds.width) * 100;
                const y = ((event.clientY - bounds.top) / bounds.height) * 100;
                setZoomOrigin(`${x}% ${y}%`);
              }}
            >
              {activeImage ? (
                <Image
                  src={activeImage.url}
                  alt={activeImage.alt ?? detail.name}
                  fill
                  className={`object-contain p-5 transition-transform duration-300 sm:p-7 lg:p-6 ${
                    isZoomed ? "scale-[1.8]" : "scale-100"
                  }`}
                  style={{ transformOrigin: zoomOrigin }}
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  priority
                />
              ) : null}
              {detail.compareAtCents ? (
                <span className="bg-mint font-display text-deep absolute top-4 left-4 rounded-full px-3 py-1.5 text-base font-black shadow-[0_10px_28px_-14px_rgba(46,4,112,.65)] sm:top-5 sm:left-5">
                  -
                  {Math.round(
                    ((detail.compareAtCents - detail.priceInCents) /
                      detail.compareAtCents) *
                      100,
                  )}
                  %
                </span>
              ) : null}

              {images.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveImageIndex(
                        (activeImageIndex - 1 + images.length) % images.length,
                      );
                      setIsZoomed(false);
                    }}
                    aria-label="Ver imagen anterior"
                    className="product-media-control text-deep border-deep/10 absolute top-1/2 left-3 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border bg-white/90 text-2xl font-bold backdrop-blur"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveImageIndex(
                        (activeImageIndex + 1) % images.length,
                      );
                      setIsZoomed(false);
                    }}
                    aria-label="Ver imagen siguiente"
                    className="product-media-control text-deep border-deep/10 absolute top-1/2 right-3 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border bg-white/90 text-2xl font-bold backdrop-blur"
                  >
                    ›
                  </button>

                  <div className="modal-scrollbar-hidden absolute bottom-3 left-1/2 z-20 flex max-w-[72%] -translate-x-1/2 gap-2 overflow-x-auto rounded-xl bg-white/88 p-1.5 shadow-lg backdrop-blur">
                    {images.map((image, index) => (
                      <button
                        key={`${image.url}-${index}`}
                        type="button"
                        onClick={() => {
                          setActiveImageIndex(index);
                          setIsZoomed(false);
                        }}
                        aria-label={`Ver imagen ${index + 1}`}
                        className={`product-media-control relative h-12 w-10 shrink-0 overflow-hidden rounded-lg border-2 bg-white ${
                          activeImageIndex === index
                            ? "border-deep"
                            : "border-transparent"
                        }`}
                      >
                        <Image
                          src={image.url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              <button
                type="button"
                onClick={() => setIsZoomed((value) => !value)}
                aria-label={isZoomed ? "Desactivar zoom" : "Ampliar imagen"}
                aria-pressed={isZoomed}
                className="product-media-control text-deep border-deep/10 absolute right-3 bottom-3 z-30 grid h-10 w-10 place-items-center rounded-full border bg-white/92 shadow-lg backdrop-blur"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="10.5" cy="10.5" r="6.5" />
                  <path d="m15.5 15.5 4 4" />
                  {isZoomed ? (
                    <path d="M7.5 10.5h6" />
                  ) : (
                    <path d="M10.5 7.5v6M7.5 10.5h6" />
                  )}
                </svg>
              </button>
            </div>

            <div className="product-quick-view__content product-detail-scrollbar flex flex-col p-5 sm:p-7 lg:h-full lg:justify-center lg:overflow-y-auto">
              <div className="product-quick-view__brand">
                {ownerBranding.bannerUrl ? (
                  <Image
                    src={ownerBranding.bannerUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    className="product-quick-view__brand-image"
                  />
                ) : null}
                <div className="product-quick-view__brand-overlay" aria-hidden="true" />
                <span className="product-quick-view__brand-name">
                  {ownerName}
                </span>
                <span className="product-quick-view__brand-logo">
                  <Image
                    src={ownerLogo}
                    alt={`Logo de ${ownerName}`}
                    fill
                    sizes="52px"
                    className="object-contain"
                  />
                </span>
              </div>
              <span className="text-muted font-mono text-xs font-semibold tracking-[.15em] uppercase">
                {detail.category?.name ?? "Indumentaria"}
              </span>
              <h2
                id={`quick-view-${product.id}`}
                className="font-display text-ink mt-2 text-[clamp(27px,2.3vw,36px)] leading-[1.03] font-black"
              >
                {detail.name}
              </h2>

              <div className="mt-3 flex flex-wrap items-baseline gap-3">
                <span className="font-display text-deep text-[clamp(26px,2vw,32px)] font-black">
                  {formatCents(detail.priceInCents)}
                </span>
                {detail.compareAtCents ? (
                  <span className="text-muted text-lg line-through sm:text-xl">
                    {formatCents(detail.compareAtCents)}
                  </span>
                ) : null}
              </div>
              <p className="text-muted mt-1 font-semibold">
                3 cuotas sin interés
              </p>

              {detail.description ? (
                <p className="text-muted mt-3 text-sm leading-relaxed">
                  {detail.description}
                </p>
              ) : null}

              <div className="border-deep/10 mt-4 border-t pt-4">
                <AddToCartPanel
                  product={detail}
                  compact
                  onColorChange={(color) => {
                    const colorImageIndex = images.findIndex(
                      (image) => image.color === color,
                    );
                    if (colorImageIndex < 0) return;
                    setActiveImageIndex(colorImageIndex);
                    setIsZoomed(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </m.section>
    </m.div>,
    document.body,
  );
}
