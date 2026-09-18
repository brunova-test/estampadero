"use client";

import { useEffect, useMemo, useState } from "react";

import { formatCents } from "elestampadero/shared/lib/money";
import {
  AdminAddButton,
  AdminPage,
  AdminPanel,
  AdminStat,
  DocumentUploadField,
} from "elestampadero/shared/ui/admin";
import { ModernSpinner } from "elestampadero/shared/ui/motion";
import { api } from "elestampadero/trpc/react";

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Pendiente de transferencia",
  PAID: "Transferida",
  CANCELLED: "Cancelada",
};

const STATUS_CLASS: Record<string, string> = {
  PENDING_PAYMENT: "admin-chip--warning",
  PAID: "admin-chip--success",
  CANCELLED: "admin-chip--danger",
};

const MOVEMENT_STATUS_LABEL: Record<string, string> = {
  ACCRUED: "Generada",
  PENDING_RELEASE: "Esperando liberación",
  PENDING_DELIVERY: "Entrega pendiente",
  RETURN_WINDOW: "En devolución",
  AVAILABLE: "Disponible",
  IN_SETTLEMENT: "En liquidación",
  SETTLED: "Liquidada",
  REVERSED: "Revertida",
};

const MOVEMENT_STATUS_HELP: Record<string, string> = {
  ACCRUED:
    "La comisión se generó a partir de una venta, pero todavía está pendiente de avanzar en el circuito de liquidación.",
  PENDING_RELEASE:
    "La comisión está retenida hasta que se libere el dinero del pago. Cuando finalice ese proceso, pasará a “Disponible” para liquidarla.",
  PENDING_DELIVERY:
    "El pedido todavía no fue entregado. La comisión quedará en espera hasta que se confirme la entrega.",
  RETURN_WINDOW:
    "El pedido fue entregado, pero todavía está vigente el período en el que el cliente puede solicitar una devolución.",
  AVAILABLE:
    "La comisión ya está disponible y puede incluirse en una liquidación para el socio.",
  IN_SETTLEMENT:
    "La comisión ya fue incluida en una liquidación y está a la espera de que se confirme el pago al socio.",
  SETTLED:
    "La comisión ya fue liquidada: el pago correspondiente al socio fue confirmado.",
  REVERSED:
    "La comisión fue revertida, generalmente por una anulación, devolución o ajuste de la venta.",
};

function SettlementFilterIcon({
  kind,
}: {
  kind:
    | "search"
    | "calendar"
    | "clock"
    | "group"
    | "check"
    | "sliders"
    | "plus"
    | "info";
}) {
  return (
    <svg
      className="admin-settlement-filter-icon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      {kind === "search" ? (
        <>
          <circle cx="11" cy="11" r="7" />
          <path d="m16 16 5 5" />
        </>
      ) : kind === "calendar" ? (
        <>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4m8-4v4M4 10h16" />
        </>
      ) : kind === "clock" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </>
      ) : kind === "group" ? (
        <>
          <circle cx="9" cy="9" r="3" />
          <circle cx="17" cy="10" r="2" />
          <path d="M3 20c.5-4 2.5-6 6-6s5.5 2 6 6m0-5c3 0 5 1.5 6 4" />
        </>
      ) : kind === "check" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 2.7 2.7L16.5 9" />
        </>
      ) : kind === "sliders" ? (
        <>
          <path d="M4 7h7m4 0h5M4 17h4m4 0h8" />
          <circle cx="13" cy="7" r="2" />
          <circle cx="10" cy="17" r="2" />
        </>
      ) : kind === "info" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5m0-8v.2" />
        </>
      ) : (
        <path d="M12 5v14M5 12h14" />
      )}
    </svg>
  );
}

