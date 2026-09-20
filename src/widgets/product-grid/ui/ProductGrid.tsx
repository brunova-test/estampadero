"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import { AnimatePresence, m } from "motion/react";
import { useEffect, useId, useState } from "react";

import { ProductCard } from "elestampadero/entities/product";
import type { ProductSummary } from "elestampadero/entities/product";

import { ProductQuickViewModal } from "./ProductQuickViewModal";

interface ProductGridProps {
  products: ProductSummary[];
  className?: string;
  mobileExpandable?: boolean;
}

export function ProductGrid({
  products,
  className = "",
  mobileExpandable = false,
}: ProductGridProps) {
  const [gridRef] = useAutoAnimate<HTMLDivElement>({
    duration: 360,
    easing: "cubic-bezier(.22,1,.36,1)",
  });
  const [selectedProduct, setSelectedProduct] = useState<ProductSummary | null>(
    null,
  );
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const gridId = useId();
  const productIds = products.map((product) => product.id).join(",");

  useEffect(() => {
    setMobileExpanded(false);
  }, [productIds]);

  if (products.length === 0) {
    return (
      <div className="text-muted rounded-lg border border-dashed border-black/10 p-12 text-center">
        No encontramos productos con estos filtros.
      </div>
    );
  }

  return (
    <>
      <div
        id={gridId}
        ref={gridRef}
        data-mobile-expanded={!mobileExpandable || mobileExpanded}
        className={`catalog-product-grid grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 ${className}`}
      >
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onOpen={() => setSelectedProduct(product)}
          />
        ))}
      </div>

      {mobileExpandable && products.length > 4 ? (
        <button
          type="button"
          className="catalog-products-more"
          aria-controls={gridId}
          aria-expanded={mobileExpanded}
          onClick={() => setMobileExpanded((expanded) => !expanded)}
        >
          <span>{mobileExpanded ? "Ver menos" : "Ver más"}</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
            <path
              d="m6 9 6 6 6-6"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : null}

      <AnimatePresence>
        {selectedProduct ? (
          <m.div
            key={selectedProduct.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ProductQuickViewModal
              product={selectedProduct}
              open
              onClose={() => setSelectedProduct(null)}
            />
          </m.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
