"use client";

import type { ComponentProps } from "react";

import { Button } from "elestampadero/shared/ui";

type AdminAddButtonProps = Omit<
  ComponentProps<typeof Button>,
  "variant"
>;

export function AdminAddButton({
  className = "",
  children,
  ...props
}: AdminAddButtonProps) {
  return (
    <Button
      variant="mint"
      className={`admin-add-button ${className}`}
      {...props}
    >
      <svg
        className="admin-add-button__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        shapeRendering="geometricPrecision"
        aria-hidden="true"
      >
        <path d="M12 4v16M4 12h16" />
      </svg>
      <span>{children}</span>
    </Button>
  );
}