function MovementItemIcon({
  kind,
}: {
  kind: "product" | "club" | "person" | "order" | "status" | "date" | "amount";
}) {
  return (
    <svg
      className="admin-settlement-movement-icon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      {kind === "product" ? (
        <path d="M8 4 4 7l3 4 2-1v10h10V10l2 1 3-4-4-3-3 3h-6L8 4Z" />
      ) : kind === "club" ? (
        <>
          <path d="M4 20h16M6 20V9h12v11M4 9l8-5 8 5" />
          <path d="M10 20v-5h4v5" />
        </>
      ) : kind === "person" ? (
        <>
          <circle cx="12" cy="8" r="3" />
          <path d="M6 20c.5-4 2.5-6 6-6s5.5 2 6 6" />
        </>
      ) : kind === "order" ? (
        <>
          <path d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h4" />
        </>
      ) : kind === "status" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 3 3 5-6" />
        </>
      ) : kind === "date" ? (
        <>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4m8-4v4M4 10h16" />
        </>
      ) : (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M15 8.5c-.7-.5-1.7-.8-2.8-.8-1.5 0-2.7.7-2.7 1.8 0 2.8 5.5 1.2 5.5 4.3 0 1.3-1.2 2.2-3 2.2-1.2 0-2.4-.4-3.2-1M12 5.5v13" />
        </>
      )}
    </svg>
  );
}

function localDateValue(date: Date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) =>
      index === 0 ? String(part) : String(part).padStart(2, "0"),
    )
    .join("-");
}

function dateRange(period: "day" | "week" | "month" | "year", value: string) {
  const date = new Date(`${value}T00:00:00`);
  const start = new Date(date);
  const end = new Date(date);
  if (period === "week") {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
    end.setTime(start.getTime());
    end.setDate(end.getDate() + 6);
  } else if (period === "month") {
    start.setDate(1);
    end.setMonth(end.getMonth() + 1, 0);
  } else if (period === "year") {
    start.setMonth(0, 1);
    end.setMonth(11, 31);
  }
  end.setHours(23, 59, 59, 999);
  return { from: start, to: end };
}

function SettlementPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const utils = api.useUtils();
  const query = api.settlements.byId.useQuery({ id });
  const [receiptUrl, setReceiptUrl] = useState("");
  const [confirming, setConfirming] = useState(false);
  const markPaid = api.settlements.markPaid.useMutation({
    onSuccess: async () => {
      setConfirming(false);
      await Promise.all([
        utils.settlements.listByClub.invalidate(),
        query.refetch(),
      ]);
    },
  });
  const item = query.data;

  useEffect(() => setReceiptUrl(item?.receiptUrl ?? ""), [item?.receiptUrl]);

  if (query.isLoading || !item) {
    return (
      <div className="admin-settlement-modal-backdrop">
        <aside className="admin-settlement-modal admin-settlement-loading">
          <ModernSpinner label="Cargando..." />
        </aside>
      </div>
    );
  }

  const isPaid = item.status === "PAID";
  const unitCount = item.items.reduce((sum, line) => sum + line.quantity, 0);
  return (
    <div className="admin-settlement-modal-backdrop">
      <aside
        className="admin-settlement-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settlement-modal-title"
      >
        <button
          type="button"
          className="admin-modal-close"
          aria-label="Cerrar liquidación"
          onClick={onClose}
        >
          ×
        </button>
        <header>
          <span>
            {isPaid ? "Participación liquidada" : "Transferencia pendiente"}
          </span>
          <h2 id="settlement-modal-title">
            {isPaid ? "Detalle" : "Liquidar"} · {item.clubName} ·{" "}
            {item.periodLabel}
          </h2>
          <p>
            {item.items.length} productos vendidos · {unitCount} unidades
            relacionadas
          </p>
        </header>

        <div className="admin-settlement-breakdown">
          <h3>Comisiones incluidas</h3>
          {item.items.map((line) => (
            <div key={line.id}>
              <small>
                Venta #{String(line.orderNumber).padStart(6, "0")} ·{" "}
                {line.productName} · {line.quantity}{" "}
                {line.quantity === 1 ? "unidad" : "unidades"} ·{" "}
                {line.percentageApplied}%
              </small>
              <strong>{formatCents(line.amountInCents)}</strong>
            </div>
          ))}
        </div>

        <div className="admin-settlement-total">
          <span>Total a transferir</span>
          <strong>{formatCents(item.totalInCents)}</strong>
        </div>

        <CopyField label="CBU/CVU" value={item.payoutCbu ?? "No configurado"} />
        <CopyField label="Importe" value={formatCents(item.totalInCents)} />

        {isPaid ? (
          <div className="admin-settlement-proof-complete">
            <span>Transferencia confirmada</span>
            <strong>
              {item.paidAt
                ? new Date(item.paidAt).toLocaleString("es-AR")
                : "Fecha no disponible"}
            </strong>
            {item.receiptUrl ? (
              <a href={item.receiptUrl} target="_blank" rel="noreferrer">
                Ver comprobante
              </a>
            ) : null}
          </div>
        ) : (
          <section className="admin-settlement-proof-step">
            <h3>Comprobante obligatorio</h3>
            <p>
              Realizá la transferencia y subí el comprobante antes de marcar la
              liquidación como pagada.
            </p>
            <DocumentUploadField value={receiptUrl} onChange={setReceiptUrl} />
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              disabled={!receiptUrl || !item.payoutCbu || markPaid.isPending}
              onClick={() => setConfirming(true)}
            >
              Confirmar transferencia
            </button>
            {!item.payoutCbu ? (
              <small role="alert">
                Configurá el CBU/CVU del club antes de confirmar el pago.
              </small>
            ) : null}
          </section>
        )}

        <section className="admin-settlement-history">
          <h3>Historial</h3>
          {item.events.map((event) => (
            <div key={event.id}>
              <span>{event.summary}</span>
              <time dateTime={event.createdAt}>
                {new Date(event.createdAt).toLocaleString("es-AR")}
              </time>
            </div>
          ))}
        </section>

        {confirming ? (
          <div
            className="admin-settlement-confirm"
            role="alertdialog"
            aria-modal="true"
          >
            <div>
              <span aria-hidden="true">!</span>
              <h3>¿Confirmar la transferencia?</h3>
              <p>
                Se marcarán como liquidadas {item.items.length} comisiones por
                un total de <strong>{formatCents(item.totalInCents)}</strong>.
                Esta acción quedará registrada en el historial.
              </p>
              <footer>
                <button type="button" onClick={() => setConfirming(false)}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="is-primary"
                  disabled={markPaid.isPending}
                  onClick={() =>
                    markPaid.mutate({ settlementId: item.id, receiptUrl })
                  }
                >
                  {markPaid.isPending ? "Confirmando…" : "Sí, confirmar pago"}
                </button>
              </footer>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="admin-copy-field">
      <span>
        <small>{label}</small>
        {value}
      </span>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        }}
      >
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}

