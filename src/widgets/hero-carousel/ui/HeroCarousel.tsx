"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { routes } from "elestampadero/shared/config/routes";
import { ButtonLink } from "elestampadero/shared/ui";
import { api } from "elestampadero/trpc/react";

interface Slide {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  mobileImage: string;
  mobileTitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  tags: string[];
}

const SLIDES: Slide[] = [
  {
    eyebrow: "Temporada 2027",
    title: "Estampamos tu equipo",
    description:
      "Camisetas, buzos y conjuntos para clubes, escuelas y egresados. Desde 10 unidades.",
    image: "/images/equipo-main.png",
    mobileImage: "/images/equipo-main.png",
    mobileTitle: "Camisetas de club",
    primaryCta: { label: "Ver catálogo", href: routes.catalog },
    secondaryCta: { label: "Armar mi pedido", href: routes.specialRequest },
    tags: ["Estampado textil", "Clubes", "Egresados", "Empresas", "Escolar"],
  },
  {
    eyebrow: "Diseño a medida",
    title: "Bajamos tu idea a la realidad",
    description:
      "¿La viste en internet o la hiciste con IA? La adaptamos, la producimos y la convertimos en una prenda lista para usar.",
    image: "/images/hero-idea.png",
    mobileImage: "/images/hero-idea.png",
    mobileTitle: "Bajamos tu idea a la realidad",
    primaryCta: { label: "Escribinos", href: "https://wa.me/5492657560737" },
    secondaryCta: { label: "Ver ejemplos", href: routes.catalog },
    tags: ["Diseño propio", "Mockup 3D", "Muestra", "Producción", "Entrega"],
  },
  {
    eyebrow: "Clubes e instituciones",
    title: "Comprá la indumentaria oficial de tu club",
    description: "Cada compra deja un porcentaje para la institución.",
    image: "/images/hero-2.png",
    mobileImage: "/images/hero-2.png",
    mobileTitle: "Indumentaria oficial de tu club",
    primaryCta: { label: "Ver tienda", href: routes.clubs },
    secondaryCta: { label: "Sumar mi club", href: routes.joinClub },
    tags: ["Camisetas", "Buzos", "Conjuntos", "Equipos", "Clubes"],
  },
];

const AUTOPLAY_DELAY = 4000;

function getSlideState(index: number, active: number, slideCount: number) {
  if (index === active) {
    return "active";
  }

  return index === (active - 1 + slideCount) % slideCount ? "previous" : "next";
}

