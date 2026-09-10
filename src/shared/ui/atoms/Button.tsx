import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

import { ModernSpinner } from "elestampadero/shared/ui/motion";

const VARIANT_CLASSES = {
  primary: "bg-deep text-white",
  mint: "bg-mint text-deep",
  outline: "border-[3px] border-white/65 text-white",
  outlineDark: "border border-deep text-deep",
} as const;

type ButtonVariant = keyof typeof VARIANT_CLASSES;

const baseClasses =
  "brand-action brand-cut inline-flex items-center justify-center gap-2 px-[clamp(22px,2.3vw,46px)] py-[clamp(13px,1.1vw,22px)] text-[clamp(15px,1.4vw,28px)] font-extrabold uppercase";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: ButtonVariant;
  loading?: boolean;
  loadingLabel?: string;
}

export function Button({
  variant = "primary",
  className = "",
  loading = false,
  loadingLabel = "Procesando",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      data-variant={variant}
      data-loading={loading ? "true" : undefined}
      aria-busy={loading || undefined}
      disabled={disabled ?? loading}
      className={`${baseClasses} ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {loading ? loadingLabel : children}
      </span>
      {loading ? (
        <ModernSpinner
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          label="Cargando..."
        />
      ) : null}
      {loading ? <span className="sr-only">{loadingLabel}</span> : null}
    </button>
  );
}

interface ButtonLinkProps extends ComponentPropsWithoutRef<typeof Link> {
  variant?: ButtonVariant;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      data-variant={variant}
      className={`${baseClasses} ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
