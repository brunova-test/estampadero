"use client";

import { useRouter } from "next/navigation";

interface BackLinkProps {
  fallback: string;
  className?: string;
  alwaysUseFallback?: boolean;
}

export function BackLink({
  fallback,
  className = "",
  alwaysUseFallback = false,
}: BackLinkProps) {
  const router = useRouter();

  function handleBack() {
    if (!alwaysUseFallback && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallback);
  }

  return (
    <button
      type="button"
      className={`public-back-link ${className}`}
      onClick={handleBack}
      aria-label={
        alwaysUseFallback ? "Volver al catálogo" : "Volver a la página anterior"
      }
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M19 12H5M11 18l-6-6 6-6" />
      </svg>
      Volver
    </button>
  );
}
