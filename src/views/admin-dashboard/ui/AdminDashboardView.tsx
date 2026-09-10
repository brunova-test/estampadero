import Link from "next/link";

import { formatCents } from "elestampadero/shared/lib/money";
import {
  AdminPage,
  AdminPanel,
  AdminStat,
} from "elestampadero/shared/ui/admin";
import { api } from "elestampadero/trpc/server";

import { DashboardPeriodNav, type DashboardPeriod } from "./DashboardPeriodNav";

export async function AdminDashboardView({
  period,
}: {
  period: DashboardPeriod;
}) {
  const metrics = await api.orders.metrics({ period });
  const highestSale = Math.max(
    1,
    ...metrics.salesSeries.map((point) => point.amountInCents),
  );
  const attentionTotal = Object.values(metrics.attention).reduce(
    (sum, count) => sum + count,
    0,
  );

  return (
    <AdminPage
      module="Módulo de Dashboard"
      title="Dashboard de rendimiento"
      className="admin-dashboard-page"
    >
      <AdminPanel className="admin-panel-pad admin-dashboard">
        <div className="admin-toolbar" style={{ marginBottom: 16 }}>
          <div>
            <h2 className="admin-panel-title">
              Resumen · {metrics.periodLabel}
            </h2>
            <p className="admin-dashboard-caption">
              Actualizado con los datos registrados en la plataforma
            </p>
          </div>
          <DashboardPeriodNav period={period} />
        </div>
        <div className="admin-stats">
          <AdminStat
            label="Facturación cobrada"
            value={formatCents(metrics.revenueInCents)}
          />
          <AdminStat label="Pedidos del período" value={metrics.totalOrders} />
          <AdminStat
            label="Ticket promedio"
            value={formatCents(metrics.averageTicketInCents)}
          />
          <AdminStat
            label="A liquidar a clubes"
            value={formatCents(metrics.pendingCommissionsInCents)}
            note={`${metrics.activeAgreementCount} convenio${metrics.activeAgreementCount === 1 ? "" : "s"} activo${metrics.activeAgreementCount === 1 ? "" : "s"}`}
            accent
          />
        </div>
        <div className="admin-dashboard-grid">
          <div className="admin-chart-card">
            <div className="admin-toolbar">
              <h3>Ventas · {metrics.periodLabel}</h3>
              <strong className="admin-chart-total">
                {formatCents(metrics.revenueInCents)}
              </strong>
            </div>
            <div className="admin-bars">
              {metrics.salesSeries.map((point) => (
                <div
                  key={point.label}
                  className="admin-bar-column"
                  title={`${point.label}: ${formatCents(point.amountInCents)} · ${point.orderCount} pedidos`}
                >
                  <span
                    className={
                      point.amountInCents === highestSale &&
                      point.amountInCents > 0
                        ? "featured"
                        : ""
                    }
                    style={{
                      height: `${point.amountInCents === 0 ? 2 : Math.max(8, (point.amountInCents / highestSale) * 100)}%`,
                    }}
                  >
                    <em>{point.orderCount > 0 ? point.orderCount : ""}</em>
                  </span>
                  <small>{point.label}</small>
                </div>
              ))}
            </div>
          </div>
          <div className="admin-dashboard-side">
            <div className="admin-status-card">
              <h3>Pedidos por estado</h3>
              <dl>
                <div>
                  <dt>Pendientes de pago</dt>
                  <dd>{metrics.pendingPaymentOrders}</dd>
                </div>
                <div>
                  <dt>Pagados · esperando tanda</dt>
                  <dd>{metrics.paidOrders}</dd>
                </div>
                <div>
                  <dt>En producción</dt>
                  <dd>{metrics.inProductionOrders}</dd>
                </div>
                <div>
                  <dt>Preparados</dt>
                  <dd>{metrics.readyOrders}</dd>
                </div>
                <div>
                  <dt>Enviados</dt>
                  <dd>{metrics.shippedOrders}</dd>
                </div>
                <div>
                  <dt>Entregados</dt>
                  <dd>{metrics.deliveredOrders}</dd>
                </div>
                {metrics.cancelledOrders > 0 ? (
                  <div>
                    <dt>Cancelados</dt>
                    <dd>{metrics.cancelledOrders}</dd>
                  </div>
                ) : null}
                <div className="admin-status-total">
                  <dt>Total del período</dt>
                  <dd>{metrics.totalOrders}</dd>
                </div>
              </dl>
            </div>
            <div className="admin-attention admin-attention--dashboard">
              <div>
                <strong>Requieren tu atención</strong>
                <span>
                  {attentionTotal} tarea{attentionTotal === 1 ? "" : "s"}{" "}
                  pendiente{attentionTotal === 1 ? "" : "s"}
                </span>
              </div>
              <ul>
                <li>
                  <Link href="/admin/disenos">Diseños pendientes</Link>
                  <b>{metrics.attention.pendingDesigns}</b>
                </li>
                <li>
                  <Link href="/admin/productos">Productos sin stock</Link>
                  <b>{metrics.attention.outOfStockProducts}</b>
                </li>
                <li>
                  <Link href="/admin/clubes">Convenios por vencer</Link>
                  <b>{metrics.attention.expiringAgreements}</b>
                </li>
                <li>
                  <Link href="/admin/pedidos">Solicitudes nuevas</Link>
                  <b>{metrics.attention.newSpecialRequests}</b>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </AdminPanel>
    </AdminPage>
  );
}
