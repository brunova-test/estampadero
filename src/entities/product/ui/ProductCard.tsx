"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { useCartStore } from "elestampadero/entities/cart";
import { colorToHex } from "elestampadero/shared/lib/color-swatch";
import { formatCents } from "elestampadero/shared/lib/money";
import { CartIcon } from "elestampadero/shared/ui";
import type { ProductSummary } from "../model/types";

interface ProductCardProps {
  product: ProductSummary;
  onOpen: () => void;
}

export function ProductCard({ product, onOpen }: ProductCardProps) {
  const images =
    product.images.length > 0
      ? product.images
      : product.imageUrl
        ? [{ url: product.imageUrl, color: null }]
        : [];
  const selectableColors = product.colors.filter((color) =>
    images.some((image) => image.color === color),
  );
  const initialColor = selectableColors.includes(
    product.defaultVariant?.color ?? "",
  )
    ? (product.defaultVariant?.color ?? "")
    : (selectableColors[0] ?? "");
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [isFavorite, setIsFavorite] = useState(false);
  const [quantityFeedback, setQuantityFeedback] = useState<number | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addLine = useCartStore((state) => state.addLine);
  const activeImage =
    images.find((image) => image.color === selectedColor) ?? images[0];
  const selectedVariant =
    product.variants.find(
      (variant) =>
        variant.color === selectedColor &&
        (!product.showStock || (variant.stock ?? 0) > 0),
    ) ??
    product.variants.find((variant) => variant.color === selectedColor) ??
    product.variants.find(
      (variant) => variant.id === product.defaultVariant?.id,
    );
  const isOutOfStock =
    product.showStock &&
    (product.totalStock <= 0 ||
      !selectedVariant ||
      (selectedVariant.stock ?? 0) <= 0);

  useEffect(
    () => () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    },
    [],
  );

  function handleAddToCart() {
    if (!selectedVariant || isOutOfStock) return;

    const currentQuantity =
      useCartStore
        .getState()
        .lines.find((line) => line.variantId === selectedVariant.id)
        ?.quantity ?? 0;

    addLine(
      {
        variantId: selectedVariant.id,
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        imageUrl: activeImage?.url ?? product.imageUrl,
        size: selectedVariant.size,
        color: selectedVariant.color,
        priceInCents: product.priceInCents,
        clubName: product.club?.name ?? null,
      },
      1,
    );

    setQuantityFeedback(currentQuantity + 1);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setQuantityFeedback(null), 900);
  }

  return (
    <article className="catalog-product-card border-deep/8 hover:border-deep/25 @container relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white p-3 shadow-[0_10px_28px_-28px_rgba(46,4,112,.35)] transition-colors duration-150 sm:p-3.5">
      <div className="catalog-product-card__media relative aspect-square w-full overflow-hidden rounded-xl bg-white">
        {activeImage ? (
          <Image
            src={activeImage.url}
            alt={
              selectedColor
                ? `${product.name} en color ${selectedColor}`
                : product.name
            }
            fill
            className="scale-[1.2] object-contain"
            sizes="(min-width: 1024px) 22vw, 45vw"
          />
        ) : null}
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Abrir detalle de ${product.name}`}
          className="product-card-trigger absolute inset-0 z-10"
        />
        <button
          type="button"
          aria-label={
            isFavorite
              ? `Quitar ${product.name} de favoritos`
              : `Agregar ${product.name} a favoritos`
          }
          aria-pressed={isFavorite}
          onClick={() => setIsFavorite((current) => !current)}
          className={`absolute top-2 right-2 z-30 grid h-8 w-8 place-items-center rounded-full bg-white/85 transition-colors md:hidden ${
            isFavorite ? "text-deep" : "text-gray-500"
          }`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill={isFavorite ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.4 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
          </svg>
        </button>
        {product.compareAtCents ? (
          <span className="bg-mint font-display text-deep pointer-events-none absolute top-3 left-3 z-20 rounded-full px-3 py-1.5 text-sm font-black shadow-[0_8px_20px_-10px_rgba(46,4,112,.7)]">
            -
            {Math.round(
              ((product.compareAtCents - product.priceInCents) /
                product.compareAtCents) *
                100,
            )}
            %
          </span>
        ) : null}
        {product.allowsCustomPrint ? (
          <span className="bg-deep pointer-events-none absolute top-3 right-11 z-20 rounded-full px-2.5 py-1 text-[9px] font-bold tracking-wide text-white uppercase shadow-sm md:right-3">
            Personalizable
          </span>
        ) : null}
      </div>

      <div className="catalog-product-card__body flex flex-1 flex-col px-0.5 pt-2.5">
        <span className="catalog-product-card__eyebrow text-muted font-mono text-[9px] font-semibold tracking-[.1em] uppercase sm:text-[10px]">
          {product.club?.name ?? product.category?.name ?? "Indumentaria"}
        </span>
        <button
          type="button"
          onClick={onOpen}
          className="product-card-trigger catalog-product-card__title mt-1 self-start text-left"
        >
          <h3 className="font-display text-ink text-[clamp(15px,1.15vw,19px)] leading-[1.13] font-extrabold">
            {product.name}
          </h3>
        </button>

        <div className="catalog-product-card__price mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="catalog-product-card__price-value font-display text-deep text-[clamp(20px,1.55vw,26px)] font-black">
            {formatCents(product.priceInCents)}
          </span>
          {product.compareAtCents ? (
            <span className="text-muted text-xs line-through sm:text-sm">
              {formatCents(product.compareAtCents)}
            </span>
          ) : null}
        </div>

        {product.showStock && isOutOfStock ? (
          <span className="catalog-product-card__status mt-1 text-xs font-bold text-red-600">
            Sin stock
          </span>
        ) : (
          <span className="catalog-product-card__status text-muted mt-1 text-xs font-medium">
            {product.showStock && product.totalStock <= 5
              ? "Últimas unidades"
              : "3 cuotas sin interés"}
          </span>
        )}

        {selectableColors.length > 0 ? (
          <div
            className="catalog-product-card__colors mt-2 flex flex-wrap gap-1.5"
            aria-label="Colores disponibles"
          >
            {selectableColors.slice(0, 4).map((color) => {
              const isSelected = color === selectedColor;
              return (
                <button
                  type="button"
                  key={color}
                  title={color}
                  aria-label={`Ver ${product.name} en color ${color}`}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedColor(color)}
                  className={`grid h-6 w-6 place-items-center rounded-full border p-[3px] ${
                    isSelected
                      ? "border-deep bg-white shadow-sm"
                      : "border-transparent"
                  }`}
                >
                  <span
                    className="h-full w-full rounded-full border border-black/10"
                    style={{ backgroundColor: colorToHex(color) }}
                  />
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="catalog-product-card__actions mt-auto pt-3">
          <button
            type="button"
            data-variant="primary"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className="catalog-product-card__cart-button brand-action relative flex min-h-12 w-full items-center justify-center overflow-hidden rounded-none bg-[linear-gradient(135deg,var(--color-deep),var(--color-mid))] px-3 py-3 text-center text-xs leading-tight font-extrabold text-white uppercase shadow-[0_10px_22px_-18px_rgba(46,4,112,.72)] disabled:cursor-not-allowed disabled:opacity-45 @[150px]:text-sm @[176px]:text-base @[176px]:whitespace-nowrap"
            title={
              selectedVariant
                ? `Agregar talle ${selectedVariant.size}, color ${selectedVariant.color}`
                : undefined
            }
          >
            <span
              className={`inline-flex items-center justify-center gap-1.5 transition-opacity duration-150 ${
                quantityFeedback !== null ? "opacity-0" : "opacity-100"
              }`}
            >
              <CartIcon className="h-5 w-5 shrink-0 @[176px]:h-6 @[176px]:w-6" />
              {product.showStock && isOutOfStock ? "Sin stock" : "Agregar al carrito"}
            </span>

            {quantityFeedback !== null ? (
              <span
                key={quantityFeedback}
                className="product-cart-count-pop font-display text-mint absolute inset-0 grid place-items-center text-xl font-black"
              >
                +{quantityFeedback}
              </span>
            ) : null}
          </button>
          <span className="sr-only" aria-live="polite">
            {quantityFeedback !== null
              ? `${product.name}: ${quantityFeedback} en el carrito`
              : ""}
          </span>
        </div>
      </div>
    </article>
  );
}
