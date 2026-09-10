"use client";

import Image from "next/image";
import Link from "next/link";

import { routes } from "elestampadero/shared/config/routes";
import { api } from "elestampadero/trpc/react";

export function InfoBlocks() {
  const content = api.content.publicHome.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const promotion = content.data?.pieces.find(
    (piece) => piece.section === "PROMOTION",
  );

  return (
    <section className="flex flex-col gap-4 bg-white px-5 py-9 sm:px-8 md:gap-[clamp(24px,2.2vw,44px)] md:px-[clamp(40px,4vw,80px)] md:py-[clamp(36px,2.8vw,56px)]">
      <Link
        id="promociones"
        href={
          promotion?.ctaHref ?? `${routes.catalog}/buzo-canguro-friza-premium`
        }
        className="promo-block bg-deep relative flex min-h-[220px] flex-1 scroll-mt-24 items-center justify-between gap-8 overflow-hidden px-6 py-8 text-white md:min-h-[clamp(280px,21.7vw,434px)] md:px-[clamp(28px,2.8vw,56px)] md:py-10"
      >
        <Image
          src={promotion?.desktopImageUrl ?? "/images/promo-buzos.png"}
          alt={promotion?.title ?? "Buzos en promoción"}
          fill
          className="hidden object-cover object-right md:block"
          sizes="100vw"
        />
        <Image
          src={
            promotion?.mobileImageUrl ??
            promotion?.desktopImageUrl ??
            "/images/promo-buzos.png"
          }
          alt={promotion?.title ?? "Buzos en promoción"}
          fill
          className="object-cover object-center md:hidden"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,6,54,.97)_0%,rgba(20,6,54,.93)_38%,rgba(20,6,54,.55)_58%,transparent_78%)]" />
        <div className="bg-mint absolute inset-y-0 left-0 w-[clamp(8px,.7vw,14px)]" />
        <div className="relative flex max-w-[75%] flex-col gap-[clamp(10px,.7vw,14px)]">
          <span className="text-mint font-mono text-[13px] font-medium tracking-[.06em] uppercase md:text-[clamp(15px,1.2vw,24px)] md:tracking-[.08em]">
            {promotion?.eyebrow ?? "Promo vigente · hasta 31/08"}
          </span>
          <h3 className="font-display text-[28px] leading-none font-black md:text-[clamp(36px,3vw,60px)]">
            {promotion?.title ?? "20% off en buzos de línea"}
          </h3>
          {promotion?.description ? (
            <p className="max-w-[720px] text-[clamp(16px,1.2vw,24px)] text-white/80">
              {promotion.description}
            </p>
          ) : null}
        </div>
        <span className="brand-cut bg-mint text-deep relative hidden px-[clamp(24px,2.2vw,44px)] py-[clamp(14px,1.1vw,22px)] text-[clamp(17px,1.4vw,28px)] font-bold whitespace-nowrap sm:block">
          {promotion?.ctaLabel ?? "Ver promoción"}
        </span>
      </Link>
    </section>
  );
}
