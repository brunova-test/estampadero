"use client";

import { usePathname } from "next/navigation";

import { UnderlineLink } from "elestampadero/shared/ui";

interface NavLink {
  label: string;
  href: string;
}

/** Breathing room above a section that is taller than the screen. */
const CLEARANCE = 24;

/**
 * Distance from the top of the document, from layout rather than
 * `getBoundingClientRect`. A section still waiting to be revealed carries the
 * reveal's `translateY`, which the rect would include and the scroll would then
 * overshoot by once the section settled.
 */
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

  /**
   * Centres the target instead of parking its top edge under the header, which
   * left short sections showing little more than their heading. Sections taller
   * than the viewport fill it either way, so those keep a top alignment.
   */
  function scrollToSection(
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    const [path, fragment] = href.split("#");
    if (!fragment) return;
    // Coming from another view, let Next load the page and land on the anchor.
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

    // Links like `/#clubes` only scroll to a section of the page you are
    // already on, so they never claim the current-view marker.
    if (fragment) return false;

    const target = path === "" ? "/" : path;
    // A product page keeps its catalogue entry lit.
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
