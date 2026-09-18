"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";

import { routes } from "elestampadero/shared/config/routes";

interface CustomerAccountViewProps {
  name: string | null;
  email: string | null;
}

export function CustomerAccountView({ name, email }: CustomerAccountViewProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    await signOut({ callbackUrl: routes.signIn });
  }

  return (
    <main className="bg-paper min-h-screen px-5 py-6 sm:px-10 lg:px-16 lg:py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 md:gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:gap-5">
          <div>
            <Link
              href={routes.home}
              className="text-deep font-mono text-xs font-semibold tracking-[.16em] uppercase"
            >
              El Estampadero
            </Link>
            <p className="text-mid mt-4 text-xs font-semibold tracking-[.12em] uppercase md:mt-6 md:text-sm">
              Mi cuenta
            </p>
            <h1 className="font-display text-ink mt-1 text-[34px] font-black tracking-tight sm:text-5xl">
              Hola, {name ?? "bienvenido"}
            </h1>
            <p className="text-muted mt-2 max-w-xl text-[15px] md:mt-3 md:text-lg">
              Gestioná tus compras y accedé a tu experiencia personalizada.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={isSigningOut}
            aria-busy={isSigningOut || undefined}
            className="border-deep/15 text-deep hover:border-deep inline-flex min-h-10 items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition-colors hover:bg-white disabled:cursor-wait disabled:opacity-60"
          >
            {isSigningOut ? "Saliendo..." : "Cerrar sesión"}
            {isSigningOut ? (
              <span
                aria-hidden="true"
                className="border-deep/25 border-t-deep h-4 w-4 animate-spin rounded-full border-2"
              />
            ) : null}
          </button>
        </header>

        <section className="grid gap-5 md:grid-cols-2">
          <article className="border-deep/10 rounded-2xl border bg-white p-[22px] shadow-[0_18px_45px_-35px_rgba(46,4,112,.55)] md:p-6">
            <p className="text-mid text-xs font-bold tracking-[.14em] uppercase">
              Perfil
            </p>
            <h2 className="font-display mt-3 text-2xl font-black">Tus datos</h2>
            <div className="text-muted mt-5 space-y-2 text-sm">
              <p>{name ?? "Nombre no disponible"}</p>
              <p>{email ?? "Correo no disponible"}</p>
            </div>
          </article>

          <article className="bg-deep rounded-2xl p-[22px] text-white shadow-[0_18px_45px_-28px_rgba(46,4,112,.8)] md:p-6">
            <p className="text-mint text-xs font-bold tracking-[.14em] uppercase">
              Compras
            </p>
            <h2 className="font-display mt-3 text-2xl font-black">
              Encontrá tu próximo diseño
            </h2>
            <p className="mt-3 text-white/75">
              Explorá el catálogo y armá tu pedido con tus talles y colores.
            </p>
            <Link
              href={routes.catalog}
              className="bg-mint text-deep mt-6 inline-flex rounded-full px-5 py-2.5 text-sm font-extrabold transition-transform hover:-translate-y-0.5"
            >
              Ver catálogo
            </Link>
          </article>
        </section>
      </div>
    </main>
  );
}
