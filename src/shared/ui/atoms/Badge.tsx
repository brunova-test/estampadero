import type { ComponentPropsWithoutRef } from "react";

const VARIANT_CLASSES = {
  mint: "bg-mint text-deep",
  dark: "bg-ink/80 text-white",
  outline: "border border-current",
} as const;

type BadgeVariant = keyof typeof VARIANT_CLASSES;

interface BadgeProps extends ComponentPropsWithoutRef<"span"> {
  variant?: BadgeVariant;
}

export function Badge({
  variant = "mint",
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded px-3 py-1 font-mono text-xs font-medium tracking-wider uppercase ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
