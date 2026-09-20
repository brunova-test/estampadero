"use client";

import { animate, stagger } from "motion";
import { m } from "motion/react";
import { useEffect, useRef, useState } from "react";




export type RevealDirection = "up" | "down" | "left" | "right" | "none";



const EASE: [number, number, number, number] = [0.33, 1, 0.68, 1];
const DISTANCE = 18;
const DURATION = 0.45;

const AMOUNT = 0.15;


const THRESHOLDS = Array.from({ length: 21 }, (_, step) => step / 20);

interface RevealBaseProps {
  children: React.ReactNode;
  direction?: RevealDirection;

  distance?: number;

  duration?: number;

  delay?: number;

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













function useRevealOnScrollDown(amount: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {


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





      style={hidden}
      animate={shown ? { opacity: 1, x: 0, y: 0 } : hidden}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </m.div>
  );
}

interface RevealGroupProps extends RevealBaseProps {

  stagger?: number;
}








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



      transition={{ duration: 0.25, ease: EASE }}
    >
      {children}
    </m.div>
  );
}
