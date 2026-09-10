"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { routes } from "elestampadero/shared/config/routes";
import { RevealGroup } from "elestampadero/shared/ui/motion";

const CLUBS = [
  {
    name: "Club Atlético",
    subtitle: "Fútbol · Masculino y femenino",
    image: "/images/club-futbol.png",
    tags: ["12 productos", "Entrega 10 días"],
    slug: "club-atletico",
  },
  {
    name: "Escuela N°14",
    subtitle: "Escolar · Nivel primario",
    image: "/images/club-escuela.png",
    tags: ["8 productos", "Talles 4 a 16"],
    slug: "escuela-n14",
  },
  {
    name: "Vóley Norte",
    subtitle: "Vóley · Todas las categorías",
    image: "/images/club-voley.png",
    tags: ["15 productos", "Envío a todo el país"],
    slug: "voley-norte",
  },
  {
    name: "Rugby Sur",
    subtitle: "Rugby · Juveniles y plantel",
    image: "/images/club-rugby.png",
    tags: ["6 productos", "Camiseta y buzo"],
    slug: "rugby-sur",
  },
];

export function ClubsShowcase() {
  const [search, setSearch] = useState("");
  const filteredClubs = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("es");
    if (!normalizedSearch) return CLUBS;
    return CLUBS.filter((club) =>
      `${club.name} ${club.subtitle}`
        .toLocaleLowerCase("es")
        .includes(normalizedSearch),
    );
  }, [search]);

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
        <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-[clamp(16px,1.4vw,28px)]">
          {filteredClubs.map((club) => (
            <Link
              key={club.slug}
              href={`${routes.catalog}?club=${club.slug}`}
              className="brand-card-cut group flex min-h-0 flex-row items-center justify-start gap-4 bg-white/[.07] p-5 text-left transition-colors hover:bg-white/[.11] md:min-h-[clamp(430px,32vw,640px)] md:flex-col md:justify-center md:gap-[clamp(12px,1vw,20px)] md:p-[clamp(18px,1.4vw,28px)] md:text-center"
            >
              <div className="relative h-16 w-16 shrink-0 md:h-[clamp(150px,10.5vw,210px)] md:w-[clamp(150px,10.5vw,210px)]">
                <Image
                  src={club.image}
                  alt=""
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col items-start gap-1 md:flex-none md:items-center md:gap-2">
                <h3 className="font-display text-lg font-extrabold md:text-[clamp(27px,2vw,40px)]">
                  {club.name}
                </h3>
                <p className="text-[13px] text-[#a99fc4] md:text-[clamp(17px,1.3vw,26px)]">
                  {club.subtitle}
                </p>
              </div>
              <div className="hidden flex-wrap justify-center gap-2.5 md:flex">
                {club.tags.map((tag, index) => (
                  <span
                    key={tag}
                    className={`px-[clamp(10px,.9vw,18px)] py-[clamp(6px,.4vw,8px)] text-[clamp(14px,1.2vw,24px)] font-semibold ${
                      index === 0
                        ? "bg-mint/15 text-mint"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <span className="text-mint hidden text-[clamp(16px,1.3vw,26px)] font-semibold group-hover:underline md:block">
                Ver tienda ›
              </span>
            </Link>
          ))}
        </RevealGroup>
      ) : (
        <div className="home-clubs-empty">
          No encontramos ese club. Probá con otro nombre.
        </div>
      )}
    </section>
  );
}
