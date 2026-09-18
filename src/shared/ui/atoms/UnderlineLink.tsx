import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

interface UnderlineLinkProps extends ComponentPropsWithoutRef<typeof Link> {
  /** Holds the rule open, for the view the reader is already on. */
  active?: boolean;
}

/**
 * Text link whose underline grows out from the centre on hover and focus.
 *
 * Scaling a full-width bar keeps the effect on the compositor — animating
 * `width` would lay the surrounding text out again on every frame. `w-fit`
 * matters in stacked layouts such as the footer, where the link would otherwise
 * fill its column and draw a rule far wider than its label.
 */
export function UnderlineLink({
  active = false,
  className = "",
  children,
  ...props
}: UnderlineLinkProps) {
  return (
    <Link
      {...props}
      className={`group relative w-fit transition-colors ${
        active ? "text-mint" : "hover:text-mint focus-visible:text-mint"
      } ${className}`}
    >
      {children}
      <span
        aria-hidden="true"
        className={`bg-mint absolute -bottom-1 left-0 h-[2px] w-full origin-center transition-transform duration-300 ease-out motion-reduce:transition-none ${
          active
            ? "scale-x-100"
            : "scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100"
        }`}
      />
    </Link>
  );
}
