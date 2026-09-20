"use client";

import { usePathname } from "next/navigation";

import { UnderlineLink } from "elestampadero/shared/ui";

interface NavLink {
  label: string;
  href: string;
}


const CLEARANCE = 24;







function layoutTop(element: HTMLElement) {
  let top = 0;
  let node: HTMLElement | null = element;

  while (node) {
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }

  return top;
}

export function StoreNav({ links }: { links: readonly NavLink[] }) {
  const pathname = usePathname();






  function scrollToSection(
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    const [path, fragment] = href.split("#");
    if (!fragment) return;

    if (pathname !== (path === "" ? "/" : path)) return;

    const target = document.getElementById(fragment);
    if (!target) return;

    event.preventDefault();

    const spare = window.innerHeight - target.offsetHeight;
    const alignToTop = fragment === "promo-egresados" || fragment === "clubes";
    const destination = alignToTop
      ? layoutTop(target)
      : layoutTop(target) - (spare > 0 ? spare / 2 : CLEARANCE);

    window.scrollTo({
      top: Math.max(0, destination),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });

    window.history.pushState(null, "", href);
  }

  function isActive(href: string) {
    const [path, fragment] = href.split("#");



    if (fragment) return false;

    const target = path === "" ? "/" : path;

    return pathname === target || pathname.startsWith(`${target}/`);
  }

  return (
    <nav className="hidden items-center gap-[clamp(16px,1.9vw,38px)] text-[clamp(14px,1.3vw,26px)] font-semibold lg:flex">
      {links.map((link) => {
        const active = isActive(link.href);

        return (
          <UnderlineLink
            key={link.href}
            href={link.href}
            active={active}
            data-loading-label={link.label}
            aria-current={active ? "page" : undefined}
            onClick={(event) => scrollToSection(event, link.href)}
            className={active ? "" : "text-white"}
          >
            {link.label}
          </UnderlineLink>
        );
      })}
    </nav>
  );
}
