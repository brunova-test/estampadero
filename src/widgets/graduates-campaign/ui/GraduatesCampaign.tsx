"use client";

import Image from "next/image";
import { AnimatePresence, m } from "motion/react";
import { useEffect, useState } from "react";

import { routes } from "elestampadero/shared/config/routes";
import { ButtonLink } from "elestampadero/shared/ui";
import { api } from "elestampadero/trpc/react";

const IMAGES = [
  "/images/promo-1-clean.png",
  "/images/promo-2-clean.png",
  "/images/promo-3-clean.png",
].map((image) => ({ desktop: image, mobile: image }));

export function GraduatesCampaign() {
  const content = api.content.publicHome.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const campaignPieces =
    content.data?.pieces.filter((piece) => piece.section === "CAMPAIGN") ?? [];
  const configuredImages = campaignPieces.map((piece) => ({
    desktop: piece.desktopImageUrl,
    mobile: piece.mobileImageUrl,
  }));
  const images = configuredImages.length ? configuredImages : IMAGES;
  const autoplayDelay = content.data?.settings.carouselIntervalMs ?? 4500;
  const carouselEnabled = content.data?.settings.carouselEnabled ?? true;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const activeContent = campaignPieces[active];
  const previewIndices = Array.from(
    { length: Math.min(2, Math.max(0, images.length - 1)) },
    (_, index) => (active + index + 1) % images.length,
  );

  useEffect(() => {
    if (
      paused ||
      !carouselEnabled ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setActive((current) => (current + 1) % images.length);
    }, autoplayDelay);

    return () => window.clearTimeout(timeout);
  }, [active, autoplayDelay, carouselEnabled, images.length, paused]);

  useEffect(() => {
    if (active >= images.length) setActive(0);
  }, [active, images.length]);

  function goTo(delta: number) {
    setActive((current) => (current + delta + images.length) % images.length);
  }

  return (
    <section
      id="promo-egresados"
      className="bg-ink scroll-mt-0 text-white"
      aria-roledescription="carrusel"
      aria-label="Campaña de egresados"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="flex flex-col md:h-[clamp(650px,49.5vw,990px)] md:min-h-[650px] md:flex-row">
        <div className="relative h-[340px] w-full shrink-0 overflow-hidden sm:h-[480px] md:h-full md:w-[41%]">
          <AnimatePresence mode="popLayout" initial={false}>
            <m.div
              key={`${images[active]?.desktop}-${images[active]?.mobile}`}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.07, x: 42 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.98, x: -34 }}
              transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image
                src={images[active]!.desktop}
                alt="Pieza de campaña egresados"
                fill
                className="carousel-fade hidden object-cover object-top md:block"
                sizes="(min-width: 768px) 41vw, 100vw"
              />
              <Image
                src={images[active]!.mobile}
                alt="Pieza de campaña egresados"
                fill
                className="carousel-fade object-cover object-top md:hidden"
                sizes="100vw"
              />
            </m.div>
          </AnimatePresence>
          <div
            className="bg-ink absolute inset-y-0 right-0 hidden w-[15%] md:block"
            style={{ clipPath: "polygon(100% 0,100% 100%,0 100%)" }}
          />
        </div>

        <div className="flex flex-1 flex-col gap-4 px-5 pt-8 pb-10 sm:px-8 md:gap-[clamp(16px,1.2vw,24px)] md:px-[clamp(38px,3.2vw,64px)] md:py-[clamp(36px,2.6vw,52px)]">
          <span className="bg-mint font-display text-deep w-fit -rotate-2 px-3.5 py-1.5 text-xs font-extrabold tracking-[.1em] uppercase md:px-[clamp(16px,1.2vw,24px)] md:py-[clamp(8px,.5vw,10px)] md:text-[clamp(16px,1.3vw,26px)] md:tracking-[.12em]">
            {activeContent?.eyebrow ?? "Promo egresaditos 2027"}
          </span>
          <h2 className="font-display max-w-[1030px] text-[30px] leading-none font-black tracking-[-.02em] uppercase md:text-[clamp(40px,3.8vw,76px)] md:leading-[.98]">
            {activeContent?.title ?? "¿Te tocó organizar la ropa de la promo?"}
          </h2>
          <p className="max-w-[1000px] text-base leading-[1.35] text-[#c9c0e0] md:text-[clamp(20px,1.6vw,32px)]">
            {activeContent?.description ??
              "Nosotros nos encargamos de todo: diseño, medición y confección. Vos solo coordinás con las otras familias."}
          </p>
          <div className="flex flex-wrap gap-[clamp(10px,.9vw,18px)]">
            {(
              activeContent?.tags ?? [
                "Conjunto + bandera de regalo",
                "Diseño a elección",
              ]
            ).map((tag) => (
              <span
                key={tag}
                className="text-mint bg-white/10 px-3.5 py-2.5 font-mono text-[13px] font-medium md:px-[clamp(14px,1.3vw,26px)] md:py-[clamp(9px,.7vw,14px)] md:text-[clamp(16px,1.3vw,26px)] md:font-semibold"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex flex-col gap-2.5 pt-1 sm:flex-row md:flex-wrap md:gap-[clamp(12px,1vw,20px)]">
            <ButtonLink
              href={activeContent?.ctaHref ?? "https://wa.me/5492657560737"}
              variant="mint"
            >
              {activeContent?.ctaLabel ?? "Reservar ahora"}
            </ButtonLink>
            <ButtonLink
              href={activeContent?.secondaryCtaHref ?? routes.specialRequest}
              variant="outline"
            >
              {activeContent?.secondaryCtaLabel ?? "Cómo funciona"}
            </ButtonLink>
          </div>

          <div className="mt-auto hidden items-end justify-between gap-6 pt-8 md:flex md:pb-[clamp(50px,5.2vw,104px)]">
            <div className="flex max-w-full gap-[clamp(8px,.9vw,18px)] overflow-x-auto p-1">
              {previewIndices.map((imageIndex, previewPosition) => (
                <button
                  key={`${images[imageIndex]?.desktop}-${imageIndex}`}
                  type="button"
                  aria-label={`${previewPosition === 0 ? "Próxima foto" : "Foto siguiente"} ${imageIndex + 1}`}
                  onClick={() => setActive(imageIndex)}
                  className={`relative h-[clamp(92px,9.5vw,190px)] w-[clamp(64px,6.8vw,136px)] shrink-0 overflow-hidden transition-opacity ${
                    previewPosition === 0
                      ? "outline-mint outline-4"
                      : "opacity-75 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={images[imageIndex]!.desktop}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
            <div className="hidden gap-[clamp(9px,.7vw,14px)] lg:flex">
              <button
                type="button"
                aria-label="Foto anterior"
                onClick={() => goTo(-1)}
                className="flex h-[clamp(44px,3vw,60px)] w-[clamp(44px,3vw,60px)] items-center justify-center bg-white/10 text-[clamp(24px,1.6vw,32px)] hover:bg-white/20"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Foto siguiente"
                onClick={() => goTo(1)}
                className="bg-mint text-deep flex h-[clamp(44px,3vw,60px)] w-[clamp(44px,3vw,60px)] items-center justify-center text-[clamp(24px,1.6vw,32px)] hover:brightness-95"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
