"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { routes } from "elestampadero/shared/config/routes";
import { Container, UnderlineLink } from "elestampadero/shared/ui";

import { CartLink } from "./CartLink";
import { MobileCartLink } from "./MobileCartLink";
import { MobileStoreMenu } from "./MobileStoreMenu";
import { StoreNav } from "./StoreNav";

const NAV_LINKS = [
  { label: "Catálogo", href: routes.catalog },
  { label: "Egresados", href: routes.graduates },
  { label: "Clubes", href: routes.clubs },
  { label: "Promociones", href: routes.promotions },
];

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

interface HeaderSession {
  user?: { role?: string } | null;
}

export function StoreHeader() {
  const [session, setSession] = useState<HeaderSession | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/auth/session", { credentials: "same-origin" })
      .then(async (response) =>
        response.ok ? ((await response.json()) as HeaderSession) : null,
      )
      .then((nextSession) => {
        if (active) setSession(nextSession?.user ? nextSession : null);
      })
      .catch(() => {
        setSession(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const isSignedIn = Boolean(session?.user);
  const isAdmin = ADMIN_ROLES.has(session?.user?.role ?? "");
  const accountHref = isAdmin ? routes.admin : routes.account;
  const accountLabel = isAdmin ? "Admin" : "Mi perfil";

  return (
    <header className="bg-ink sticky top-0 z-50 text-white md:relative">
      <Container className="relative flex h-[70px] max-w-[2000px] items-center justify-between px-5 md:h-[76px] md:px-7 xl:h-[84px] xl:px-9 2xl:h-[104px] 2xl:px-12">
        <button type="button" aria-label="Abrir menú" className="hidden">
          ☰
        </button>

        <MobileStoreMenu
          links={NAV_LINKS}
          isSignedIn={isSignedIn}
          accountHref={accountHref}
          accountLabel={accountLabel}
        />




        <Link
          href={routes.home}
          data-loading-label="Inicio"
          className="group hidden items-center gap-3 md:flex md:shrink-0 2xl:gap-[18px]"
        >
          <Image
            src="/images/icono.jpg"
            alt="El Estampadero"
            width={72}
            height={72}
            className="h-11 w-11 object-contain invert transition-transform duration-300 ease-out group-hover:scale-[1.06] group-focus-visible:scale-[1.06] motion-reduce:transform-none motion-reduce:transition-none md:h-[52px] md:w-[52px] 2xl:h-[72px] 2xl:w-[72px]"
          />
          <span className="font-display group-hover:text-mint group-focus-visible:text-mint hidden text-[clamp(18px,1.5vw,30px)] font-black tracking-[.04em] whitespace-nowrap transition-colors duration-300 md:block">
            EL ESTAMPADERO
          </span>
        </Link>

        <StoreNav links={NAV_LINKS} />

        <div className="hidden items-center gap-[clamp(14px,1.2vw,24px)] md:flex">
          <UnderlineLink
            href={isSignedIn ? accountHref : routes.signIn}
            data-loading-label={isSignedIn ? accountLabel : "Ingresar"}
            className="text-[clamp(14px,1.3vw,26px)] font-semibold whitespace-nowrap"
          >
            {isSignedIn ? accountLabel : "Ingresar"}
          </UnderlineLink>
          <CartLink />
        </div>

        <MobileCartLink />
      </Container>
    </header>
  );
}
