"use client";

import { useRouter } from "next/navigation";
import { m } from "motion/react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import type { ProductSummary } from "elestampadero/entities/product";
import { ProductFilters } from "elestampadero/widgets/product-filters";
import { ProductGrid } from "elestampadero/widgets/product-grid";

const PRODUCTS_PER_PAGE = 12;

type CatalogSort = "NEWEST" | "PRICE_ASC" | "PRICE_DESC" | "NAME_ASC";

const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: "NEWEST", label: "Más nuevos" },
  { value: "PRICE_ASC", label: "Menor precio" },
  { value: "PRICE_DESC", label: "Mayor precio" },
  { value: "NAME_ASC", label: "Nombre A-Z" },
];

interface CatalogExplorerProps {
  products: ProductSummary[];
  categories: { slug: string; name: string }[];
  clubs?: { slug: string; name: string; logoUrl: string | null }[];
  activeCategory?: string;
  activeLine?: string;
  activeClub?: string;
  activeSearch?: string;
  basePath?: string;
  showProductCount?: boolean;
  showInstitutionFilter?: boolean;
  liftSortControl?: boolean;
}

export function CatalogExplorer({
  products,
  categories,
  clubs = [],
  activeCategory,
  activeLine,
  activeClub,
  activeSearch,
  basePath,
  showProductCount = true,
  showInstitutionFilter = false,
  liftSortControl = false,
}: CatalogExplorerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState<CatalogSort>("NEWEST");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const optimisticFilters =
    isPending && pendingHref
      ? new URL(pendingHref, "http://catalogo.local").searchParams
      : null;
  const displayedCategory = optimisticFilters
    ? (optimisticFilters.get("categoria") ?? undefined)
    : activeCategory;
  const displayedLine = optimisticFilters
    ? (optimisticFilters.get("linea") ?? undefined)
    : activeLine;
  const sortedProducts = useMemo(() => {
    return [...products].sort((left, right) => {
      switch (sort) {
        case "PRICE_ASC":
          return left.priceInCents - right.priceInCents;
        case "PRICE_DESC":
          return right.priceInCents - left.priceInCents;
        case "NAME_ASC":
          return left.name.localeCompare(right.name, "es");
        case "NEWEST":
        default:
          return right.createdAt.getTime() - left.createdAt.getTime();
      }
    });
  }, [products, sort]);
  const pageCount = Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE);
  const visibleProducts = sortedProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [products, activeCategory, activeLine, activeClub, sort]);

  useEffect(() => {
    if (!isSortOpen) return;

    function closeSortMenu(event: PointerEvent) {
      if (!sortMenuRef.current?.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }

    function closeSortMenuWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsSortOpen(false);
    }

    document.addEventListener("pointerdown", closeSortMenu);
    document.addEventListener("keydown", closeSortMenuWithEscape);

    return () => {
      document.removeEventListener("pointerdown", closeSortMenu);
      document.removeEventListener("keydown", closeSortMenuWithEscape);
    };
  }, [isSortOpen]);

  function handleFilterNavigation(href: string) {
    if (isPending) return;
    setPendingHref(href);
    startTransition(() => router.push(href, { scroll: false }));
  }

  return (
    <div className="catalog-explorer catalog-explorer--scaled flex flex-col gap-8 lg:flex-row">
      <ProductFilters
        categories={categories}
        clubs={clubs}
        activeCategory={displayedCategory}
        activeLine={displayedLine}
        activeClub={activeClub}
        activeSearch={activeSearch}
        pendingHref={isPending ? pendingHref : null}
        basePath={basePath}
        showInstitutionFilter={showInstitutionFilter}
        onNavigate={handleFilterNavigation}
      />

      <section
        aria-busy={isPending}
        className="catalog-products relative isolate min-h-[320px] min-w-0 flex-1"
      >
        <div
          className={`catalog-products-meta text-muted z-[100] flex flex-wrap items-center gap-3 text-base ${
            showProductCount
              ? "relative mb-5 justify-between"
              : liftSortControl
                ? "relative mb-4 justify-end md:absolute md:-top-[4.65rem] md:right-0 md:mb-0"
                : "relative mb-5 justify-end"
          }`}
        >
          {showProductCount ? (
            <p className="catalog-products-count">
              {products.length} producto{products.length === 1 ? "" : "s"}
            </p>
          ) : null}
          <div
            ref={sortMenuRef}
            className="catalog-sort-control relative min-w-44"
          >
            <button
              type="button"
              onClick={() => setIsSortOpen((isOpen) => !isOpen)}
              className="border-deep/15 text-ink hover:border-deep/35 focus-visible:ring-deep/25 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border bg-white px-4 py-2 font-semibold shadow-sm transition focus-visible:ring-2 focus-visible:outline-none"
              aria-label="Ordenar productos"
              aria-haspopup="menu"
              aria-expanded={isSortOpen}
              aria-controls="catalog-sort-menu"
            >
              <span>
                {SORT_OPTIONS.find((option) => option.value === sort)?.label}
              </span>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className={`h-4 w-4 shrink-0 transition-transform ${
                  isSortOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="m6 8 4 4 4-4" />
              </svg>
            </button>

            {isSortOpen ? (
              <div
                id="catalog-sort-menu"
                role="menu"
                aria-label="Ordenar productos"
                className="border-deep/15 text-ink absolute top-[calc(100%+0.4rem)] right-0 z-[110] w-full min-w-max overflow-hidden rounded-lg border bg-white py-1 shadow-xl"
              >
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={sort === option.value}
                    onClick={() => {
                      setSort(option.value);
                      setIsSortOpen(false);
                    }}
                    className={`hover:bg-paper focus-visible:bg-paper block w-full px-4 py-2 text-left whitespace-nowrap transition-colors outline-none ${
                      sort === option.value ? "bg-deep text-white" : ""
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <m.div
          className="relative z-0"
        >
          <ProductGrid products={visibleProducts} />
          {pageCount > 1 ? (
            <nav
              className="mt-8 flex flex-wrap items-center justify-center gap-2"
              aria-label="Paginación de productos"
            >
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="border-deep/20 text-deep hover:border-deep hover:bg-paper min-h-10 border px-3 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                (page) => (
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
                ),
              )}
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
        </m.div>
      </section>
    </div>
  );
}