function MovementList({
  movements,
  loading,
  resetKey,
}: {
  movements: Array<{
    id: string;
    clubName: string;
    contactName: string;
    contactEmail: string;
    orderNumber: number;
    productName: string;
    amountInCents: number;
    percentageApplied: number;
    status: string;
    createdAt: string;
  }>;
  loading: boolean;
  resetKey: string;
}) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(movements.length / pageSize));
  const visibleMovements = movements.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  if (loading) {
    return (
      <div className="admin-settlement-movements-loading">
        <ModernSpinner label="Cargando..." />
      </div>
    );
  }
  if (!movements.length) {
    return (
      <p className="admin-settlement-movements-empty">
        No hay movimientos para los filtros seleccionados.
      </p>
    );
  }
  return (
    <>
      <div className="admin-settlement-movement-groups">
        <section>
          <header className="admin-settlement-table-context">
            <div>
              <h2>Movimientos por compra</h2>
              <p>El comprador es la persona informada al realizar el pedido.</p>
            </div>
            <span>{movements.length} movimientos</span>
          </header>
          <div className="admin-settlement-movement-table-wrap">
            <table className="admin-settlement-movement-table">
              <thead>
                <tr>
                  <th>
                    <span>Producto</span>
                  </th>
                  <th>
                    <span>Club / gimnasio</span>
                  </th>
                  <th>
                    <span>Comprador del pedido</span>
                  </th>
                  <th>
                    <span>Pedido</span>
                  </th>
                  <th>
                    <span>Estado</span>
                  </th>
                  <th>
                    <span>Fecha y hora</span>
                  </th>
                  <th>
                    <span>Comisión generada</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleMovements.map((movement) => (
                  <tr key={movement.id}>
                    <td>
                      <strong>{movement.productName}</strong>
                    </td>
                    <td>{movement.clubName}</td>
                    <td>
                      <span className="admin-settlement-buyer">
                        <strong>{movement.contactName}</strong>
                        <small>{movement.contactEmail}</small>
                      </span>
                    </td>
                    <td>#{movement.orderNumber}</td>
                    <td>
                      <span className="admin-settlement-status-help">
                        <span
                          className={`admin-chip admin-chip--${movement.status === "SETTLED" ? "success" : movement.status === "REVERSED" ? "danger" : movement.status === "ACCRUED" ? "warning" : "info"}`}
                          tabIndex={0}
                          aria-describedby={`movement-status-help-${movement.id}`}
                        >
                          {movement.status === "PENDING_RELEASE"
                            ? "En espera"
                            : (MOVEMENT_STATUS_LABEL[movement.status] ??
                              movement.status)}
                        </span>
                        <span
                          id={`movement-status-help-${movement.id}`}
                          className="admin-settlement-status-help__tooltip"
                          role="tooltip"
                        >
                          {MOVEMENT_STATUS_HELP[movement.status] ??
                            "Estado actual de la comisión."}
                        </span>
                      </span>
                    </td>
                    <td>
                      <time dateTime={movement.createdAt}>
                        {new Date(movement.createdAt).toLocaleString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </td>
                    <td>
                      <strong>{formatCents(movement.amountInCents)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      <nav
        className="admin-settlement-movement-pagination"
        aria-label="Páginas de liquidaciones"
      >
        <small>
          Mostrando {(page - 1) * pageSize + 1}–
          {Math.min(page * pageSize, movements.length)} de {movements.length}
        </small>
        <button
          type="button"
          disabled={page === 1}
          onClick={() => setPage((current) => current - 1)}
        >
          Anterior
        </button>
        <span>
          Página {page} de {totalPages}
        </span>
        <button
          type="button"
          disabled={page === totalPages}
          onClick={() => setPage((current) => current + 1)}
        >
          Siguiente
        </button>
      </nav>
    </>
  );
}

export function AdminSettlementsView() {
  const [movementSearch, setMovementSearch] = useState("");
  const [movementPeriod, setMovementPeriod] = useState<
    "day" | "week" | "month" | "year"
  >("year");
  const [movementDate, setMovementDate] = useState(() =>
    localDateValue(new Date()),
  );
  const [hourFrom, setHourFrom] = useState<number | undefined>();
  const [hourTo, setHourTo] = useState<number | undefined>();
  const movementRange = useMemo(
    () => dateRange(movementPeriod, movementDate),
    [movementDate, movementPeriod],
  );
  const movements = api.settlements.listMovements.useQuery(
    {
      search: movementSearch.trim() || undefined,
      ...movementRange,
      hourFrom,
      hourTo,
    },
    { refetchInterval: 5000 },
  );
  const all = api.settlements.listByClub.useQuery({});

  const pendingItems =
    all.data?.filter((item) => item.status === "PENDING_PAYMENT") ?? [];
  const paidItems = all.data?.filter((item) => item.status === "PAID") ?? [];
  const pending = pendingItems.reduce(
    (sum, item) => sum + item.totalInCents,
    0,
  );
  const paid = paidItems.reduce((sum, item) => sum + item.totalInCents, 0);

  const clearMovementFilters = () => {
    setMovementSearch("");
    setMovementPeriod("year");
    setMovementDate(localDateValue(new Date()));
    setHourFrom(undefined);
    setHourTo(undefined);
  };

  return (
    <AdminPage
      module="Módulo de Pagos"
      title="Liquidaciones"
      className="admin-settlements-page"
      hideHeader
    >
      <AdminPanel className="admin-panel-pad admin-settlements-panel">
        <section className="admin-settlement-movements">
          <div className="admin-settlement-module-heading">
            <div>
              <p className="admin-settlements-eyebrow">Módulo de Pagos</p>
              <h1 className="admin-settlement-reference-title">
                Liquidaciones
              </h1>
            </div>
            <AdminAddButton
              className="admin-settlement-new-button"
              type="button"
              onClick={() => void movements.refetch()}
            >
              Nueva liquidación
            </AdminAddButton>
          </div>
          <div className="admin-settlement-summary-grid">
            <article className="admin-settlement-summary-card admin-settlement-summary-card--pending">
              <span className="admin-settlement-summary-icon">
                <SettlementFilterIcon kind="clock" />
              </span>
              <div>
                <strong>Pendiente de acreditar</strong>
                <b>{formatCents(pending)}</b>
                <small>{pendingItems.length} transferencias en proceso</small>
              </div>
            </article>
            <article className="admin-settlement-summary-card admin-settlement-summary-card--paid">
              <span className="admin-settlement-summary-icon">
                <SettlementFilterIcon kind="check" />
              </span>
              <div>
                <strong>Total acreditado</strong>
                <b>{formatCents(paid)}</b>
                <small>{paidItems.length} transferencias completadas</small>
              </div>
            </article>
          </div>
          <div className="admin-settlement-movement-filters">
            <div className="admin-settlement-filter-control admin-settlement-filter-control--period">
              <span>Periodo</span>
              <div
                className="admin-settlement-period-tabs"
                role="tablist"
                aria-label="Período"
              >
                {(
                  [
                    ["day", "Día"],
                    ["week", "Semana"],
                    ["month", "Mes"],
                    ["year", "Año"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    className={movementPeriod === value ? "active" : ""}
                    onClick={() => setMovementPeriod(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <label>
              <span>Fecha</span>
              <span className="admin-settlement-input-shell">
                <SettlementFilterIcon kind="calendar" />
                <input
                  className="admin-input"
                  type="date"
                  value={movementDate}
                  onChange={(event) => setMovementDate(event.target.value)}
                />
              </span>
            </label>
            <label>
              <span>Desde</span>
              <span className="admin-settlement-input-shell">
                <SettlementFilterIcon kind="clock" />
                <select
                  className="admin-select"
                  value={hourFrom ?? ""}
                  onChange={(event) =>
                    setHourFrom(
                      event.target.value
                        ? Number(event.target.value)
                        : undefined,
                    )
                  }
                >
                  <option value="">Hora inicial</option>
                  {Array.from({ length: 24 }, (_, hour) => (
                    <option key={hour} value={hour}>
                      {String(hour).padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
              </span>
            </label>
            <label>
              <span>Hasta</span>
              <span className="admin-settlement-input-shell">
                <SettlementFilterIcon kind="clock" />
                <select
                  className="admin-select"
                  value={hourTo ?? ""}
                  onChange={(event) =>
                    setHourTo(
                      event.target.value
                        ? Number(event.target.value)
                        : undefined,
                    )
                  }
                >
                  <option value="">Hora final</option>
                  {Array.from({ length: 24 }, (_, hour) => (
                    <option key={hour} value={hour}>
                      {String(hour).padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
              </span>
            </label>
            <label className="admin-settlement-period-search">
              <SettlementFilterIcon kind="search" />
              <input
                className="admin-input"
                value={movementSearch}
                onChange={(event) => setMovementSearch(event.target.value)}
                placeholder="Buscar club, comprador, email o pedido"
              />
            </label>
            <button
              className="admin-settlement-clear-filters"
              type="button"
              onClick={clearMovementFilters}
            >
              <SettlementFilterIcon kind="sliders" />
              Limpiar filtros
            </button>
          </div>
          <MovementList
            movements={movements.data ?? []}
            loading={movements.isLoading}
            resetKey={`${movementSearch}|${movementPeriod}|${movementDate}|${hourFrom ?? ""}|${hourTo ?? ""}`}
          />
        </section>
      </AdminPanel>
    </AdminPage>
  );
}