export function HeroCarousel() {
  const content = api.content.publicHome.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const configuredSlides: Slide[] =
    content.data?.pieces
      .filter((piece) => piece.section === "HERO")
      .map((piece) => ({
        eyebrow: piece.eyebrow,
        title: piece.title,
        description: piece.description,
        image: piece.desktopImageUrl,
        mobileImage: piece.mobileImageUrl,
        mobileTitle: piece.title,
        primaryCta: { label: piece.ctaLabel, href: piece.ctaHref },
        secondaryCta: {
          label: piece.secondaryCtaLabel ?? piece.ctaLabel,
          href:
            (piece.secondaryCtaLabel ?? piece.ctaLabel)
              .trim()
              .toLocaleLowerCase("es") === "sumar mi club"
              ? routes.joinClub
              : (piece.secondaryCtaHref ?? piece.ctaHref),
        },
        tags: piece.tags,
      })) ?? [];
  const slides = configuredSlides.length ? configuredSlides : SLIDES;
  const autoplayDelay =
    content.data?.settings.carouselIntervalMs ?? AUTOPLAY_DELAY;
  const carouselEnabled = content.data?.settings.carouselEnabled ?? true;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cycle, setCycle] = useState(0);
  const previewIndices = Array.from(
    { length: Math.min(2, Math.max(0, slides.length - 1)) },
    (_, index) => (active + index + 1) % slides.length,
  );

  useEffect(() => {
    if (paused || !carouselEnabled || slides.length < 2) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setActive((current) => (current + 1) % slides.length);
    }, autoplayDelay);

    return () => window.clearTimeout(timeout);
  }, [active, autoplayDelay, carouselEnabled, cycle, paused, slides.length]);

  useEffect(() => {
    if (active >= slides.length) setActive(0);
  }, [active, slides.length]);

  function selectSlide(index: number) {
    setActive(index);
    setPaused(true);
    setCycle((current) => current + 1);
  }

  return (
    <section
      className="bg-deep relative overflow-hidden text-white"
      aria-roledescription="carrusel"
      aria-label="Banners principales"
      onMouseLeave={() => setPaused(false)}
    >
      <div className="hero-desktop-stage relative hidden h-[calc(100svh-76px)] overflow-hidden bg-[linear-gradient(115deg,#2e0470_0%,#3e068e_58%,#4361ee_100%)] lg:block xl:h-[calc(100svh-84px)] 2xl:h-[calc(100svh-104px)]">
        <div
          className="absolute inset-y-0 right-0 w-[59%] overflow-hidden"
          style={{ clipPath: "polygon(26% 0,100% 0,100% 100%,0 100%)" }}
        >
          {slides.map((item, index) => (
            <div
              key={item.title}
              className="hero-slide-media absolute inset-0"
              data-slide-state={getSlideState(index, active, slides.length)}
              aria-hidden={index !== active}
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                priority={index === 0}
                className={
                  index === 0
                    ? "object-cover object-[50%_30%] contrast-[1.04] saturate-[.95]"
                    : "object-cover object-[60%_center]"
                }
                sizes="59vw"
              />
              {index === 0 ? (
                <>
                  <div className="absolute inset-0 bg-[radial-gradient(110%_85%_at_74%_26%,rgba(140,90,255,.16)_0%,rgba(90,30,190,.1)_44%,rgba(26,7,66,0)_74%)]" />
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(26,7,66,.62)_0%,rgba(26,7,66,.18)_18%,transparent_40%,transparent_72%,rgba(26,7,66,.38)_100%)]" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(26,7,66,.34)_0%,transparent_22%,transparent_74%,rgba(26,7,66,.42)_100%)]" />
                </>
              ) : null}
            </div>
          ))}
        </div>

        <div
          className="bg-mint absolute inset-y-0 right-0 w-[59%]"
          style={{ clipPath: "polygon(26% 0,27.2% 0,1.2% 100%,0 100%)" }}
        />

        <div className="absolute inset-0" aria-live="polite">
          {slides.map((item, index) => (
            <div
              key={item.title}
              className="hero-slide-copy absolute top-[clamp(24px,min(4.8vw,6vh),96px)] left-[clamp(42px,4vw,80px)] flex w-[45%] flex-col gap-[clamp(10px,min(1.3vw,1.6vh),26px)]"
              data-slide-state={getSlideState(index, active, slides.length)}
              aria-hidden={index !== active}
            >
              <span className="hero-eyebrow bg-mint font-display text-deep w-fit -rotate-3 px-[clamp(16px,1.3vw,26px)] py-[clamp(6px,min(.6vw,.9vh),12px)] text-[clamp(14px,min(1.3vw,2vh),26px)] font-extrabold tracking-[.14em] uppercase">
                {item.eyebrow}
              </span>
              <h1
                className={`hero-title font-display overflow-visible leading-[.94] font-black tracking-[-.03em] text-balance uppercase ${
                  index === 0
                    ? "text-[clamp(40px,min(5.4vw,9vh),108px)]"
                    : "text-[clamp(38px,min(4.8vw,8vh),96px)]"
                }`}
              >
                {item.title}
              </h1>
              <p className="hero-description max-w-[780px] overflow-visible text-[clamp(15px,min(1.7vw,2.6vh),34px)] leading-[1.32] text-pretty text-[#ded6f2]">
                {item.description}
              </p>
              <div className="hero-actions flex flex-wrap gap-[clamp(8px,min(1vw,1.2vh),20px)] pt-1">
                <ButtonLink
                  href={item.primaryCta.href}
                  variant="mint"
                  tabIndex={index === active ? undefined : -1}
                >
                  {item.primaryCta.label}
                </ButtonLink>
                <ButtonLink
                  href={item.secondaryCta.href}
                  variant="outline"
                  tabIndex={index === active ? undefined : -1}
                >
                  {item.secondaryCta.label}
                </ButtonLink>
              </div>
            </div>
          ))}
        </div>

        <div className="hero-previews absolute right-[3.6%] bottom-[14.8%] z-10 flex items-end gap-[clamp(12px,1vw,20px)]">
          {previewIndices.map((slideIndex, previewPosition) => {
            const preview = slides[slideIndex]!;

            return (
              <button
                key={preview.title}
                type="button"
                aria-label={`${previewPosition === 0 ? "Próximo banner" : "Banner siguiente"}: ${preview.title}`}
                onClick={() => selectSlide(slideIndex)}
                className={`relative h-[clamp(96px,7.5vw,150px)] w-[clamp(134px,10.5vw,210px)] overflow-hidden transition-opacity ${
                  previewPosition === 0
                    ? "outline-mint opacity-100 outline-4 -outline-offset-4"
                    : "opacity-70 hover:opacity-100"
                }`}
                style={{
                  clipPath: "polygon(6% 0,100% 0,94% 100%,0 100%)",
                }}
              >
                <Image
                  src={preview.image}
                  alt=""
                  fill
                  className="object-cover object-[center_30%]"
                />
              </button>
            );
          })}
          <div className="flex gap-[clamp(7px,.6vw,12px)] pb-2">
            {slides.map((item, index) => (
              <button
                key={item.title}
                type="button"
                aria-label={`Ver banner ${index + 1}`}
                aria-current={index === active ? "true" : undefined}
                onClick={() => selectSlide(index)}
                className="relative h-[clamp(5px,.4vw,8px)] w-[clamp(34px,2.6vw,52px)] overflow-hidden bg-white/30"
              >
                {index === active ? (
                  <span
                    key={`${active}-${cycle}-${paused}`}
                    className="hero-carousel-progress bg-mint absolute inset-0"
                    style={{
                      animationPlayState: paused ? "paused" : "running",
                    }}
                  />
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <div className="text-deep absolute -right-[3%] -bottom-[5px] -left-[3%] z-20 h-[clamp(62px,4.4vw,88px)] -rotate-[1.6deg] overflow-hidden">
          <div className="relative h-full">
            {slides.map((item, slideIndex) => (
              <div
                key={item.title}
                className="hero-slide-ribbon bg-mint absolute inset-0 flex h-full items-center gap-[clamp(30px,2.8vw,56px)] px-[clamp(40px,3vw,60px)]"
                data-slide-state={getSlideState(
                  slideIndex,
                  active,
                  slides.length,
                )}
                aria-hidden={slideIndex !== active}
              >
                {item.tags.map((tag, tagIndex) => (
                  <span key={tag} className="contents">
                    {tagIndex > 0 ? (
                      <span className="font-display text-[clamp(22px,1.7vw,34px)] font-black">
                        ·
                      </span>
                    ) : null}
                    <span className="font-display text-[clamp(22px,1.7vw,34px)] font-black tracking-[.1em] whitespace-nowrap uppercase">
                      {tag}
                    </span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="hero-mobile-shell grid lg:hidden">
        <div className="hero-mobile-stage relative min-h-0 overflow-hidden">
          {slides.map((item, index) => (
            <div
              key={item.mobileTitle}
              className="hero-slide-media absolute inset-0"
              data-slide-state={getSlideState(index, active, slides.length)}
              aria-hidden={index !== active}
            >
              <Image
                src={item.mobileImage}
                alt=""
                fill
                priority={index === 0}
                className="scale-110 object-cover object-center opacity-60 blur-xl"
                sizes="100vw"
              />
              <Image
                src={item.mobileImage}
                alt={item.mobileTitle}
                fill
                priority={index === 0}
                className="object-cover object-center"
                sizes="100vw"
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(14,6,40,.97)_0%,rgba(14,6,40,.62)_48%,rgba(14,6,40,.12)_100%)]" />
          <div className="absolute inset-0" aria-live="polite">
            {slides.map((item, slideIndex) => (
              <div
                key={item.mobileTitle}
                className="hero-slide-copy absolute top-[8%] right-5 bottom-14 left-5 z-10 flex flex-col gap-4 sm:right-8 sm:left-8 sm:gap-5"
                data-slide-state={getSlideState(
                  slideIndex,
                  active,
                  slides.length,
                )}
                aria-hidden={slideIndex !== active}
              >
                <span className="hero-eyebrow bg-mint font-display text-deep w-fit rounded-md px-4 py-2 text-sm font-extrabold tracking-[.13em] uppercase sm:text-base">
                  {item.eyebrow}
                </span>
                <h1 className="hero-title font-display mt-3 max-w-full overflow-visible text-[clamp(34px,10vw,48px)] leading-[.98] font-black tracking-[-.025em] text-balance uppercase drop-shadow-[0_3px_10px_rgba(0,0,0,.45)]">
                  {item.mobileTitle}
                </h1>
                <span
                  aria-hidden="true"
                  className="hero-accent-line bg-mint mt-1 block h-1 w-16 rounded-full"
                />
                <p className="hero-description max-w-[20rem] overflow-visible text-[17px] leading-[1.4] text-pretty text-white drop-shadow-[0_2px_7px_rgba(0,0,0,.5)] sm:text-xl">
                  {item.description}
                </p>
                <div className="hero-mobile-tags flex flex-wrap gap-2 sm:hidden">
                  {item.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-white/70 bg-black/20 px-3 py-2 font-sans text-xs font-medium tracking-wide text-white shadow-sm backdrop-blur-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <ButtonLink
                  href={item.primaryCta.href}
                  variant="mint"
                  className="hero-actions mt-auto w-full py-4 text-lg"
                  tabIndex={slideIndex === active ? undefined : -1}
                >
                  {item.primaryCta.label}
                </ButtonLink>
              </div>
            ))}
          </div>
          <a
            href="#promo-egresados"
            aria-label="Bajar a la siguiente sección"
            className="hidden"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
            >
              <path
                d="m6 9 6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <div
            className="hero-mobile-pagination absolute right-5 bottom-3 left-5 z-20 flex justify-center gap-2 sm:right-8 sm:left-8"
            aria-label="Seleccionar banner"
          >
            {slides.map((item, index) => (
              <button
                key={item.title}
                type="button"
                aria-label={`Ver banner ${index + 1}`}
                aria-current={index === active ? "true" : undefined}
                onClick={() => selectSlide(index)}
                className="relative h-1.5 w-10 overflow-hidden bg-white/40"
              >
                {index === active ? (
                  <span
                    key={`${active}-${cycle}-${paused}`}
                    className="hero-carousel-progress bg-mint absolute inset-0"
                    style={{
                      animationPlayState: paused ? "paused" : "running",
                    }}
                  />
                ) : null}
              </button>
            ))}
          </div>
        </div>
        <a
          href="#promo-egresados"
          aria-label="Ir a la siguiente sección"
          className="hero-mobile-next bg-ink group relative z-30 flex items-center justify-center border-t border-white/10 text-white"
        >
          <span className="translate-y-[12.5%]">
            <span className="group-hover:bg-mint group-hover:text-deep bg-ink grid h-8 w-8 animate-bounce place-items-center rounded-full border border-white/60 transition-colors motion-reduce:animate-none">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4"
              >
                <path
                  d="m6 9 6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </span>
        </a>
      </div>
    </section>
  );
}
