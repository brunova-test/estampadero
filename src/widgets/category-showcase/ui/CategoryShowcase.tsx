import Image from "next/image";
import Link from "next/link";

import { routes } from "elestampadero/shared/config/routes";
import { ButtonLink } from "elestampadero/shared/ui";
import { RevealGroup } from "elestampadero/shared/ui/motion";

const CATEGORIES = [
  { label: "Remeras", image: "/images/remeras.png", slug: "remeras" },
  { label: "Buzos", image: "/images/buzos.png", slug: "buzos" },
  { label: "Camisetas", image: "/images/remeras1.png", slug: "camisetas" },
  { label: "Gorras", image: "/images/gorras.png", slug: "gorras" },
];

const LINES = [
  { label: "Línea Club", image: "/images/linea-club.png", slug: "club" },
  { label: "Urbana", image: "/images/linea-urbana.png", slug: "urbana" },
  { label: "Training", image: "/images/linea-training.png", slug: "training" },
  { label: "Trabajo", image: "/images/linea-trabajo.png", slug: "trabajo" },
  { label: "Escolar", image: "/images/linea-escolar.png", slug: "escolar" },
];

export function CategoryShowcase() {
  return (
    <section className="flex flex-col gap-5 bg-white px-5 pt-2 pb-9 sm:px-8 md:gap-[clamp(24px,1.8vw,36px)] md:px-[clamp(40px,4vw,80px)] md:py-[clamp(36px,2.8vw,56px)]">
      <div className="flex items-baseline justify-between gap-6">
        <h2 className="font-display text-[28px] leading-none font-black md:text-[clamp(34px,2.8vw,56px)]">
          Comprá por categoría
        </h2>
        <ButtonLink
          href={routes.catalog}
          variant="mint"
          className="category-catalog-button hover:!bg-mid focus-visible:!bg-mid hidden text-[clamp(15px,1.1vw,22px)] font-bold hover:!text-white focus-visible:!text-white sm:inline-flex"
        >
          Ver todo el catálogo
        </ButtonLink>
      </div>

      <RevealGroup className="grid grid-cols-2 gap-3 md:h-[clamp(255px,16.5vw,330px)] md:grid-cols-4 md:gap-[clamp(16px,1.4vw,28px)]">
        {CATEGORIES.map((category) => (
          <Link
            key={category.slug}
            href={`${routes.catalog}?categoria=${category.slug}`}
            className="brand-image-cut group relative aspect-[1.1] overflow-hidden md:aspect-auto"
          >
            <Image
              src={category.image}
              alt={category.label}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              sizes="(min-width: 768px) 24vw, 50vw"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(14,10,26,.86)_0%,rgba(14,10,26,.1)_58%,transparent_100%)]" />
            <span className="font-display absolute bottom-3 left-3.5 text-xl font-extrabold text-white md:bottom-[clamp(18px,1.5vw,30px)] md:left-[clamp(18px,1.6vw,32px)] md:text-[clamp(24px,2vw,40px)]">
              {category.label}
            </span>
          </Link>
        ))}
      </RevealGroup>

      <div className="flex flex-col gap-[clamp(18px,1.2vw,24px)]">
        <h3 className="font-display text-2xl leading-none font-black md:text-[clamp(30px,2.4vw,48px)]">
          Nuestras líneas
        </h3>
        <RevealGroup className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 md:gap-[clamp(14px,1.2vw,24px)]">
          {LINES.map((line) => (
            <Link
              key={line.slug}
              href={`${routes.catalog}?linea=${line.slug}`}
              className="category-line-card group hover:border-mint focus-visible:border-mint relative isolate flex min-h-[130px] flex-col items-center justify-center gap-2 overflow-hidden border-2 border-[#e3e0ea] bg-white p-3 text-center transition-[border-color,background-color,color] duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:bg-[#9affdf] focus-visible:bg-[#9affdf] motion-reduce:transition-none md:min-h-[165px]"
            >
              <span
                aria-hidden="true"
                className="bg-mint/15 pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
              />
              <span
                aria-hidden="true"
                className="bg-mint pointer-events-none absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-reduce:transition-none"
              />
              <div className="relative z-10 h-[60px] w-full transition-[filter] duration-500 md:h-[clamp(82px,5.9vw,118px)]">
                <Image
                  src={line.image}
                  alt=""
                  fill
                  className="object-contain transition-[filter] duration-500 group-hover:drop-shadow-[0_8px_10px_rgba(62,6,142,.18)] group-focus-visible:drop-shadow-[0_8px_10px_rgba(62,6,142,.18)] motion-reduce:transition-none"
                />
              </div>
              <span className="font-display text-mid group-hover:text-deep group-focus-visible:text-deep relative z-10 text-base font-bold transition-colors duration-500 md:text-[clamp(18px,1.5vw,30px)]">
                {line.label}
              </span>
            </Link>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
