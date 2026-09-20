"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useCartStore } from "elestampadero/entities/cart";
import type { ProductDetail } from "elestampadero/entities/product";
import { SizeChart } from "elestampadero/entities/product";
import { colorToHex } from "elestampadero/shared/lib/color-swatch";
import { Button, CartIcon } from "elestampadero/shared/ui";

interface AddToCartPanelProps {
  product: ProductDetail;
  compact?: boolean;
  onColorChange?: (color: string) => void;
}

function isVariantAvailable(showStock: boolean, stock: number | null) {
  return showStock ? (stock ?? 0) > 0 : stock !== 0;
}

export function AddToCartPanel({
  product,
  compact = false,
  onColorChange,
}: AddToCartPanelProps) {
  const sizes = useMemo(
    () => [...new Set(product.variants.map((variant) => variant.size))],
    [product.variants],
  );
  const variantColors = useMemo(
    () => [...new Set(product.variants.map((variant) => variant.color))],
    [product.variants],
  );
  const colorsWithImages = useMemo(() => {
    const imageColors = new Set(
      product.images.flatMap((image) => (image.color ? [image.color] : [])),
    );
    return variantColors.filter((color) => imageColors.has(color));
  }, [product.images, variantColors]);

  const availableColorsBySize = useMemo(() => {
    const colorsBySize = new Map<string, string[]>();

    for (const availableSize of sizes) {
      colorsBySize.set(
        availableSize,
        colorsWithImages.filter((availableColor) =>
          product.variants.some(
            (variant) =>
              variant.size === availableSize &&
              variant.color === availableColor &&
              isVariantAvailable(product.showStock, variant.stock),
          ),
        ),
      );
    }

    return colorsBySize;
  }, [colorsWithImages, product.showStock, product.variants, sizes]);

  const [size, setSize] = useState(sizes[0] ?? "");
  const [color, setColor] = useState(
    availableColorsBySize.get(sizes[0] ?? "")?.[0] ?? "",
  );
  const [quantityFeedback, setQuantityFeedback] = useState<number | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addLine = useCartStore((state) => state.addLine);
  const availableColors = availableColorsBySize.get(size) ?? [];

  const selectedVariant = product.variants.find(
    (variant) => variant.size === size && variant.color === color,
  );
  const cartQuantity = useCartStore(
    (state) =>
      state.lines.find((line) => line.variantId === selectedVariant?.id)
        ?.quantity ?? 0,
  );
  const isAvailable =
    Boolean(selectedVariant) &&
    isVariantAvailable(product.showStock, selectedVariant?.stock ?? null) &&
    (!product.showStock || (selectedVariant?.stock ?? 0) > cartQuantity);
  const primaryImage =
    product.images.find((image) => image.color === color)?.url ??
    product.images[0]?.url ??
    null;

  useEffect(
    () => () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    },
    [],
  );

  function handleAddToCart() {
    if (!selectedVariant || !isAvailable) return;

    const currentQuantity =
      useCartStore
        .getState()
        .lines.find((line) => line.variantId === selectedVariant.id)
        ?.quantity ?? 0;

    if (
      !isVariantAvailable(product.showStock, selectedVariant.stock) ||
      (product.showStock && (selectedVariant.stock ?? 0) <= currentQuantity)
    ) {
      return;
    }

    addLine(
      {
        variantId: selectedVariant.id,
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        imageUrl: primaryImage,
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
    <div className={`flex flex-col ${compact ? "gap-3" : "gap-4"}`}>
      <div>
        <h3 className="text-ink mb-1 text-sm font-semibold">Talle</h3>
        <div className="flex flex-wrap gap-2">
          {sizes.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setSize(value);

                const nextAvailableColors =
                  availableColorsBySize.get(value) ?? [];
                if (nextAvailableColors.includes(color)) return;

                const nextColor = nextAvailableColors[0] ?? "";
                setColor(nextColor);
                if (nextColor) onColorChange?.(nextColor);
              }}
              className={`rounded border px-3 py-1.5 text-sm font-semibold transition-colors ${
                size === value
                  ? "border-deep bg-deep text-white"
                  : "text-ink hover:border-deep border-black/10"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
        <div className={compact ? "mt-1" : "mt-2"}>
          <SizeChart categorySlug={product.category?.slug} />
        </div>
      </div>

      {availableColors.length > 0 ? (
        <div>
          <h3 className="text-ink mb-1 text-sm font-semibold">Color</h3>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setColor(value);
                  onColorChange?.(value);
                }}
                title={value}
                aria-label={`Seleccionar color ${value}`}
                aria-pressed={color === value}
                className={`grid h-9 w-9 place-items-center rounded-full border-2 p-1 transition-[border-color,box-shadow,transform] ${
                  color === value
                    ? "border-deep bg-white shadow-[0_0_0_3px_var(--color-mint)]"
                    : "border-deep/15 hover:border-deep bg-white"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-full w-full rounded-full border border-black/10"
                  style={{ backgroundColor: colorToHex(value) }}
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={handleAddToCart}
          disabled={!selectedVariant || !isAvailable}
          className={`relative overflow-hidden ${
            compact
              ? "product-add-to-cart-button min-h-12 w-fit max-w-full min-w-[210px] !px-6 !py-3.5 !text-sm whitespace-nowrap"
              : "product-add-to-cart-button min-w-[220px]"
          }`}
        >
          <span
            className={`${compact ? "inline-flex items-center justify-center gap-1 whitespace-nowrap" : ""} transition-opacity duration-150 ${
              quantityFeedback !== null ? "opacity-0" : "opacity-100"
            }`}
          >
            <CartIcon
              className={
                compact ? "h-5 w-5 shrink-0" : "h-5 w-5 shrink-0 sm:h-6 sm:w-6"
              }
            />
            {isAvailable ? "Agregar al carrito" : "Sin stock"}
          </span>
          {quantityFeedback !== null ? (
            <span
              key={quantityFeedback}
              className="product-cart-count-pop font-display text-mint absolute inset-0 grid place-items-center text-xl font-black"
            >
              +{quantityFeedback}
            </span>
          ) : null}
        </Button>
        <span className="sr-only" aria-live="polite">
          {quantityFeedback !== null
            ? `${quantityFeedback} unidades en el carrito`
            : ""}
        </span>
      </div>

      {selectedVariant && product.showStock ? (
        <p className="text-muted text-xs">
          Stock: {selectedVariant.stock ?? "No definido"} unidades
        </p>
      ) : null}
    </div>
  );
}
