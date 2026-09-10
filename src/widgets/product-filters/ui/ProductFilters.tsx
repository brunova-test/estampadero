"use client";

import Link from "next/link";
import type { FormEvent, MouseEvent, ReactNode } from "react";
import { useState } from "react";

import { routes } from "elestampadero/shared/config/routes";

const LINES = [
  { label: "Club", value: "CLUB" },
  { label: "Urbana", value: "URBANA" },
  { label: "Training", value: "TRAINING" },
  { label: "Trabajo", value: "TRABAJO" },
  { label: "Escolar", value: "ESCOLAR" },
];

interface ProductFiltersProps {
  categories: { slug: string; name: string }[];
  activeCategory?: string;
  activeLine?: string;
  activeClub?: string;
  activeSearch?: string;
  pendingHref?: string | null;
  basePath?: string;
  onNavigate: (href: string) => void;
}

function buildHref(
  params: Record<string, string | undefined>,
  basePath: string = routes.catalog,
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function PendingFilterLink({
  href,
  className,
  children,
  isPending,
  onNavigate,
}: {
  href: string;
  className: string;
  children: ReactNode;
  isPending: boolean;
  onNavigate: (href: string) => void;
}) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    if (isPending) return;
    onNavigate(href);
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      aria-busy={isPending || undefined}
      aria-disabled={isPending || undefined}
      className={`${className} ${isPending ? "pointer-events-none opacity-65" : ""}`}
    >
      <span className="inline-flex items-center gap-2">
        {isPending ? (
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/25 border-t-current"
          />
        ) : null}
        {isPending ? "Actualizando" : children}
      </span>
    </Link>
  );
}

