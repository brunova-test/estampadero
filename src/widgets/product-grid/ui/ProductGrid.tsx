"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import { AnimatePresence, m } from "motion/react";
import { useState } from "react";

import { ProductCard } from "elestampadero/entities/product";
import type { ProductSummary } from "elestampadero/entities/product";

import { ProductQuickViewModal } from "./ProductQuickViewModal";

interface ProductGridProps {
  products: ProductSummary[];
  className?: string;
}

export function ProductGrid({ products, className = "" }: ProductGridProps) {
  const [gridRef] = useAutoAnimate<HTMLDivElement>({
    duration: 360,
    easing: "cubic-bezier(.22,1,.36,1)",
  });
  const [selectedProduct, setSelectedProduct] = useState<ProductSummary | null>(
    null,
  );

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
        ref={gridRef}
        className={`catalog-product-grid grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 ${className}`}
      >
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onOpen={() => setSelectedProduct(product)}
          />
        ))}
      </div>

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
