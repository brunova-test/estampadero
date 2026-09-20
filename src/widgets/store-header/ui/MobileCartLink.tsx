"use client";

import Link from "next/link";

import { cartTotalQuantity, useCartStore } from "elestampadero/entities/cart";
import { routes } from "elestampadero/shared/config/routes";

export function MobileCartLink() {
  const quantity = useCartStore((state) => cartTotalQuantity(state.lines));

  return (
    <Link
      href={routes.cart}
      data-loading-label="Carrito"
      aria-label={quantity > 0 ? `Carrito, ${quantity} productos` : "Carrito"}
      title="Carrito"
      className="hover:text-mint focus-visible:text-mint relative mr-1 grid h-11 w-11 place-items-center text-white transition-colors md:hidden"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
        <path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6" />
      </svg>
      {quantity > 0 ? (
        <span className="bg-deep border-ink absolute top-0 right-1 grid min-h-5 min-w-5 place-items-center rounded-full border-2 px-1 text-[10px] leading-none font-black text-white">
          {quantity > 99 ? "99+" : quantity}
        </span>
      ) : null}
    </Link>
  );
}