export function ProductFilters({
  categories,
  activeCategory,
  activeLine,
  activeClub,
  activeSearch,
  pendingHref = null,
  basePath = routes.catalog,
  onNavigate,
}: ProductFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const searchValue = form.get("q");
    const search = typeof searchValue === "string" ? searchValue.trim() : "";
    onNavigate(
      buildHref(
        {
          categoria: activeCategory,
          linea: activeLine,
          club: activeClub,
          q: search || undefined,
        },
        basePath,
      ),
    );
  }

  return (
    <aside className="catalog-filters shrink-0 lg:w-64">
      <div className="bg-ink -mx-4 px-4 pt-5 pb-5 text-white sm:-mx-6 sm:px-6 lg:hidden">
        <div className="flex gap-2.5">
          <form onSubmit={handleSearch} className="relative min-w-0 flex-1">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="text-muted absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" />
            </svg>
            <input
              type="search"
              name="q"
              defaultValue={activeSearch}
              placeholder="Buscar productos..."
              aria-label="Buscar productos"
              className="text-ink focus:ring-mint h-12 w-full rounded-xl bg-white pr-3 pl-11 text-sm outline-none placeholder:text-gray-500 focus:ring-2"
            />
          </form>
          <button
            type="button"
            onClick={() => setMobileOpen((current) => !current)}
            aria-expanded={mobileOpen}
            className="text-ink inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 6h16M7 12h10M10 18h4" />
              <circle cx="8" cy="6" r="1.5" fill="currentColor" />
              <circle cx="15" cy="12" r="1.5" fill="currentColor" />
              <circle cx="12" cy="18" r="1.5" fill="currentColor" />
            </svg>
            Filtros
          </button>
        </div>

        <nav
          aria-label="Categorías rápidas"
          className="catalog-quick-filters mt-4 flex gap-2.5 overflow-x-auto pb-0.5"
        >
          <PendingFilterLink
            href={buildHref({ club: activeClub, q: activeSearch }, basePath)}
            isPending={
              pendingHref ===
              buildHref({ club: activeClub, q: activeSearch }, basePath)
            }
            onNavigate={onNavigate}
            className={`shrink-0 rounded-lg border px-5 py-2 text-sm font-semibold ${
              !activeCategory
                ? "border-deep bg-deep text-white"
                : "border-white/35 text-white"
            }`}
          >
            Todos
          </PendingFilterLink>
          {categories.map((category) => (
            <PendingFilterLink
              key={category.slug}
              href={buildHref(
                {
                  categoria: category.slug,
                  linea: activeLine,
                  club: activeClub,
                  q: activeSearch,
                },
                basePath,
              )}
              isPending={
                pendingHref ===
                buildHref(
                  {
                    categoria: category.slug,
                    linea: activeLine,
                    club: activeClub,
                    q: activeSearch,
                  },
                  basePath,
                )
              }
              onNavigate={onNavigate}
              className={`shrink-0 rounded-lg border px-5 py-2 text-sm font-semibold ${
                activeCategory === category.slug
                  ? "border-deep bg-deep text-white"
                  : "border-white/35 text-white"
              }`}
            >
              {category.name}
            </PendingFilterLink>
          ))}
        </nav>
      </div>

      <div
        className={`${mobileOpen ? "block" : "hidden"} border-deep/10 mt-3 rounded-2xl border bg-white p-4 shadow-[0_16px_40px_-30px_rgba(46,4,112,.5)] sm:p-5 lg:mt-0 lg:block`}
      >
        <div className="border-deep/10 mb-5 flex items-center justify-between gap-3 border-b pb-4">
          <h2 className="font-display text-ink text-xl font-black tracking-tight sm:text-2xl">
            Filtrar
          </h2>
          <PendingFilterLink
            href={buildHref({ club: activeClub }, basePath)}
            isPending={
              pendingHref === buildHref({ club: activeClub }, basePath)
            }
            onNavigate={onNavigate}
            className="border-deep/15 text-deep hover:border-mint hover:bg-mint hover:text-deep rounded-full border px-3 py-1.5 text-xs font-bold transition-[color,background-color,border-color,transform] duration-300 hover:-translate-y-0.5"
          >
            Limpiar todo
          </PendingFilterLink>
        </div>

        <h3 className="text-muted mb-2 text-xs font-bold tracking-[.12em] uppercase">
          Categoría
        </h3>
        <ul className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
          {categories.map((category) => (
            <li key={category.slug}>
              <PendingFilterLink
                href={buildHref(
                  {
                    categoria: category.slug,
                    linea: activeLine,
                    club: activeClub,
                  },
                  basePath,
                )}
                isPending={
                  pendingHref ===
                  buildHref(
                    {
                      categoria: category.slug,
                      linea: activeLine,
                      club: activeClub,
                    },
                    basePath,
                  )
                }
                onNavigate={onNavigate}
                className={`group flex min-h-11 items-center rounded-xl border px-3 py-2.5 text-sm font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 ${
                  activeCategory === category.slug
                    ? "border-deep bg-deep text-white shadow-[0_9px_20px_-13px_rgba(46,4,112,.85)]"
                    : "border-deep/10 bg-paper/55 text-ink hover:border-mint hover:bg-mint/20 hover:shadow-[0_9px_20px_-15px_rgba(46,4,112,.55)]"
                }`}
              >
                {category.name}
              </PendingFilterLink>
            </li>
          ))}
        </ul>

        <h3 className="text-muted mb-2 text-xs font-bold tracking-[.12em] uppercase">
          Línea
        </h3>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
          {LINES.map((line) => (
            <li key={line.value}>
              <PendingFilterLink
                href={buildHref(
                  {
                    categoria: activeCategory,
                    linea: line.value,
                    club: activeClub,
                  },
                  basePath,
                )}
                isPending={
                  pendingHref ===
                  buildHref(
                    {
                      categoria: activeCategory,
                      linea: line.value,
                      club: activeClub,
                    },
                    basePath,
                  )
                }
                onNavigate={onNavigate}
                className={`group flex min-h-11 items-center rounded-xl border px-3 py-2.5 text-sm font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 ${
                  activeLine === line.value
                    ? "border-deep bg-deep text-white shadow-[0_9px_20px_-13px_rgba(46,4,112,.85)]"
                    : "border-deep/10 bg-paper/55 text-ink hover:border-mint hover:bg-mint/20 hover:shadow-[0_9px_20px_-15px_rgba(46,4,112,.55)]"
                }`}
              >
                {line.label}
              </PendingFilterLink>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
