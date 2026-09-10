import Image from "next/image";
import Link from "next/link";

import { routes } from "elestampadero/shared/config/routes";
import { StoreHeader } from "elestampadero/widgets/store-header";

const ADDRESS = "Paraguay 95, Villa Mercedes, San Luis, Argentina";
const MAP_QUERY = encodeURIComponent(ADDRESS);

const WORKSHOP_PHOTOS = [
  {
    src: "/images/taller-footer-sm.png",
    alt: "Interior del taller El Estampadero",
    className: "col-span-2 row-span-2",
  },
  {
    src: "/images/hero-idea.png",
    alt: "Diseño y trabajo personalizado en el taller",
    className: "col-span-1",
  },
  {
    src: "/images/diseno-camiseta.png",
    alt: "Proceso de estampado de una camiseta",
    className: "col-span-1",
  },
];

export function AboutView() {
  return (
    <div className="bg-paper flex min-h-screen flex-col">
      <StoreHeader />

      <main className="flex-1 px-5 py-[clamp(40px,6vw,96px)] sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-[clamp(28px,4vw,58px)] max-w-4xl">
            <p className="text-mid mb-3 text-xs font-semibold tracking-[0.22em] uppercase sm:text-sm">
              El Estampadero · Villa Mercedes
            </p>
            <h1 className="font-display text-ink text-[clamp(38px,5.4vw,82px)] leading-[0.96] font-black tracking-[-0.035em]">
              Conocé nuestro taller
            </h1>
            <p className="text-muted mt-5 max-w-3xl text-[clamp(17px,1.45vw,24px)] leading-relaxed">
              Un espacio donde las ideas se convierten en prendas. Diseñamos,
              estampamos y preparamos pedidos para clubes, escuelas, empresas y
              equipos de todo el país.
            </p>
          </div>

          <section className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,.95fr)] lg:gap-7">
            <div className="rounded-[clamp(22px,2.2vw,36px)] bg-white p-3 shadow-[0_18px_60px_rgba(46,4,112,.09)] sm:p-4">
              <div className="grid min-h-[480px] grid-cols-2 grid-rows-[minmax(280px,1.7fr)_minmax(150px,1fr)] gap-3 sm:min-h-[590px] sm:gap-4">
                {WORKSHOP_PHOTOS.map((photo) => (
                  <div
                    key={photo.src}
                    className={`brand-card-cut group relative min-h-0 overflow-hidden bg-[#ece9f3] ${photo.className}`}
                  >
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      sizes="(min-width: 1024px) 52vw, 100vw"
                      className="object-cover transition duration-700 ease-out group-hover:scale-[1.025]"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#160332]/30 via-transparent to-transparent opacity-70" />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between gap-4 px-2 pt-4 sm:px-3 sm:pt-5">
                <p className="text-muted text-sm sm:text-base">
                  Diseño propio, producción local y atención cercana.
                </p>
                <span className="text-mid hidden shrink-0 font-mono text-[10px] tracking-[.16em] uppercase sm:block">
                  Desde 2014
                </span>
              </div>
            </div>

            <div className="bg-deep flex flex-col overflow-hidden rounded-[clamp(22px,2.2vw,36px)] p-[clamp(22px,3vw,44px)] text-white shadow-[0_18px_60px_rgba(46,4,112,.18)]">
              <div className="mb-5">
                <p className="text-mint text-xs font-semibold tracking-[0.2em] uppercase sm:text-sm">
                  Vení a visitarnos
                </p>
                <h2 className="font-display mt-3 text-[clamp(28px,3vw,48px)] leading-tight font-black">
                  Estamos acá
                </h2>
                <p className="mt-4 text-[clamp(17px,1.35vw,22px)] leading-relaxed text-white/80">
                  <span className="font-semibold text-white">{ADDRESS}</span>
                  <br />
                  Coordiná tu visita y conocé cómo hacemos realidad tu próximo
                  pedido.
                </p>
              </div>

              <div className="relative mt-auto overflow-hidden rounded-2xl border border-white/15 bg-white/10">
                <iframe
                  title={`Mapa de ${ADDRESS}`}
                  src={`https://www.google.com/maps?q=${MAP_QUERY}&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-[clamp(280px,28vw,430px)] w-full border-0"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#170337]/35 to-transparent" />
              </div>

              <Link
                href={`https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`}
                target="_blank"
                rel="noreferrer"
                className="brand-action border-mint text-mint hover:bg-mint hover:text-deep mt-5 inline-flex w-fit items-center gap-2 border px-4 py-3 text-sm font-semibold"
              >
                Abrir en Google Maps
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </section>

          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-[#ded9e7] pt-6 text-sm text-[#5e5870] sm:text-base">
            <Link
              className="hover:text-mid transition-colors"
              href={routes.catalog}
            >
              Ver catálogo
            </Link>
            <Link
              className="hover:text-mid transition-colors"
              href={routes.specialRequest}
            >
              Pedir un diseño especial
            </Link>
            <a
              className="hover:text-mid transition-colors"
              href="https://wa.me/5492657560737"
              target="_blank"
              rel="noreferrer"
            >
              Escribir por WhatsApp
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
