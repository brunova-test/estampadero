"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { getClubStoreBranding } from "elestampadero/shared/config/club-store-branding";
import { routes } from "elestampadero/shared/config/routes";
import { Container } from "elestampadero/shared/ui";

interface CatalogClubStore {
  slug: string;
  name: string;
  sport: string | null;
  logoUrl: string | null;
  productCount: number;
}

export function CatalogClubStores({
  clubs,
  activeClub,
}: {
  clubs: CatalogClubStore[];
  activeClub?: string;
}) {
  const storesRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollControls = useCallback(() => {
    const stores = storesRef.current;
    if (!stores) return;
    setCanScrollLeft(stores.scrollLeft > 2);
    setCanScrollRight(
      stores.scrollLeft + stores.clientWidth < stores.scrollWidth - 2,
    );
  }, []);

  useEffect(() => {
    updateScrollControls();
    const stores = storesRef.current;
    if (!stores) return;

    const observer = new ResizeObserver(updateScrollControls);
    observer.observe(stores);
    window.addEventListener("resize", updateScrollControls);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScrollControls);
    };
  }, [clubs, updateScrollControls]);

  function scrollStores(direction: -1 | 1) {
    const stores = storesRef.current;
    if (!stores) return;
    stores.scrollBy({
      left: direction * Math.max(220, stores.clientWidth * 0.72),
      behavior: "smooth",
    });
  }

  if (!clubs.length) return null;

  return (
    <section className="club-store-hero bg-ink relative overflow-hidden text-white">
      <div className="club-store-hero__pattern" aria-hidden="true" />
      <Container className="relative z-10 py-4 sm:py-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <span className="text-mint font-mono text-xs font-medium tracking-[.1em] uppercase sm:text-sm">
              Tiendas oficiales
            </span>
            <h1 className="font-display mt-1 text-xl leading-none font-black sm:text-2xl lg:text-3xl">
              Encontrá la tienda de tu club
            </h1>
          </div>
          <p className="max-w-md text-xs leading-4 text-white/65 sm:text-right">
            Elegí una institución para ver toda su indumentaria y productos
            oficiales.
          </p>
        </div>

        <div className="catalog-club-stores-shell">
          <button
            type="button"
            className="catalog-club-stores-arrow catalog-club-stores-arrow--previous"
            aria-label="Ver tiendas anteriores"
            disabled={!canScrollLeft}
            onClick={() => scrollStores(-1)}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <div
            ref={storesRef}
            className="catalog-club-stores"
            role="list"
            onScroll={updateScrollControls}
          >
            {clubs.map((club) => {
              const isActive = activeClub === club.slug;
              const branding = getClubStoreBranding(club.slug);
              return (
                <Link
                  key={club.slug}
                  role="listitem"
                  href={routes.clubStore(club.slug)}
                  aria-current={isActive ? "page" : undefined}
                  className={`catalog-club-store-card ${isActive ? "is-active" : ""}`}
                >
                  <span className="catalog-club-store-card__logo">
                    <Image
                      src={
                        branding.logoUrl ??
                        club.logoUrl ??
                        "/images/linea-club.png"
                      }
                      alt=""
                      fill
                      sizes="84px"
                      className="catalog-club-store-card__logo-image object-contain"
                    />
                  </span>
                  <span className="catalog-club-store-card__copy">
                    <strong>{club.name}</strong>
                    <small>{club.sport ?? "Institución asociada"}</small>
                    <em>
                      {club.productCount} producto
                      {club.productCount === 1 ? "" : "s"}
                    </em>
                  </span>
                  <span className="catalog-club-store-card__action">
                    Ver indumentaria <span aria-hidden="true">→</span>
                  </span>
                </Link>
              );
            })}
          </div>
          <button
            type="button"
            className="catalog-club-stores-arrow catalog-club-stores-arrow--next"
            aria-label="Ver más tiendas"
            disabled={!canScrollRight}
            onClick={() => scrollStores(1)}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </Container>
    </section>
  );
}
