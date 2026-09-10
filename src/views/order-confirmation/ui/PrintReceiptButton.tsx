"use client";

export function PrintReceiptButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="brand-action brand-cut bg-deep hover:bg-mid focus-visible:bg-mid mt-4 inline-flex min-h-12 items-center justify-center gap-2 px-4 py-3 text-sm font-extrabold tracking-[.02em] text-white uppercase transition-colors print:hidden"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8V4h10v4" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 17H4.5A1.5 1.5 0 0 1 3 15.5v-5A1.5 1.5 0 0 1 4.5 9h15a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5H18"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 14h10v7H7z" />
        <path strokeLinecap="round" d="M17 12h.01" />
      </svg>
      <span>Imprimir comprobante</span>
    </button>
  );
}
