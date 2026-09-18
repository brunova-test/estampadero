"use client";

import { animate, stagger } from "motion";
import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  m,
  MotionConfig,
} from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Travel only, no scale: resizing a whole section reads as a lurch, and it is
// the first thing to drop when softening the reveal. Kept in step with the
// RevealOnScroll defaults so pages using either path feel the same.
const HIDDEN_SECTION = "translateY(22px)";
const HIDDEN_ITEM = "translateY(18px)";
const VISIBLE = "translateY(0px)";
const EASE = [0.33, 1, 0.68, 1] as const;
/** Fraction of the element (or of the viewport, whichever is smaller) that has
 * to be on screen before the reveal fires. */
const ENTER_RATIO = 0.15;
/** Enough steps that the observer keeps reporting while a section crosses the
 * trigger line, instead of only at 0% and 100%. */
const THRESHOLDS = Array.from({ length: 21 }, (_, step) => step / 20);

export function MotionExperience({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const routeKey = pathname.startsWith("/admin") ? "admin-shell" : pathname;
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    // Admin pages contain nested client boundaries. Mutating their sections
    // from this parent effect can happen before those boundaries hydrate and
    // leaves React comparing server markup against animation inline styles.
    if (
      !root ||
      pathname.startsWith("/admin") ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const targets = Array.from(
      root.querySelectorAll<HTMLElement>(
        "main section:not([data-motion-ignore]), [data-motion-reveal]",
      ),
    ).filter(
      (element, index, items) =>
        items.indexOf(element) === index &&
        // Anything wrapped in a <RevealOnScroll> already declares its own
        // reveal; animating it here too would double up the fade.
        !element.closest("[data-reveal-root]"),
    );

    // Which sections are currently shown. A section only re-arms once it has
    // left the viewport completely, so the reveal replays every time you scroll
    // past it — in either direction — without flickering when you park the
    // scroll right on the trigger line.
    const shown = new Set<HTMLElement>();
    const running = new Map<HTMLElement, ReturnType<typeof animate>[]>();

    function itemsOf(element: HTMLElement) {
      return element.querySelectorAll<HTMLElement>(
        "[data-motion-item], article",
      );
    }

    function stopAnimations(element: HTMLElement) {
      running.get(element)?.forEach((animation) => animation.stop());
      running.delete(element);
    }

    function hide(element: HTMLElement) {
      stopAnimations(element);
      element.style.opacity = "0";
      element.style.transform = HIDDEN_SECTION;
      itemsOf(element).forEach((item) => {
        item.style.opacity = "0";
        item.style.transform = HIDDEN_ITEM;
      });
    }

    function reveal(element: HTMLElement) {
      stopAnimations(element);

      const animations = [
        animate(
          element,
          { opacity: 1, transform: VISIBLE },
          { duration: 0.45, ease: EASE },
        ),
      ];

      const items = itemsOf(element);
      if (items.length > 0) {
        animations.push(
          animate(
            items,
            { opacity: [0, 1], transform: [HIDDEN_ITEM, VISIBLE] },
            { delay: stagger(0.06), duration: 0.45, ease: EASE },
          ),
        );
      }

      running.set(element, animations);
    }

    targets.forEach(hide);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement;
          // Compare visible pixels rather than the raw ratio: a section taller
          // than the viewport can never reach ENTER_RATIO of its own height.
          const trigger =
            Math.min(entry.boundingClientRect.height, window.innerHeight) *
            ENTER_RATIO;

          if (
            entry.isIntersecting &&
            entry.intersectionRect.height >= trigger
          ) {
            if (!shown.has(element)) {
              shown.add(element);
              reveal(element);
            }
          } else if (
            !entry.isIntersecting &&
            shown.has(element) &&
            // Only re-arm once the section has dropped back below the viewport.
            // A section that passed above it stays revealed, so scrolling up
            // never replays the reveal.
            entry.boundingClientRect.top > 0
          ) {
            shown.delete(element);
            hide(element);
          }
        });
      },
      { threshold: THRESHOLDS },
    );

    targets.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      targets.forEach(stopAnimations);
    };
  }, [pathname]);

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig
        reducedMotion="user"
        transition={{ ease: [0.22, 1, 0.36, 1] }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={routeKey}
            ref={rootRef}
            className="motion-route"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
            {children}
          </m.div>
        </AnimatePresence>
      </MotionConfig>
    </LazyMotion>
  );
}
