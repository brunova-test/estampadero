"use client";

import { useEffect } from "react";








export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] uncaught error", error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-ink text-2xl font-black">
        Algo salió mal
      </h1>
      <p className="text-muted max-w-md text-base leading-relaxed">
        Ocurrió un error al cargar esta sección del panel de administración.
        Podés intentar de nuevo; si el problema persiste, actualizá la
        página.
      </p>
      <button
        type="button"
        onClick={reset}
        className="bg-deep hover:bg-mid mt-2 inline-flex min-h-11 items-center justify-center rounded-full px-6 py-2.5 text-sm font-extrabold text-white transition-colors"
      >
        Reintentar
      </button>
    </main>
  );
}
