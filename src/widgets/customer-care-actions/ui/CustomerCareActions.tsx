"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function CustomerCareActions() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/club")) return null;
  return (
    <nav aria-label="Atención posventa" className="fixed bottom-5 left-5 z-40 hidden flex-col items-start gap-2 md:flex lg:bottom-8 lg:left-8">
      <Link href="/reclamos-devoluciones" className="border-deep text-deep inline-flex rounded-full border-2 bg-white/65 px-3.5 py-2 text-xs font-extrabold tracking-wide uppercase opacity-75 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-white hover:opacity-100 focus-visible:bg-white focus-visible:opacity-100">Reclamos / devoluciones</Link>
      <Link href="/arrepentimiento" className="bg-mint text-deep inline-flex rounded-full px-3.5 py-2 text-xs font-extrabold tracking-wide uppercase opacity-75 shadow-lg transition-all hover:-translate-y-0.5 hover:opacity-100 focus-visible:opacity-100">Arrepentimiento</Link>
    </nav>
  );
}
