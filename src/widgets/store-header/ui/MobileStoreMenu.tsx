"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { routes } from "elestampadero/shared/config/routes";

interface MobileStoreMenuProps {
  links: readonly { label: string; href: string }[];
  isSignedIn: boolean;
  accountHref: string;
  accountLabel: string;
}

export function MobileStoreMenu({
  links,
  isSignedIn,
  accountHref,
  accountLabel,
}: MobileStoreMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuId = useId();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="z-30 w-11 shrink-0 md:hidden">
      <button
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className="relative z-30 grid h-11 w-11 place-items-center text-white"
      >
        <span className="sr-only">{open ? "Cerrar menú" : "Abrir menú"}</span>
        <span aria-hidden="true" className="relative block h-5 w-7">
          <span
            className={`absolute left-0 h-0.5 w-7 bg-current transition-transform ${open ? "top-[9px] rotate-45" : "top-0"}`}
          />
          <span
            className={`absolute top-[9px] left-0 h-0.5 w-7 bg-current transition-opacity ${open ? "opacity-0" : "opacity-100"}`}
          />
          <span
            className={`absolute left-0 h-0.5 w-7 bg-current transition-transform ${open ? "top-[9px] -rotate-45" : "top-[18px]"}`}
          />
        </span>
      </button>

      <Link
        href={routes.home}
        data-loading-label="Inicio"
        aria-label="El Estampadero, inicio"
        className="absolute top-1/2 left-1/2 z-20 flex h-[58px] w-[108px] -translate-x-1/2 -translate-y-1/2 items-center justify-center"
      >
        <Image
          src="/images/icono.jpg"
          alt=""
          width={108}
          height={58}
          priority
          className="h-[54px] w-[102px] object-contain invert"
        />
      </Link>

      <div
        id={menuId}
        className={`mobile-store-menu bg-ink fixed inset-x-0 top-[70px] z-10 h-[calc(100dvh-70px)] overscroll-contain overflow-y-auto border-t border-white/10 px-4 py-5 transition-[opacity,transform,visibility] duration-300 sm:px-7 sm:py-8 ${open ? "visible pointer-events-auto translate-y-0 opacity-100" : "invisible pointer-events-none -translate-y-3 opacity-0"}`}
      >
        <nav aria-label="Navegación móvil" className="flex flex-col gap-2">
          <Link
            href={routes.home}
            onClick={() => setOpen(false)}
            className="border-b border-white/10 py-3.5 font-sans text-lg font-semibold tracking-[.025em] text-white"
          >
            Inicio
          </Link>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="border-b border-white/10 py-3.5 font-sans text-lg font-semibold tracking-[.025em] text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 grid gap-3">
          {isSignedIn ? (
            <Link
              href={accountHref}
              onClick={() => setOpen(false)}
              className="bg-mint text-deep px-4 py-3 text-center font-bold"
            >
              {accountLabel}
            </Link>
          ) : (
            <Link
              href={routes.signIn}
              onClick={() => setOpen(false)}
              className="border border-white/50 px-4 py-3 text-center font-bold text-white"
            >
              Ingresar
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
