"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { ModernSpinner } from "elestampadero/shared/ui/motion";

export type DashboardPeriod = "day" | "week" | "month" | "year";

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: "day", label: "Día" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "year", label: "Año" },
];

function periodHref(period: DashboardPeriod) {
  return period === "month" ? "/admin" : `/admin?period=${period}`;
}

export function DashboardPeriodNav({ period }: { period: DashboardPeriod }) {
  const router = useRouter();
  const [pendingPeriod, setPendingPeriod] = useState<DashboardPeriod | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const isLoading = pendingPeriod !== null || isPending;

  useEffect(() => {
    setPendingPeriod(null);
  }, [period]);

  return (
    <>
      <nav className="admin-period-nav" aria-label="Período del dashboard">
        {PERIODS.map((item) => {
          const isActive = (pendingPeriod ?? period) === item.value;

          return (
            <Link
              key={item.value}
              href={periodHref(item.value)}
              scroll={false}
              aria-current={period === item.value ? "page" : undefined}
              aria-disabled={isLoading || undefined}
              onClick={(event) => {
                event.preventDefault();
                if (isLoading || item.value === period) return;

                setPendingPeriod(item.value);
                startTransition(() => {
                  router.push(periodHref(item.value), { scroll: false });
                });
              }}
              className={`admin-chip ${isActive ? "admin-chip--active" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {isLoading ? (
        <div className="admin-dashboard-period-loader" role="status">
          <div className="admin-dashboard-period-loader__content">
            <ModernSpinner
              className="modern-spinner--large"
              label="Cargando..."
            />
            <span>Actualizando período</span>
          </div>
        </div>
      ) : null}
    </>
  );
}
