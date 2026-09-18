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
  const scrollAnimationRef = useRef<number | null>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollControls = useCallback(() => {
    const stores = storesRef.current;
    if (!stores) return;
    setHasOverflow(stores.scrollWidth > stores.clientWidth + 2);
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

  useEffect(
    () => () => {
      if (scrollAnimationRef.current !== null) {
        window.cancelAnimationFrame(scrollAnimationRef.current);
      }
      storesRef.current?.classList.remove("is-scrolling");
    },
    [],
  );

  function scrollStores(direction: -1 | 1) {
    const stores = storesRef.current;
    if (!stores) return;

    if (scrollAnimationRef.current !== null) {
      window.cancelAnimationFrame(scrollAnimationRef.current);
    }

    stores.classList.add("is-scrolling");

    const start = stores.scrollLeft;
    const distance = direction * Math.max(220, stores.clientWidth * 0.72);
    const target = Math.min(
      Math.max(0, start + distance),
      stores.scrollWidth - stores.clientWidth,
    );

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      stores.scrollLeft = target;
      stores.classList.remove("is-scrolling");
      updateScrollControls();
      return;
    }

    const duration = 760;
    const startedAt = performance.now();
    const easeInOutQuart = (progress: number) =>
      progress < 0.5
        ? 8 * progress * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 4) / 2;

    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      stores.scrollLeft = start + (target - start) * easeInOutQuart(progress);

      if (progress < 1) {
        scrollAnimationRef.current = window.requestAnimationFrame(animate);
      } else {
        scrollAnimationRef.current = null;
        stores.classList.remove("is-scrolling");
        updateScrollControls();
      }
    };

    scrollAnimationRef.current = window.requestAnimationFrame(animate);
  }

  if (!clubs.length) return null;

  return (
    <section className="club-store-hero catalog-club-stores-banner relative overflow-hidden text-white">
      <div className="club-store-hero__pattern" aria-hidden="true" />
      <Container className="catalog-club-stores-container relative z-10">
        <span className="catalog-club-stores-watermark" aria-hidden="true">
          Instituciones
        </span>
        <div className="catalog-club-stores-heading">
          <div className="catalog-club-stores-eyebrow">
            <span className="text-mint font-mono font-bold uppercase">
              Tiendas oficiales
            </span>
            <i aria-hidden="true" />
          </div>
          <h1 className="font-display font-black">
            ENCONTRA LA TIENDA DE TU INSTITUCION
          </h1>
          <p>
            Elegí una institución para descubrir su indumentaria y productos
            oficiales.
          </p>
        </div>

        <div
          className={`catalog-club-stores-shell ${hasOverflow ? "has-overflow" : ""}`}
        >
          <button
            type="button"
            className="catalog-club-stores-arrow catalog-club-stores-arrow--previous"
            aria-label="Ver tiendas anteriores"
            disabled={!canScrollLeft}
            onClick={() => scrollStores(-1)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path
                d="m15 18-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div
            ref={storesRef}
            className={`catalog-club-stores ${clubs.length > 4 ? "is-carousel" : ""}`}
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
                  aria-label={`${club.name}, ${club.productCount} producto${club.productCount === 1 ? "" : "s"}`}
                  className={`catalog-club-store-card ${isActive ? "is-active" : ""}`}
                >
                  {branding.bannerUrl ? (
                    <span
                      className="catalog-club-store-card__background"
                      aria-hidden="true"
                    >
                      <Image
                        src={branding.bannerUrl}
                        alt=""
                        fill
                        sizes="220px"
                        className="object-cover"
                      />
                    </span>
                  ) : null}
                  <span
                    className="catalog-club-store-card__shade"
                    aria-hidden="true"
                  />
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
                    <em>
                      {club.productCount} producto
                      {club.productCount === 1 ? "" : "s"}
                    </em>
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
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path
                d="m9 6 6 6-6 6"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </Container>
    </section>
  );
}
