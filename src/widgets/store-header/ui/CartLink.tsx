import Link from "next/link";

import { routes } from "elestampadero/shared/config/routes";
import { CartIcon } from "elestampadero/shared/ui";

export function CartLink() {
  return (
    <Link
      href={routes.cart}
      data-loading-label="Carrito"
      className="brand-action brand-cut bg-mint text-deep hover:bg-mid focus-visible:bg-mid inline-flex items-center gap-2.5 px-[clamp(16px,1.1vw,22px)] py-[clamp(8px,.6vw,12px)] text-[clamp(14px,1.2vw,24px)] font-bold whitespace-nowrap hover:text-white focus-visible:text-white"
    >
      <CartIcon className="h-[1.15em] w-[1.15em] shrink-0" />
      Carrito
    </Link>
  );
}
