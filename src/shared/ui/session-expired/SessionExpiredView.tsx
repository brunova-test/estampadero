import Link from "next/link";

import { routes } from "elestampadero/shared/config/routes";

export function SessionExpiredView() {
  return (
    <main className="bg-paper flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
      <section className="w-full max-w-xl rounded-2xl bg-white p-7 text-center shadow-[0_24px_70px_-42px_rgba(46,4,112,.5)] sm:p-12">
        <div className="bg-mint text-deep mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl font-black">
          !
        </div>
        <p className="text-mid mt-6 text-xs font-bold tracking-[.16em] uppercase">
          Acceso seguro
        </p>
        <h1 className="font-display text-ink mt-2 text-3xl font-black sm:text-4xl">
          Tu sesión venció
        </h1>
        <p className="text-muted mx-auto mt-4 max-w-md text-base leading-relaxed sm:text-lg">
          Por seguridad, necesitás volver a iniciar sesión para continuar.
        </p>
        <Link
          href={routes.signIn}
          className="bg-deep hover:bg-mid mt-8 inline-flex min-h-12 items-center justify-center rounded-full px-7 py-3 text-sm font-extrabold text-white transition-colors"
        >
          Ir al login principal
        </Link>
      </section>
    </main>
  );
}
