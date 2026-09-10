"use client";

import { ModernSpinner } from "elestampadero/shared/ui/motion";

export default function AdminLoading() {
  return (
    <div className="admin-route-fallback" role="status">
      <ModernSpinner className="modern-spinner--large" label="Cargando..." />
      <span>Cargando...</span>
    </div>
  );
}
