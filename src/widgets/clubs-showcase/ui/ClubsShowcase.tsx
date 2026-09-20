"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { routes } from "elestampadero/shared/config/routes";

interface ClubShowcaseItem {
  slug: string;
  name: string;
  sport: string | null;
  description: string | null;
  logoUrl: string | null;
  productCount: number;
}

export function ClubsShowcase({ clubs }: { clubs: ClubShowcaseItem[] }) {
  const [search, setSearch] = useState("");
  const clubsViewportRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const filteredClubs = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("es");
    if (!normalizedSearch) return clubs;
    return clubs.filter((club) =>
      `${club.name} ${club.sport ?? ""} ${club.description ?? ""}`
        .toLocaleLowerCase("es")
        .includes(normalizedSearch),
    );
  }, [clubs, search]);

  const updateOverflow = useCallback(() => {
    const viewport = clubsViewportRef.current;
    if (!viewport) return;
    setHasOverflow(viewport.scrollWidth > viewport.clientWidth + 2);
  }, []);

  useEffect(() => {
    updateOverflow();
    const viewport = clubsViewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(viewport);
    window.addEventListener("resize", updateOverflow);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateOverflow);
    };
  }, [filteredClubs, updateOverflow]);

  function scrollClubs(direction: -1 | 1) {
    const viewport = clubsViewportRef.current;
    if (!viewport) return;

    const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
    const atEnd = direction === 1 && viewport.scrollLeft >= maxScrollLeft - 4;
    const atStart = direction === -1 && viewport.scrollLeft <= 4;

    if (atEnd) {
      viewport.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    if (atStart) {
      viewport.scrollTo({ left: maxScrollLeft, behavior: "smooth" });
      return;
    }

    viewport.scrollBy({
      left: direction * Math.max(280, viewport.clientWidth * 0.8),
      behavior: "smooth",
    });
  }

  return (
    <section
      id="clubes"
      className="bg-ink flex scroll-mt-0 flex-col gap-5 px-5 py-9 text-white sm:px-8 md:gap-[clamp(28px,2vw,40px)] md:px-[clamp(40px,4vw,80px)] md:py-[clamp(36px,2.8vw,56px)]"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex max-w-[1100px] flex-col gap-[clamp(10px,.9vw,18px)]">
          <span className="text-mint font-mono text-[13px] font-medium uppercase md:text-[clamp(15px,1.3vw,26px)]">
            Clubes e instituciones
          </span>
          <h2 className="font-display text-[28px] leading-[1.05] font-black md:text-[clamp(40px,3.3vw,66px)] md:leading-[1.02]">
            Comprá la indumentaria oficial de tu club
          </h2>
          <p className="text-[15px] leading-[1.35] text-[#c9c0e0] md:text-[clamp(19px,1.5vw,30px)]">
            Cada compra deja un porcentaje para la institución.
          </p>
        </div>
        <Link
          href={routes.joinClub}
          data-variant="mint"
          className="brand-action bg-mint text-deep px-[clamp(24px,2.2vw,44px)] py-[clamp(14px,1.1vw,22px)] text-center text-[clamp(17px,1.4vw,28px)] font-bold whitespace-nowrap"
        >
          Sumar mi club
        </Link>
      </div>

      <div className="home-clubs-search">
        <label htmlFor="home-club-search">Buscá tu club</label>
        <div className="home-clubs-search__field">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <input
            id="home-club-search"
            type="text"
            className="home-clubs-search-input"
            autoComplete="off"
            aria-label="Buscar club"
            value={search}
            placeholder="Escribí el nombre de tu club..."
            onChange={(event) => setSearch(event.target.value)}
          />
          {search ? (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={() => setSearch("")}
            >
              ×
            </button>
          ) : null}
        </div>
        <span>{filteredClubs.length} instituciones disponibles</span>
      </div>

      {filteredClubs.length ? (
        <div
          className={`home-clubs-carousel ${hasOverflow ? "has-overflow" : ""}`}
        >
          <button
            type="button"
            className="home-clubs-arrow home-clubs-arrow--previous"
            aria-label="Ver instituciones anteriores"
            disabled={!hasOverflow}
            onClick={() => scrollClubs(-1)}
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
          <div ref={clubsViewportRef} className="home-clubs-viewport">
            <div className="home-clubs-list">
              {filteredClubs.map((club) => (
                <article
                  key={club.slug}
                  className="home-club-showcase-card brand-card-cut group flex min-h-0 flex-col gap-4 bg-white/[.07] p-4 text-left transition-colors hover:bg-white/[.11] sm:p-5 md:justify-center md:gap-[clamp(12px,1vw,20px)] md:p-[clamp(18px,1.4vw,28px)] md:text-center"
                >
                  <div className="flex flex-row items-center gap-4 md:flex-col md:gap-[clamp(12px,1vw,20px)]">
                    <div className="relative h-14 w-14 shrink-0 md:h-[clamp(150px,10.5vw,210px)] md:w-[clamp(150px,10.5vw,210px)]">
                      <Image
                        src={club.logoUrl ?? "/images/linea-club.png"}
                        alt=""
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col items-start gap-1 md:flex-none md:items-center md:gap-2">
                      <h3 className="font-display text-base leading-tight font-extrabold md:text-[clamp(27px,2vw,40px)]">
                        {club.name}
                      </h3>
                      <p className="truncate text-[13px] text-[#a99fc4] md:text-[clamp(17px,1.3vw,26px)]">
                        {club.sport ?? "Institución asociada"}
                      </p>
                    </div>
                  </div>
                  <div className="hidden flex-wrap justify-center gap-2.5 md:flex">
                    <span className="bg-mint/15 text-mint px-[clamp(10px,.9vw,18px)] py-[clamp(6px,.4vw,8px)] text-[clamp(14px,1.2vw,24px)] font-semibold">
                      {club.productCount} producto
                      {club.productCount === 1 ? "" : "s"}
                    </span>
                    <span className="bg-white/10 px-[clamp(10px,.9vw,18px)] py-[clamp(6px,.4vw,8px)] text-[clamp(14px,1.2vw,24px)] font-semibold text-white">
                      Tienda oficial
                    </span>
                  </div>
                  <div className="flex items-center gap-2 md:flex-col">
                    <Link
                      href={routes.clubProfile(club.slug)}
                      className="hidden text-sm font-semibold text-white/75 hover:text-white hover:underline md:block"
                    >
                      Ver perfil
                    </Link>
                    <Link
                      href={routes.clubStore(club.slug)}
                      className="bg-mint text-deep flex min-h-10 w-full items-center justify-center px-4 text-sm font-extrabold transition-transform hover:-translate-y-0.5 md:min-h-12 md:w-auto md:px-6 md:text-base"
                    >
                      Ir a la tienda
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="home-clubs-arrow home-clubs-arrow--next"
            aria-label="Ver más instituciones"
            disabled={!hasOverflow}
            onClick={() => scrollClubs(1)}
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
      ) : (
        <div className="home-clubs-empty">
          No encontramos ese club. Probá con otro nombre.
        </div>
      )}
    </section>
  );
}
