import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

interface UnderlineLinkProps extends ComponentPropsWithoutRef<typeof Link> {

  active?: boolean;
}









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
