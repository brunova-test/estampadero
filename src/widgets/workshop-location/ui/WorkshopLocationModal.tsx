"use client";

import Image from "next/image";
import { AnimatePresence, m } from "motion/react";
import { useEffect, useState } from "react";

const ADDRESS = "Paraguay 95, Villa Mercedes, San Luis, Argentina";
const MAP_QUERY = encodeURIComponent(ADDRESS);

const WORKSHOP_PHOTOS = [
  {
    src: "/images/taller-footer-sm.png",
    alt: "Interior del taller El Estampadero",
    className: "col-span-2",
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

export function WorkshopLocationModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        data-variant="primary"
        className="brand-action brand-cut group bg-deep inline-flex w-fit items-center gap-[clamp(10px,.8vw,16px)] px-[clamp(20px,1.8vw,36px)] py-[clamp(12px,.9vw,18px)] text-[clamp(15px,1.15vw,22px)] font-extrabold tracking-[.02em] text-white uppercase shadow-[0_10px_26px_rgba(46,4,112,.2)]"
      >
        <span>Conocé el taller</span>
        <span
          aria-hidden="true"
          className="bg-mint text-deep grid size-[clamp(28px,2vw,38px)] shrink-0 place-items-center rounded-full transition-transform duration-300 ease-out group-hover:translate-x-1"
        >



          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-[clamp(16px,1.15vw,22px)]"
          >
            <path d="M8 12h8" />
            <path d="m12.5 8.5 3.5 3.5-3.5 3.5" />
          </svg>
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 top-[70px] bottom-0 z-[100] flex items-center justify-center bg-[#0e0a1a]/75 p-4 backdrop-blur-md md:top-[76px] md:p-6 lg:inset-0"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <m.section
              initial={{ opacity: 0, y: 30, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 280, damping: 27 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="workshop-location-title"
              className="relative w-[88%] max-w-[400px] overflow-hidden rounded-[clamp(18px,2vw,30px)] bg-white shadow-[0_30px_100px_rgba(14,10,26,.42)] sm:w-full sm:max-w-[620px] lg:max-w-[1040px]"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar ubicación del taller"
                className="bg-ink/90 hover:bg-mint hover:text-deep focus-visible:bg-mint focus-visible:text-deep absolute top-2.5 right-2.5 z-30 grid size-10 place-items-center rounded-full border border-white/40 text-white shadow-lg transition-colors sm:top-3 sm:right-3 sm:size-11"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="size-5"
                >
                  <path
                    d="m7 7 10 10M17 7 7 17"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              <div className="flex max-h-[calc(100dvh-102px)] flex-col overflow-y-auto overscroll-contain md:max-h-[calc(100dvh-112px)] lg:grid lg:h-[min(700px,88dvh)] lg:max-h-none lg:grid-cols-[minmax(0,.92fr)_minmax(390px,1.08fr)] lg:overflow-hidden">
                <div className="bg-paper order-2 flex flex-col p-4 sm:p-6 lg:order-1 lg:min-h-0">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-mid text-[11px] font-semibold tracking-[.18em] uppercase sm:text-xs">
                        Nuestro espacio
                      </p>
                      <h2 className="font-display text-ink mt-1.5 text-[22px] leading-none font-black sm:text-[clamp(24px,2.2vw,34px)]">
                        Así trabajamos
                      </h2>
                    </div>
                    <span className="text-muted hidden pt-1 font-mono text-[10px] tracking-[.16em] uppercase sm:block">
                      Villa Mercedes
                    </span>
                  </div>

                  <div className="grid h-[180px] shrink-0 grid-cols-2 grid-rows-[minmax(0,1.6fr)_minmax(0,1fr)] gap-2 sm:h-[320px] sm:gap-3 lg:h-auto lg:min-h-0 lg:flex-1">
                    {WORKSHOP_PHOTOS.map((photo) => (
                      <div
                        key={photo.src}
                        className={`group relative min-h-0 overflow-hidden rounded-xl bg-[#ebe8f1] ${photo.className}`}
                      >
                        <Image
                          src={photo.src}
                          alt={photo.alt}
                          fill
                          sizes="(min-width: 1024px) 46vw, 100vw"
                          className="object-cover transition duration-700 ease-out group-hover:scale-[1.02]"
                        />
                      </div>
                    ))}
                  </div>

                  <p className="text-muted mt-3 max-w-xl text-[13px] leading-relaxed sm:text-sm">
                    Diseñamos, estampamos y preparamos cada pedido desde Villa
                    Mercedes para clubes, escuelas, empresas y equipos de todo
                    el país.
                  </p>
                </div>

                <div className="bg-deep order-1 flex flex-col p-4 text-white sm:min-h-[500px] sm:p-6 lg:order-2 lg:min-h-0">
                  <div className="flex items-start justify-between gap-4 pr-12">
                    <div>
                      <p className="text-mint text-[11px] font-semibold tracking-[.18em] uppercase sm:text-xs">
                        Vení a visitarnos
                      </p>
                      <h2
                        id="workshop-location-title"
                        className="font-display mt-1.5 text-[22px] leading-tight font-black sm:text-[clamp(25px,2.3vw,36px)]"
                      >
                        Encontranos acá
                      </h2>
                    </div>
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-white/80 sm:mt-3 sm:text-[clamp(15px,1.05vw,17px)]">
                    <strong className="font-semibold text-white">
                      {ADDRESS}
                    </strong>
                  </p>

                  <div className="mt-3 h-[150px] shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white/10 sm:mt-4 sm:h-auto sm:min-h-[280px] sm:flex-1 lg:min-h-[210px]">
                    <iframe
                      title={`Mapa de ${ADDRESS}`}
                      src={`https://www.google.com/maps?q=${MAP_QUERY}&output=embed`}
                      loading="eager"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="h-full min-h-[150px] w-full border-0 sm:min-h-[280px] lg:min-h-[210px]"
                    />
                  </div>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`}
                    target="_blank"
                    rel="noreferrer"
                    className="brand-action border-mint text-mint hover:bg-mint hover:text-deep mt-3 inline-flex w-fit shrink-0 items-center gap-2 border px-3.5 py-2 text-[13px] font-semibold sm:mt-4 sm:px-4 sm:py-2.5 sm:text-sm"
                  >
                    Abrir en Google Maps <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
            </m.section>
          </m.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
