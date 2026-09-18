"use client";

import { m } from "motion/react";

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <m.div
      className="skeleton-grid"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, index) => (
        <m.div
          key={index}
          className="skeleton-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.02, duration: 0.28 }}
        >
          <span className="skeleton-shimmer skeleton-card__image" />
          <span className="skeleton-shimmer skeleton-card__line" />
          <span className="skeleton-shimmer skeleton-card__line skeleton-card__line--short" />
        </m.div>
      ))}
    </m.div>
  );
}
