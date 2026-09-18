"use client";

import { animate, stagger } from "motion";
import { m } from "motion/react";
import { useEffect, useRef, useState } from "react";

/** Direction the element travels *towards* as it settles into place. `"up"`
 * therefore starts below its resting spot and rises, which is the default
 * reveal used across the site. */
export type RevealDirection = "up" | "down" | "left" | "right" | "none";

/** easeOutCubic. Gentler than the quint curve used for route changes: it leaves
 * with less initial velocity, so the reveal eases in rather than snapping. */
const EASE: [number, number, number, number] = [0.33, 1, 0.68, 1];
const DISTANCE = 18;
const DURATION = 0.45;
/** Fraction of the element that must be on screen before the reveal fires. */
const AMOUNT = 0.15;
/** Enough steps that the observer keeps reporting while an element crosses the
 * trigger line, instead of only at 0% and 100%. */
const THRESHOLDS = Array.from({ length: 21 }, (_, step) => step / 20);

interface RevealBaseProps {
  children: React.ReactNode;
  direction?: RevealDirection;
  /** Travel distance in px. */
  distance?: number;
  /** Seconds. Keep between 0.4 and 0.7 so the page still feels responsive. */
  duration?: number;
  /** Seconds to wait before starting. */
  delay?: number;
  /** Fraction of the element that must be on screen to trigger the reveal. */
  amount?: number;
  className?: string;
}

function offsetFor(direction: RevealDirection, distance: number) {
  switch (direction) {
    case "up":
      return { y: distance };
    case "down":
      return { y: -distance };
    case "left":
      return { x: distance };
    case "right":
      return { x: -distance };
    case "none":
      return {};
  }
}

/**
 * Reveals on the way down only.
 *
 * An element is re-armed solely when it drops back *below* the viewport, never
 * when it passes above it. Scrolling down therefore plays the reveal, scrolling
 * back up finds everything already in place, and going down past the same
 * content plays it again.
 *
 * This is why `whileInView` isn't used: it reverts whenever the element leaves,
 * whichever edge it leaves by, which is what made the reveal replay on the way
 * up.
 */
function useRevealOnScrollDown(amount: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Compare visible pixels rather than the raw ratio: an element taller
          // than the viewport can never reach `amount` of its own height.
          const trigger =
            Math.min(entry.boundingClientRect.height, window.innerHeight) *
            amount;

          if (
            entry.isIntersecting &&
            entry.intersectionRect.height >= trigger
          ) {
            setShown(true);
          } else if (
            !entry.isIntersecting &&
            entry.boundingClientRect.top > 0
          ) {
            // Below the viewport — we scrolled back up past it, so arm it for
            // the next trip down. Above the viewport it stays revealed.
            setShown(false);
          }
        }
      },
      { threshold: THRESHOLDS },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [amount]);

  return [ref, shown] as const;
}

/**
 * Fades a single element into place as it scrolls in. See
 * `useRevealOnScrollDown` for why it only fires on the way down.
 *
 * Only `opacity` and `transform` are animated, and the hidden state is part of
 * the server-rendered markup, so nothing flashes on load and nothing reflows.
 *
 * Reduced motion is handled in globals.css, not here: the server cannot know
 * the visitor's preference, so branching on it during render guarantees an
 * SSR/client mismatch. That rule keeps the fade and drops the travel.
 */
export function RevealOnScroll({
  children,
  direction = "up",
  distance = DISTANCE,
  duration = DURATION,
  delay = 0,
  amount = AMOUNT,
  className,
}: RevealBaseProps) {
  const [ref, shown] = useRevealOnScrollDown(amount);
  const hidden = { opacity: 0, ...offsetFor(direction, distance) };

  return (
    <m.div
      ref={ref}
      data-reveal-root
      className={className}
      // The resting state lives in `style` so it is serialised into the SSR
      // markup: the element is hidden on first paint, with no flash and no
      // hydration mismatch. (`initial` would be ignored anyway — the app renders
      // inside an <AnimatePresence initial={false}>, which suppresses it on
      // every descendant.)
      style={hidden}
      animate={shown ? { opacity: 1, x: 0, y: 0 } : hidden}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </m.div>
  );
}

interface RevealGroupProps extends RevealBaseProps {
  /** Seconds between each child. Small values read as one flowing gesture. */
  stagger?: number;
}

/**
 * Staggered variant for card grids. This renders the grid container itself —
 * pass the container's classes via `className` and it replaces the plain
 * `div`, so no extra DOM lands between the grid and its items and the layout is
 * untouched. Direct children are revealed one after another, on the way down
 * only, same as RevealOnScroll.
 */
export function RevealGroup({
  children,
  direction = "up",
  distance = DISTANCE,
  duration = DURATION,
  delay = 0,
  amount = AMOUNT,
  stagger: step = 0.1,
  className,
}: RevealGroupProps) {
  const [ref, shown] = useRevealOnScrollDown(amount);

  const offset = offsetFor(direction, distance);
  const hidden = `translate(${offset.x ?? 0}px, ${offset.y ?? 0}px)`;

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const items = Array.from(root.children) as HTMLElement[];
    if (items.length === 0) return;

    if (!shown) {
      // Also runs on mount, so the children are primed before the first scroll
      // and never flash at their resting position.
      for (const item of items) {
        item.style.opacity = "0";
        item.style.transform = hidden;
      }
      return;
    }

    const controls = animate(
      items,
      { opacity: [0, 1], transform: [hidden, "none"] },
      { duration, delay: stagger(step, { startDelay: delay }), ease: EASE },
    );

    return () => controls.stop();
  }, [ref, shown, hidden, duration, delay, step]);

  return (
    <m.div
      ref={ref}
      data-reveal-root
      className={className}
      style={{ opacity: 0 }}
      animate={{ opacity: shown ? 1 : 0 }}
      // Short on purpose: this only uncovers the container so the children's
      // own stagger is what reads. A long fade here would compound with theirs
      // and muddy it.
      transition={{ duration: 0.25, ease: EASE }}
    >
      {children}
    </m.div>
  );
}
