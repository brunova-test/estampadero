"use client";

import { useEffect, useState } from "react";

import { formatCents } from "elestampadero/shared/lib/money";
import { AdminPage, AdminPanel } from "elestampadero/shared/ui/admin";
import { ModernSpinner } from "elestampadero/shared/ui/motion";
import { api } from "elestampadero/trpc/react";

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Solicitada",
  UNDER_REVIEW: "En revisión",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  REFUND_PROCESSING: "Reintegro en proceso",
  REFUNDED: "Reintegrada",
  CLOSED: "Cerrada",
};
const TYPE_LABEL: Record<string, string> = {
  WITHDRAWAL: "Arrepentimiento",
  RETURN: "Devolución",
  CLAIM: "Reclamo",
};

export function AdminCustomerRequestsView() {
  const utils = api.useUtils();
  const query = api.customerRequests.list.useQuery();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = query.data?.find((item) => item.id === selectedId) ?? null;
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (selected) setAmount((selected.requestedRefundInCents / 100).toFixed(2));
  }, [selected]);

  const approve = api.customerRequests.approveRefund.useMutation({
    onSuccess: async () => {
      await utils.customerRequests.list.invalidate();
      setNote("");
    },
  });
  const reject = api.customerRequests.reject.useMutation({
    onSuccess: async () => {
      await utils.customerRequests.list.invalidate();
      setNote("");
    },
  });

  return (
    <AdminPage
      module="Módulo de Posventa"
      title="Arrepentimientos, reclamos y devoluciones"
      className="admin-customer-requests-page"
    >
      <AdminPanel className="admin-panel-pad">
        <div className="admin-toolbar">
          <div>
            <h2 className="admin-panel-title">Solicitudes de clientes</h2>
          </div>
        </div>
        {query.isLoading ? (
          <ModernSpinner label="Cargando..." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Pedido</th>
                  <th>Tipo</th>
                  <th>Importe</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {query.data?.map((item) => (
                  <tr
                    key={item.id}
                    className={item.id === selectedId ? "selected" : ""}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <td>
                      <strong>{item.publicCode.slice(0, 10)}</strong>
                    </td>
                    <td>#{String(item.order.orderNumber).padStart(6, "0")}</td>
                    <td>{TYPE_LABEL[item.type] ?? item.type}</td>
                    <td>{formatCents(item.requestedRefundInCents)}</td>
                    <td>
                      <span className="admin-chip admin-chip--warning">
                        {STATUS_LABEL[item.status] ?? item.status}
                      </span>
                    </td>
                    <td>
                      {new Date(item.createdAt).toLocaleDateString("es-AR")}
                    </td>
                  </tr>
                ))}
                {!query.data?.length ? (
                  <tr>
                    <td colSpan={6}>No hay solicitudes registradas.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>

      {selected ? (
        <div className="admin-settlement-modal-backdrop">
          <aside
            className="admin-settlement-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Detalle de solicitud"
          >
            <button
              type="button"
              className="admin-modal-close"
              onClick={() => setSelectedId(null)}
              aria-label="Cerrar"
            >
              ×
            </button>
            <header>
              <span>{TYPE_LABEL[selected.type]}</span>
              <h2>
                Pedido #{String(selected.order.orderNumber).padStart(6, "0")}
              </h2>
              <p>
                {selected.customerEmail} · {STATUS_LABEL[selected.status]}
              </p>
            </header>
            <div className="admin-settlement-breakdown">
              <h3>Prendas solicitadas</h3>
              {selected.items.map((item) => (
                <div key={item.id}>
                  <small>
                    {item.quantity} × {item.orderItem.productName} ·{" "}
                    {item.orderItem.size} · {item.orderItem.color}
                    {item.orderItem.clubNameSnapshot
                      ? ` · ${item.orderItem.clubNameSnapshot}`
                      : ""}
                  </small>
                  <strong>{formatCents(item.lineAmountInCents)}</strong>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-black/5 p-4">
              <strong className="block">{selected.reason}</strong>
              {selected.details ? (
                <p className="mt-2 text-sm">{selected.details}</p>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <small className="block">Pago</small>
                <strong>
                  {selected.payment?.paymentMethodType ?? "Sin información"}
                  {(selected.payment?.installments ?? 0) > 1
                    ? ` · ${selected.payment?.installments} cuotas`
                    : ""}
                </strong>
              </div>
              <div>
                <small className="block">Entrega</small>
                <strong>
                  {selected.order.deliveredAt
                    ? new Date(selected.order.deliveredAt).toLocaleDateString(
                        "es-AR",
                      )
                    : "Aún no entregado"}
                </strong>
              </div>
            </div>
            {["REQUESTED", "UNDER_REVIEW", "REFUND_PROCESSING"].includes(
              selected.status,
            ) ? (
              <section className="admin-settlement-proof-step">
                <h3>Resolver solicitud</h3>
                <label>
                  Importe a reintegrar (ARS)
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="mt-1 w-full rounded border border-black/20 px-3 py-2"
                  />
                </label>
                <label>
                  Nota de revisión
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded border border-black/20 px-3 py-2"
                  />
                </label>
                {(approve.error ?? reject.error) ? (
                  <small role="alert">
                    {approve.error?.message ?? reject.error?.message}
                  </small>
                ) : null}
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="admin-btn"
                    disabled={reject.isPending || note.trim().length < 3}
                    onClick={() => reject.mutate({ id: selected.id, note })}
                  >
                    Rechazar
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--primary"
                    disabled={approve.isPending || Number(amount) <= 0}
                    onClick={() =>
                      approve.mutate({
                        id: selected.id,
                        amountInCents: Math.round(Number(amount) * 100),
                        note: note || undefined,
                      })
                    }
                  >
                    {approve.isPending ? "Procesando…" : "Aprobar y reintegrar"}
                  </button>
                </div>
                <small>
                  Esta acción llama a Mercado Pago. Confirmá previamente que la
                  devolución corresponde.
                </small>
              </section>
            ) : null}
          </aside>
        </div>
      ) : null}
    </AdminPage>
  );
}
