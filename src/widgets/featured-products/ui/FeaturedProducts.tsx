"use client";

import { AnimatePresence, m } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ProductSummary } from "elestampadero/entities/product";
import { ProductGrid } from "elestampadero/widgets/product-grid";

const TABS = [
  { label: "Más vendidos", key: "bestSellers" },
  { label: "Novedades", key: "newArrivals" },
  { label: "Con estampado", key: "printableProducts" },
] as const;

interface FeaturedProductsProps {
  bestSellers: ProductSummary[];
  newArrivals: ProductSummary[];
  printableProducts: ProductSummary[];
}

export function FeaturedProducts({
  bestSellers,
  newArrivals,
  printableProducts,
}: FeaturedProductsProps) {
  const [activeTab, setActiveTab] = useState(0);
  const productsViewportRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const productCollections = {
    bestSellers,
    newArrivals,
    printableProducts,
  };
  const activeTabConfig = TABS[activeTab] ?? TABS[0];
  const activeProducts = productCollections[activeTabConfig.key];

  const updateOverflow = useCallback(() => {
    const viewport = productsViewportRef.current;
    if (!viewport) return;
    setHasOverflow(viewport.scrollWidth > viewport.clientWidth + 2);
  }, []);

  useEffect(() => {
    updateOverflow();
    const viewport = productsViewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(viewport);
    window.addEventListener("resize", updateOverflow);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateOverflow);
    };
  }, [activeProducts, updateOverflow]);

  function scrollProducts(direction: -1 | 1) {
    productsViewportRef.current?.scrollBy({
      left:
        direction *
        Math.max(260, productsViewportRef.current.clientWidth * 0.8),
      behavior: "smooth",
    });
  }

  return (
    <section className="flex flex-col gap-[18px] border-t border-[#eee] bg-white px-5 py-9 sm:px-8 md:gap-[clamp(24px,1.8vw,36px)] md:border-0 md:px-[clamp(40px,4vw,80px)] md:py-[clamp(36px,2.8vw,56px)]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="font-display text-[28px] leading-none font-black md:text-[clamp(34px,2.8vw,56px)]">
          Destacados de la semana
        </h2>
        <div
          role="tablist"
          aria-label="Filtrar productos destacados"
          className="text-muted flex max-w-full flex-nowrap items-center gap-x-[18px] overflow-x-auto font-mono text-[13px] font-bold uppercase md:flex-wrap md:gap-x-[clamp(16px,1.4vw,28px)] md:gap-y-2 md:overflow-visible md:font-sans md:text-[clamp(16px,1.3vw,26px)] md:normal-case"
        >
          {TABS.map((tab, index) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              onClick={() => setActiveTab(index)}
              aria-selected={activeTab === index}
              className={
                activeTab === index
                  ? "featured-products-tab text-blue scale-[1.04] py-1 whitespace-nowrap"
                  : "featured-products-tab hover:text-blue py-1 whitespace-nowrap"
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={activeTabConfig.key}
          role="tabpanel"
          aria-live="polite"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.34 }}
        >
          <div
            className={`featured-products-carousel ${hasOverflow ? "has-overflow" : ""}`}
          >
            <button
              type="button"
              className="featured-products-arrow featured-products-arrow--previous"
              aria-label="Ver productos anteriores"
              disabled={!hasOverflow}
              onClick={() => scrollProducts(-1)}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                <path
                  d="m15 18-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div
              ref={productsViewportRef}
              className="featured-products-viewport"
            >
              <ProductGrid
                products={activeProducts}
                className="featured-products-grid"
              />
            </div>
            <button
              type="button"
              className="featured-products-arrow featured-products-arrow--next"
              aria-label="Ver más productos"
              disabled={!hasOverflow}
              onClick={() => scrollProducts(1)}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                <path
                  d="m9 6 6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </m.div>
      </AnimatePresence>
    </section>
  );
}
