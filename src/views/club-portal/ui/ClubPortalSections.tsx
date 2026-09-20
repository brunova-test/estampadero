"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

import { PendingDesignsPanel } from "elestampadero/features/review-design";
import { formatCents } from "elestampadero/shared/lib/money";
import { Button } from "elestampadero/shared/ui";
import { api, type RouterOutputs } from "elestampadero/trpc/react";

export type PortalTab =
  | "inicio"
  | "disenos"
  | "productos"
  | "tienda"
  | "ventas"
  | "liquidaciones"
  | "cobros"
  | "datos";

type PortalData = RouterOutputs["clubs"]["portalData"];
type Agreement = RouterOutputs["agreements"]["listByClub"][number];
type Commission = RouterOutputs["commissions"]["listByClub"][number];
type Balance = RouterOutputs["commissions"]["balance"];
type Settlement = RouterOutputs["settlements"]["listByClub"][number];
type Design = RouterOutputs["designs"]["listByClub"][number];
type HomePanelId =
  "resumen" | "disenos" | "ventas" | "liquidaciones";

const HOME_PANELS: Array<{ id: HomePanelId; label: string }> = [
  { id: "resumen", label: "Resumen" },
  { id: "disenos", label: "Diseños" },
  { id: "ventas", label: "Ventas" },
  { id: "liquidaciones", label: "Liquidaciones" },
];

const ORDER_STATUS: Record<string, string> = {
  PENDING_PAYMENT: "Pendiente de pago",
  PAID: "Pagado",
  IN_PRODUCTION: "En producción",
  READY_FOR_SHIPPING: "Listo para entregar",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

const COMMISSION_STATUS: Record<string, string> = {
  ACCRUED: "Registrada",
  PENDING_RELEASE: "Pago pendiente de liberación",
  PENDING_DELIVERY: "Esperando entrega",
  RETURN_WINDOW: "En período de devolución",
  AVAILABLE: "Disponible para liquidar",
  IN_SETTLEMENT: "Incluida en liquidación",
  SETTLED: "Liquidada",
  REVERSED: "Revertida",
};

const DESIGN_STATUS: Record<string, string> = {
  SENT_TO_CLUB: "Para revisar",
  CHANGES_REQUESTED: "Cambios solicitados",
  APPROVED: "Aprobado",
};

const ROLE_LABEL: Record<string, string> = {
  CLUB_ADMIN: "Administrador del club",
  CLUB_VIEWER: "Solo lectura",
  ADMIN: "Administrador general",
  SUPER_ADMIN: "Superadministrador",
};

function HomePanelIcon({ panel }: { panel: HomePanelId }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {panel === "resumen" ? (
        <>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </>
      ) : null}
      {panel === "disenos" ? (
        <>
          <path d="m4 20 4.2-1 10.6-10.6a2.1 2.1 0 0 0-3-3L5.2 16Z" />
          <path d="m14.5 6.7 2.8 2.8" />
        </>
      ) : null}
      {panel === "ventas" ? (
        <>
          <path d="M4 20V5" />
          <path d="M4 20h16" />
          <path d="m7 15 4-4 3 3 5-7" />
        </>
      ) : null}
      {panel === "liquidaciones" ? (
        <>
          <path d="M4 7.5h14a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12" />
          <path d="M15 13h5" />
          <circle cx="16" cy="13" r=".7" fill="currentColor" />
        </>
      ) : null}
    </svg>
  );
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-AR");
}

function MetricCard({
  label,
  value,
  detail,
  dark = false,
}: {
  label: string;
  value: string;
  detail: string;
  dark?: boolean;
}) {
  return (
    <article
      className={`brand-card-cut border-t-4 p-5 sm:p-6 ${
        dark
          ? "border-mint bg-deep text-white"
          : "border-blue text-ink bg-white"
      }`}
    >
      <p
        className={`text-sm font-medium ${dark ? "text-white/70" : "text-muted"}`}
      >
        {label}
      </p>
      <p
        className={`font-display mt-2 text-[clamp(25px,2.52vw,40px)] font-black ${
          dark ? "text-mint" : "text-ink"
        }`}
      >
        {value}
      </p>
      <p className={`mt-1 text-sm ${dark ? "text-white/70" : "text-muted"}`}>
        {detail}
      </p>
    </article>
  );
}

function SectionTabs({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: Array<{ id: string; label: string; count?: number }>;
  activeTab: string;
  onChange: (id: string) => void;
}) {
  return (
    <div
      role="tablist"
      className="club-portal-section-tabs border-deep/10 flex gap-2 overflow-x-auto rounded-2xl border bg-white p-2"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`flex min-h-12 min-w-max flex-1 items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-left text-base font-bold transition-colors ${
              isActive
                ? "bg-deep text-white shadow-[0_10px_22px_-16px_rgba(46,4,112,.8)]"
                : "text-muted hover:bg-paper hover:text-deep"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <SectionTabIcon tab={tab.id} />
              {tab.label}
            </span>
            {tab.count !== undefined ? (
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  isActive ? "bg-mint text-deep" : "bg-paper text-blue"
                }`}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function SectionTabIcon({ tab }: { tab: string }) {
  return (
    <span className="bg-paper text-blue grid h-8 w-8 shrink-0 place-items-center rounded-lg">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-[18px] w-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {tab === "catalogo" ? (
          <>
            <path d="m4 8 8-4 8 4-8 4-8-4Z" />
            <path d="M4 12c0 2.2 3.6 4 8 4s8-1.8 8-4" />
          </>
        ) : null}
        {tab === "produccion" ? (
          <>
            <path d="M3 7h18M5 7v12h14V7M8 4h8v3H8z" />
            <path d="M9 12h6" />
          </>
        ) : null}
        {tab === "resumen" ? (
          <>
            <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
            <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
            <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
            <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
          </>
        ) : null}
        {tab === "pedidos" ? (
          <>
            <path d="M4 5h16v14H4z" />
            <path d="M8 9h8M8 13h5" />
          </>
        ) : null}
        {tab === "participaciones" ? (
          <>
            <path d="M4 20V5M4 20h16M7 15l4-4 3 3 5-7" />
          </>
        ) : null}
        {tab === "revision" ? (
          <>
            <path d="m4 20 4.2-1 10.4-10.4a2.1 2.1 0 0 0-3-3L5.2 16.8Z" />
            <path d="m14.5 6.7 2.8 2.8" />
          </>
        ) : null}
        {tab === "aprobados" ? (
          <>
            <path d="m5 12 4 4L19 6" />
            <circle cx="12" cy="12" r="9" />
          </>
        ) : null}
        {tab === "historial" ? (
          <>
            <path d="M4 12a8 8 0 1 0 2.3-5.7" />
            <path d="M4 5v5h5M12 8v4l3 2" />
          </>
        ) : null}
      </svg>
    </span>
  );
}

const ORDER_STATUS_STYLE: Record<
  string,
  { dot: string; bg: string; text: string; detail: string }
> = {
  ALL: {
    dot: "bg-blue",
    bg: "bg-blue/10",
    text: "text-blue",
    detail: "Todos los pedidos",
  },
  PENDING_PAYMENT: {
    dot: "bg-amber-400",
    bg: "bg-amber-50",
    text: "text-amber-800",
    detail: "Esperando el pago",
  },
  PAID: {
    dot: "bg-mint",
    bg: "bg-mint/25",
    text: "text-deep",
    detail: "Pago confirmado",
  },
  IN_PRODUCTION: {
    dot: "bg-blue",
    bg: "bg-blue/10",
    text: "text-blue",
    detail: "En confección",
  },
  READY_FOR_SHIPPING: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    detail: "Lista para entregar",
  },
  SHIPPED: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    detail: "En camino",
  },
  DELIVERED: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    detail: "Entregada",
  },
  CANCELLED: {
    dot: "bg-red-400",
    bg: "bg-red-50",
    text: "text-red-800",
    detail: "Pedido cancelado",
  },
};

function OrderStatusDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = ORDER_STATUS_STYLE[value] ?? ORDER_STATUS_STYLE.ALL!;
  const options = [
    "ALL",
    ...Object.keys(ORDER_STATUS).filter((key) => key !== "ALL"),
  ];

  return (
    <div className="relative min-w-[220px]">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className={`border-deep/15 flex h-11 w-full items-center justify-between gap-3 rounded-lg border px-3 text-left text-sm font-semibold transition-colors ${current.bg} ${current.text}`}
      >
        <span className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${current.dot}`} />
          {value === "ALL" ? "Todos los estados" : ORDER_STATUS[value]}
        </span>
        <span
          className={`text-xs transition-transform ${open ? "rotate-180" : ""}`}
        >
          ⌄
        </span>
      </button>
      {open ? (
        <div
          role="listbox"
          className="border-deep/15 absolute top-[calc(100%+6px)] right-0 z-30 w-full overflow-hidden rounded-xl border bg-white p-1.5 shadow-[0_18px_40px_-20px_rgba(46,4,112,.55)]"
        >
          {options.map((option) => {
            const style = ORDER_STATUS_STYLE[option] ?? ORDER_STATUS_STYLE.ALL!;
            const isSelected = value === option;
            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={`hover:bg-paper flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${isSelected ? style.bg : ""}`}
              >
                <span
                  className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`}
                />
                <span>
                  <span className={`block text-sm font-semibold ${style.text}`}>
                    {option === "ALL"
                      ? "Todos los estados"
                      : ORDER_STATUS[option]}
                  </span>
                  <span className="text-muted block text-[11px]">
                    {style.detail}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function RecentApprovedDesigns({
  designs,
  onViewAll,
}: {
  designs: Design[];
  onViewAll: () => void;
}) {
  const approvedDesigns = designs
    .filter((design) => design.status === "APPROVED")
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime(),
    )
    .slice(0, 3);

  return (
    <article className="border-deep/8 rounded-2xl border bg-white p-6 text-base shadow-sm sm:p-8">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-blue font-mono text-sm tracking-[.16em] uppercase">
            Diseños aprobados
          </span>
          <h2 className="font-display text-ink mt-1 text-2xl font-black">
            Últimos diseños aprobados
          </h2>
          <p className="text-muted mt-1 text-base">
            Un vistazo rápido a tus propuestas más recientes.
          </p>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="text-blue hover:text-deep shrink-0 text-base font-bold transition-colors"
        >
          Ver todos <span aria-hidden="true">→</span>
        </button>
      </div>

      {approvedDesigns.length > 0 ? (
        <div className="divide-y divide-black/5 rounded-xl border border-black/5">
          {approvedDesigns.map((design) => (
            <div
              key={design.id}
              className="flex items-center justify-between gap-4 px-4 py-3.5"
            >
              <div className="min-w-0">
                <p className="text-ink truncate text-sm font-bold">
                  {design.title}
                </p>
                <p className="text-muted mt-0.5 text-xs">
                  Versión {design.latestVersionNumber} ·{" "}
                  {formatDate(design.createdAt)}
                </p>
              </div>
              <span className="bg-mint/35 text-deep shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold">
                Aprobado
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted rounded-xl border border-dashed border-black/10 px-5 py-8 text-center text-base">
          Todavía no hay diseños aprobados.
        </p>
      )}
    </article>
  );
}

export function ClubHomeSection({
  data,
  activeAgreement,
  balance,
  commissions,
  settlements,
  designs,
  onNavigate,
  paymentsNotice,
}: {
  data: PortalData;
  activeAgreement?: Agreement;
  balance?: Balance;
  commissions: Commission[];
  settlements: Settlement[];
  designs: Design[];
  onNavigate: (tab: PortalTab) => void;
  paymentsNotice?: ReactNode;
}) {
  const [activePanel, setActivePanel] = useState<HomePanelId>("resumen");
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthCommissions = commissions.filter((entry) => {
    const date = new Date(entry.createdAt);
    return (
      date.getMonth() === currentMonth && date.getFullYear() === currentYear
    );
  });
  const monthSales = monthCommissions.reduce(
    (sum, entry) => sum + entry.baseAmountInCents,
    0,
  );
  const monthOrders = new Set(monthCommissions.map((entry) => entry.orderId))
    .size;
  const latestPaidSettlement = settlements.find(
    (settlement) => settlement.status === "PAID",
  );
  return (
    <div className="flex flex-col gap-6">
      <section className="club-portal-home-tabs border-deep/8 rounded-2xl border bg-white p-2 shadow-[0_12px_32px_-28px_rgba(46,4,112,.45)]">
        <div
          role="tablist"
          aria-label="Resumen del portal"
          className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
        >
          {HOME_PANELS.map((panel) => {
            const isActive = activePanel === panel.id;
            return (
              <button
                key={panel.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActivePanel(panel.id)}
                className={`club-home-tab flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold sm:flex-1 ${
                  isActive
                    ? "bg-deep text-white shadow-[0_10px_22px_-16px_rgba(46,4,112,.8)]"
                    : "text-muted hover:bg-paper hover:text-deep"
                }`}
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-lg ${
                    isActive ? "bg-mint text-deep" : "bg-paper text-blue"
                  }`}
                >
                  <HomePanelIcon panel={panel.id} />
                </span>
                <span>{panel.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {paymentsNotice}

      <div role="tabpanel" className="min-h-[320px]">
        {activePanel === "resumen" ? (
          <div className="space-y-5">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Convenio"
                value={activeAgreement ? "Activo" : "Sin convenio"}
                detail={
                  activeAgreement
                    ? `Vence ${formatDate(activeAgreement.endDate)}`
                    : "Contactá al administrador"
                }
              />
              <MetricCard
                label="Porcentaje acordado"
                value={
                  activeAgreement ? `${activeAgreement.basePercentage}%` : "—"
                }
                detail={`${data.products.length} productos vinculados`}
              />
              <MetricCard
                label="Ventas del mes"
                value={formatCents(monthSales)}
                detail={`${monthOrders} pedido${monthOrders === 1 ? "" : "s"}`}
              />
              <MetricCard
                label="Saldo pendiente"
                value={formatCents(balance?.accruedInCents ?? 0)}
                detail="Próxima liquidación"
                dark
              />
            </section>
            <RecentApprovedDesigns
              designs={designs}
              onViewAll={() => onNavigate("disenos")}
            />
          </div>
        ) : null}

        {activePanel === "disenos" ? (
          <PendingDesignsPanel
            clubId={data.club.id}
            canReview={data.canReviewDesigns}
          />
        ) : null}

        {activePanel === "ventas" ? (
          <article className="border-deep/8 rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <span className="text-blue font-mono text-xs tracking-[.16em] uppercase">
                  Actividad reciente
                </span>
                <h2 className="font-display text-ink mt-1 text-2xl font-black">
                  Últimas ventas de tus productos
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("ventas")}
                className="bg-deep hover:bg-blue inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-bold text-white shadow-[0_8px_18px_-14px_rgba(46,4,112,.85)] transition-all hover:-translate-y-0.5"
              >
                Ver todas
              </button>
            </div>
            <div className="divide-y divide-black/5">
              {commissions.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="grid gap-1 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <p className="text-ink font-semibold">
                      Pedido #{String(entry.orderNumber).padStart(6, "0")} ·{" "}
                      {entry.productName}
                    </p>
                    <p className="text-muted text-sm">
                      {formatDate(entry.createdAt)} · {entry.percentageApplied}%
                      de participación
                    </p>
                  </div>
                  <p className="text-deep font-mono font-semibold">
                    {formatCents(entry.amountInCents)}
                  </p>
                </div>
              ))}
              {commissions.length === 0 ? (
                <p className="text-muted py-10 text-center">
                  Todavía no hay ventas asociadas al convenio.
                </p>
              ) : null}
            </div>
          </article>
        ) : null}

        {activePanel === "liquidaciones" ? (
          <article className="bg-deep flex min-h-[320px] flex-col rounded-2xl p-6 text-white shadow-[0_20px_50px_-32px_rgba(46,4,112,.8)] sm:p-8">
            <span className="text-mint font-mono text-xs tracking-[.16em] uppercase">
              Último pago
            </span>
            <h2 className="font-display mt-2 text-2xl font-black">
              {latestPaidSettlement
                ? `Liquidación ${latestPaidSettlement.periodLabel}`
                : "Sin liquidaciones pagadas"}
            </h2>
            {latestPaidSettlement ? (
              <>
                <p className="font-display text-mint mt-5 text-4xl font-black">
                  {formatCents(latestPaidSettlement.totalInCents)}
                </p>
                <p className="mt-2 text-white/70">
                  Pagada el {formatDate(latestPaidSettlement.paidAt)}
                </p>
                {latestPaidSettlement.receiptUrl ? (
                  <a
                    href={latestPaidSettlement.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-mint mt-auto pt-8 font-bold hover:text-white"
                  >
                    Ver comprobante →
                  </a>
                ) : null}
              </>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate("liquidaciones")}
                className="text-mint mt-auto pt-8 text-left font-bold"
              >
                Ver historial →
              </button>
            )}
          </article>
        ) : null}

      </div>
    </div>
  );
}

export function ClubDesignsSection({
  clubId,
  designs,
  canReview,
}: {
  clubId: string;
  designs: Design[];
  canReview: boolean;
}) {
  const [designTab, setDesignTab] = useState<
    "revision" | "aprobados" | "historial"
  >("revision");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const visibleDesigns = designs.filter((design) => {
    if (designTab === "aprobados") return design.status === "APPROVED";
    if (designTab === "revision") return design.status !== "APPROVED";
    return true;
  });
  const selectedDesign =
    visibleDesigns.find((design) => design.id === selectedId) ??
    visibleDesigns[0];
  const detailQuery = api.designs.byId.useQuery(
    { id: selectedDesign?.id ?? "" },
    { enabled: !!selectedDesign },
  );
  const utils = api.useUtils();
  const addComment = api.designs.addComment.useMutation({
    onSuccess: async () => {
      setComment("");
      if (selectedDesign) {
        await utils.designs.byId.invalidate({ id: selectedDesign.id });
      }
    },
  });
  const detail = detailQuery.data;
  const latestVersion = detail?.versions[detail.versions.length - 1];

  return (
    <div className="flex flex-col gap-5">

      <div className="hidden">
        <span className="text-blue font-mono text-xs tracking-[.16em] uppercase">
          Diseños
        </span>
        <h1 className="font-display text-ink mt-1 text-3xl font-black">
          Propuestas e historial
        </h1>
        <p className="text-muted mt-2 max-w-3xl">
          Revisá las versiones enviadas por El Estampadero, aprobá el arte final
          o dejá observaciones antes de producir.
        </p>
      </div>

      <SectionTabs
        activeTab={designTab}
        onChange={(id) => {
          setDesignTab(id as typeof designTab);
          setSelectedId(null);
        }}
        tabs={[
          {
            id: "revision",
            label: "Para revisar",
            count: designs.filter((design) => design.status !== "APPROVED")
              .length,
          },
          {
            id: "aprobados",
            label: "Aprobados",
            count: designs.filter((design) => design.status === "APPROVED")
              .length,
          },
          {
            id: "historial",
            label: "Historial completo",
            count: designs.length,
          },
        ]}
      />

      {designTab === "revision" ? (
        <PendingDesignsPanel clubId={clubId} canReview={canReview} />
      ) : null}

      {designTab !== "revision" && visibleDesigns.length > 0 ? (
        <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="flex flex-col gap-3 lg:sticky lg:top-6 lg:self-start">
            {visibleDesigns.map((design) => (
              <button
                key={design.id}
                type="button"
                onClick={() => setSelectedId(design.id)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  selectedDesign?.id === design.id
                    ? "border-mint bg-deep text-white shadow-[0_14px_30px_-22px_rgba(46,4,112,.9)]"
                    : "border-deep/10 text-ink hover:border-blue/40 bg-white hover:shadow-sm"
                }`}
              >
                <p className="font-display font-bold">{design.title}</p>
                <div className="mt-2 flex justify-between gap-2 text-xs">
                  <span>{DESIGN_STATUS[design.status] ?? design.status}</span>
                  <span className="font-mono">
                    v{design.latestVersionNumber}
                  </span>
                </div>
              </button>
            ))}
          </aside>

          <article className="border-deep/10 overflow-hidden rounded-2xl border bg-white shadow-[0_18px_45px_-35px_rgba(46,4,112,.45)]">
            <div className="p-5 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-blue font-mono text-xs tracking-[.12em] uppercase">
                    {detail ? DESIGN_STATUS[detail.status] : "Cargando..."}
                  </p>
                  <h2 className="font-display text-ink mt-1 text-2xl font-black">
                    {detail?.title ?? selectedDesign?.title}
                  </h2>
                </div>
                <span className="bg-paper text-deep px-3 py-2 font-mono text-xs">
                  {detail?.versions.length ?? 0} versiones
                </span>
              </div>

              {latestVersion ? (
                <div className="bg-paper relative mt-6 aspect-video min-h-[300px] overflow-hidden rounded-xl border border-black/5 sm:min-h-[420px]">
                  <Image
                    src={latestVersion.imageUrl}
                    alt={detail?.title ?? "Diseño"}
                    fill
                    className="object-contain p-4"
                  />
                </div>
              ) : null}

              {detail?.versions.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {detail.versions.map((version) => (
                    <a
                      key={version.id}
                      href={version.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="border-deep text-deep hover:bg-paper border px-3 py-2 text-sm font-semibold"
                    >
                      Versión {version.versionNumber}
                    </a>
                  ))}
                </div>
              ) : null}

              <div className="mt-8 border-t border-black/10 pt-6">
                <h3 className="font-display text-ink text-lg font-black">
                  Conversación
                </h3>
                <div className="mt-3 flex max-h-64 flex-col gap-3 overflow-y-auto">
                  {detail?.comments.map((item) => (
                    <div key={item.id} className="bg-paper p-3">
                      <div className="text-muted flex justify-between gap-3 text-xs">
                        <strong className="text-deep">{item.authorName}</strong>
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                      <p className="text-ink mt-1 text-sm">{item.message}</p>
                    </div>
                  ))}
                  {detail?.comments.length === 0 ? (
                    <p className="text-muted text-sm">
                      Todavía no hay observaciones.
                    </p>
                  ) : null}
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Escribí una observación..."
                    className="focus:border-blue min-h-12 flex-1 border-2 border-[#d9d5e2] bg-white px-4 outline-none"
                  />
                  <Button
                    type="button"
                    disabled={
                      !comment.trim() || addComment.isPending || !detail
                    }
                    loading={addComment.isPending}
                    loadingLabel="Publicando comentario"
                    onClick={() =>
                      detail &&
                      addComment.mutate({
                        designId: detail.id,
                        versionId: latestVersion?.id,
                        message: comment,
                      })
                    }
                  >
                    Comentar
                  </Button>
                </div>
                {addComment.error ? (
                  <p className="text-deep mt-2 text-sm font-semibold">
                    {addComment.error.message}
                  </p>
                ) : null}
              </div>
            </div>
          </article>
        </section>
      ) : designTab !== "revision" ? (
        <div className="border-deep/20 text-muted border-2 border-dashed bg-white p-12 text-center">
          Todavía no hay propuestas de diseño para este club.
        </div>
      ) : null}
    </div>
  );
}

function ClubProductModal({
  product,
  onClose,
}: {
  product: PortalData["products"][number];
  onClose: () => void;
}) {
  const detailQuery = api.catalog.bySlug.useQuery(
    { slug: product.slug },
    { staleTime: 60_000 },
  );
  const detail = detailQuery.data;

  return (
    <div
      className="bg-ink/70 fixed inset-0 z-[100] grid place-items-center overflow-y-auto p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={`club-product-${product.id}`}
        className="relative grid max-h-[min(680px,calc(100svh-32px))] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/60 bg-white shadow-2xl md:grid-cols-2 md:overflow-hidden"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalle"
          className="text-deep hover:text-blue absolute top-3 right-3 z-10 grid h-9 w-9 place-items-center border-0 bg-transparent text-[0px] leading-none transition-colors duration-200 after:text-2xl after:content-['✕']"
        >
          ×
        </button>
        <div className="bg-paper relative min-h-[280px] md:min-h-[520px]">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.imageAlt}
              fill
              className="object-contain p-8"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          ) : null}
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-9">
          <span className="text-blue font-mono text-xs font-semibold tracking-[.16em] uppercase">
            {product.line}
          </span>
          <h2
            id={`club-product-${product.id}`}
            className="font-display text-ink mt-2 text-3xl leading-tight font-black"
          >
            {product.name}
          </h2>
          <p className="font-display text-deep mt-4 text-3xl font-black">
            {formatCents(product.priceInCents)}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm font-semibold">
            <span className="bg-paper text-muted rounded px-2.5 py-1.5">
              {product.totalStock} unidades disponibles
            </span>
            <span className="bg-mint/30 text-deep rounded px-2.5 py-1.5">
              {product.status === "PUBLISHED" ? "Publicado" : "Borrador"}
            </span>
          </div>
          {detailQuery.isLoading ? (
            <p className="text-muted mt-6 text-sm">Cargando...</p>
          ) : detail?.description ? (
            <p className="text-muted mt-6 text-base leading-relaxed">
              {detail.description}
            </p>
          ) : null}
          {detail?.variants?.length ? (
            <div className="mt-6 border-t border-black/10 pt-5">
              <p className="text-ink text-base font-bold">
                Talles y colores disponibles
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {detail.variants.map((variant) => (
                  <span
                    key={variant.id}
                    className="border-deep/15 text-muted rounded border px-3 py-1.5 text-sm"
                  >
                    {variant.size} · {variant.color}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export function ClubProductsSection({ data }: { data: PortalData }) {
  const [copied, setCopied] = useState(false);
  const [productTab, setProductTab] = useState("catalogo");
  const [selectedProduct, setSelectedProduct] = useState<
    PortalData["products"][number] | null
  >(null);
  const catalogPath = `/catalogo?club=${data.club.slug}`;

  async function copyCatalogLink() {
    const url = `${window.location.origin}${catalogPath}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    } else {
      const input = document.createElement("textarea");
      input.value = url;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="hidden">
        <span className="text-blue font-mono text-xs tracking-[.16em] uppercase">
          Productos
        </span>
        <h1 className="font-display text-ink mt-1 text-3xl font-black">
          Catálogo y producción
        </h1>
      </div>

      <SectionTabs
        activeTab={productTab}
        onChange={setProductTab}
        tabs={[
          {
            id: "catalogo",
            label: "Catálogo y productos",
            count: data.products.length,
          },
          {
            id: "produccion",
            label: "Tandas de producción",
            count: data.batches.length,
          },
        ]}
      />

      {productTab === "catalogo" ? (
        <>
          <section className="brand-card-cut bg-deep grid gap-6 p-6 text-white sm:p-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <span className="text-mint font-mono text-xs tracking-[.14em] uppercase">
                Catálogo del club
              </span>
              <h2 className="font-display mt-2 text-2xl font-black">
                Compartí las prendas oficiales
              </h2>
              <p className="mt-2 max-w-2xl text-white/70">
                Este enlace abre el catálogo filtrado únicamente con los
                productos de {data.club.name}.
              </p>
              <p className="text-mint mt-4 overflow-hidden font-mono text-sm text-ellipsis">
                {catalogPath}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void copyCatalogLink()}
                className="brand-cut bg-mint text-deep px-6 py-3 font-bold shadow-[0_8px_20px_-14px_rgba(0,0,0,.8)] transition-all duration-200 ease-out hover:-translate-y-1 hover:bg-white hover:shadow-[0_14px_24px_-13px_rgba(0,0,0,.85)] active:translate-y-0 active:scale-[.98]"
              >
                {copied ? "Enlace copiado" : "Copiar enlace"}
              </button>
              <button
                type="button"
                data-loading-ignore="true"
                onClick={() => {
                  const catalogUrl = `${window.location.origin}${catalogPath}`;
                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(`Productos oficiales de ${data.club.name}: ${catalogUrl}`)}`,
                    "_blank",
                    "noopener,noreferrer",
                  );
                }}
                className="border-2 border-white/60 px-5 py-3 font-bold text-white transition-all duration-200 ease-out hover:-translate-y-1 hover:border-mint hover:bg-mint hover:text-deep hover:shadow-[0_14px_24px_-13px_rgba(0,0,0,.85)] active:translate-y-0 active:scale-[.98]"
              >
                Compartir
              </button>
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-ink text-2xl font-black">
                  Mis productos
                </h2>
                <p className="text-muted text-sm">
                  Precio, publicación y stock disponibles en tiempo real.
                </p>
              </div>
              <span className="text-deep font-mono text-sm">
                {data.products.length} vinculados
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.products.map((product) => (
                <article
                  key={product.id}
                  className="brand-card-cut overflow-hidden bg-white"
                >
                  <div className="bg-paper relative aspect-[4/3]">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.imageAlt}
                        fill
                        className="object-contain p-4"
                      />
                    ) : null}
                    <span className="bg-deep absolute top-3 left-3 px-2 py-1 font-mono text-[10px] text-white">
                      {product.code}
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="text-blue text-xs font-semibold tracking-[.12em] uppercase">
                      {product.line}
                    </p>
                    <h3 className="font-display text-ink mt-1 text-xl font-black">
                      {product.name}
                    </h3>
                    <p className="font-display text-deep mt-2 text-2xl font-black">
                      {formatCents(product.priceInCents)}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
                      <span className="bg-paper text-muted px-2 py-1">
                        {product.totalStock} unidades
                      </span>
                      <span className="bg-mint/30 text-deep px-2 py-1">
                        {product.status === "PUBLISHED"
                          ? "Publicado"
                          : "Borrador"}
                      </span>
                      <span className="bg-paper text-muted px-2 py-1">
                        {product.linkedDesignCount} diseños
                      </span>
                    </div>
                    <button
                      type="button"
                      aria-label="Abrir ficha"
                      onClick={() => setSelectedProduct(product)}
                      className="bg-deep hover:bg-blue mt-5 inline-flex min-h-11 items-center justify-center rounded-lg px-5 text-[0px] font-bold text-white shadow-[0_10px_22px_-15px_rgba(46,4,112,.85)] transition-all after:text-sm after:content-['Abrir_ficha'] hover:-translate-y-0.5 hover:shadow-[0_14px_24px_-15px_rgba(46,4,112,.9)]"
                    >
                      Abrir ficha →
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {data.products.length === 0 ? (
              <div className="text-muted bg-white p-10 text-center">
                El administrador todavía no vinculó productos a este club.
              </div>
            ) : null}
          </section>
        </>
      ) : null}

      {productTab === "produccion" ? (
        <section className="bg-white p-6 sm:p-8">
          <div className="mb-5">
            <span className="text-blue font-mono text-xs tracking-[.14em] uppercase">
              Producción
            </span>
            <h2 className="font-display text-ink mt-1 text-2xl font-black">
              Tandas de tus pedidos
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-paper text-deep font-mono text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Tanda</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Pedidos</th>
                  <th className="px-4 py-3">Unidades</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {data.batches.map((batch) => (
                  <tr key={batch.id}>
                    <td className="text-deep px-4 py-4 font-mono font-semibold">
                      #{batch.batchNumber}
                    </td>
                    <td className="px-4 py-4">{formatDate(batch.createdAt)}</td>
                    <td className="px-4 py-4">{batch.orderCount}</td>
                    <td className="px-4 py-4">{batch.unitCount}</td>
                    <td className="px-4 py-4">
                      <span className="bg-mint/25 text-deep px-2 py-1 font-semibold">
                        {batch.status === "OPEN" ? "Abierta" : "Cerrada"}
                      </span>
                    </td>
                  </tr>
                ))}
                {data.batches.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-muted px-4 py-8 text-center"
                    >
                      Los pedidos todavía no ingresaron a una tanda de
                      producción.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {selectedProduct ? (
        <ClubProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      ) : null}
    </div>
  );
}

export function ClubSalesSection({
  data,
  commissions,
}: {
  data: PortalData;
  commissions: Commission[];
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [salesTab, setSalesTab] = useState("resumen");
  const normalizedSearch = search.trim().toLowerCase();
  const filteredOrders = data.orders.filter(
    (order) =>
      (status === "ALL" || order.status === status) &&
      (!normalizedSearch ||
        String(order.orderNumber).includes(normalizedSearch) ||
        order.items.some((item) =>
          item.productName.toLowerCase().includes(normalizedSearch),
        )),
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="hidden">
        <span className="text-blue font-mono text-xs tracking-[.16em] uppercase">
          Ventas
        </span>
        <h1 className="font-display text-ink mt-1 text-3xl font-black">
          Pedidos y participaciones
        </h1>
      </div>

      <SectionTabs
        activeTab={salesTab}
        onChange={setSalesTab}
        tabs={[
          { id: "resumen", label: "Resumen" },
          { id: "pedidos", label: "Pedidos", count: data.orders.length },
          {
            id: "participaciones",
            label: "Participaciones",
            count: commissions.length,
          },
        ]}
      />

      {salesTab === "resumen" ? (
        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Pedidos vinculados"
            value={String(data.orders.length)}
            detail="Con productos del club"
          />
          <MetricCard
            label="Venta asociada"
            value={formatCents(
              commissions.reduce(
                (sum, item) => sum + item.baseAmountInCents,
                0,
              ),
            )}
            detail="Base total del convenio"
          />
          <MetricCard
            label="Participación generada"
            value={formatCents(
              commissions.reduce((sum, item) => sum + item.amountInCents, 0),
            )}
            detail="Pendiente y liquidada"
            dark
          />
        </section>
      ) : null}

      {salesTab === "pedidos" ? (
        <section className="bg-white p-5 sm:p-7">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="font-display text-ink text-2xl font-black">
              Pedidos
            </h2>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar pedido o producto"
                className="focus:border-blue h-11 border-2 border-[#d9d5e2] px-4 outline-none"
              />
              <OrderStatusDropdown value={status} onChange={setStatus} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-paper text-deep font-mono text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Pedido</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Productos</th>
                  <th className="px-4 py-3">Importe</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Tanda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="text-deep px-4 py-4 font-mono font-semibold">
                      #{String(order.orderNumber).padStart(6, "0")}
                    </td>
                    <td className="px-4 py-4">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-4">
                      {order.items.map((item) => (
                        <span key={item.id} className="block">
                          {item.productName} · {item.quantity} u.
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-4 font-semibold">
                      {formatCents(order.clubTotalInCents)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-bold ${
                          (
                            ORDER_STATUS_STYLE[order.status] ??
                            ORDER_STATUS_STYLE.ALL!
                          ).bg
                        } ${(ORDER_STATUS_STYLE[order.status] ?? ORDER_STATUS_STYLE.ALL!).text}`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${(ORDER_STATUS_STYLE[order.status] ?? ORDER_STATUS_STYLE.ALL!).dot}`}
                        />
                        {ORDER_STATUS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="text-muted px-4 py-4 font-mono">
                      {order.productionBatch
                        ? `#${order.productionBatch.batchNumber}`
                        : "—"}
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-muted px-4 py-8 text-center"
                    >
                      No hay pedidos que coincidan con los filtros.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {salesTab === "participaciones" ? (
        <section className="bg-white p-5 sm:p-7">
          <h2 className="font-display text-ink mb-5 text-2xl font-black">
            Participaciones por producto
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-paper text-deep font-mono text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Pedido</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Venta</th>
                  <th className="px-4 py-3">%</th>
                  <th className="px-4 py-3">Participación</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {commissions.map((entry) => (
                  <tr key={entry.id}>
                    <td className="text-deep px-4 py-4 font-mono">
                      #{String(entry.orderNumber).padStart(6, "0")}
                    </td>
                    <td className="px-4 py-4">{entry.productName}</td>
                    <td className="px-4 py-4">
                      {formatCents(entry.baseAmountInCents)}
                    </td>
                    <td className="px-4 py-4">{entry.percentageApplied}%</td>
                    <td className="px-4 py-4 font-semibold">
                      {formatCents(entry.amountInCents)}
                    </td>
                    <td className="px-4 py-4">
                      <strong>
                        {COMMISSION_STATUS[entry.status] ?? entry.status}
                      </strong>
                      <small className="text-muted mt-1 block">
                        {entry.paymentMethodType === "credit_card"
                          ? `Crédito${(entry.installments ?? 0) > 1 ? ` · ${entry.installments} cuotas` : ""}`
                          : entry.paymentMethodType === "debit_card"
                            ? "Débito"
                            : (entry.paymentMethodType ?? "Medio pendiente")}
                      </small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function ClubSettlementsSection({
  settlements,
  balance,
}: {
  settlements: Settlement[];
  balance?: Balance;
}) {
  const [settlementTab, setSettlementTab] = useState("resumen");

  return (
    <div className="flex flex-col gap-5">
      <div className="hidden">
        <span className="text-blue font-mono text-xs tracking-[.16em] uppercase">
          Liquidaciones
        </span>
        <h1 className="font-display text-ink mt-1 text-3xl font-black">
          Historial y comprobantes
        </h1>
      </div>

      <SectionTabs
        activeTab={settlementTab}
        onChange={setSettlementTab}
        tabs={[
          { id: "resumen", label: "Resumen" },
          {
            id: "historial",
            label: "Historial y comprobantes",
            count: settlements.length,
          },
        ]}
      />

      {settlementTab === "resumen" ? (
        <section className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Pendiente"
            value={formatCents(balance?.accruedInCents ?? 0)}
            detail="A incluir en el próximo cierre"
            dark
          />
          <MetricCard
            label="Liquidado histórico"
            value={formatCents(balance?.settledInCents ?? 0)}
            detail="Participaciones procesadas"
          />
          <MetricCard
            label="Liquidaciones"
            value={String(settlements.length)}
            detail={`${settlements.filter((item) => item.status === "PAID").length} pagadas`}
          />
        </section>
      ) : null}

      {settlementTab === "historial" ? (
        <section className="bg-white p-5 sm:p-7">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-paper text-deep font-mono text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Período</th>
                  <th className="px-4 py-3">Participación</th>
                  <th className="px-4 py-3">Creada</th>
                  <th className="px-4 py-3">Pagada</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {settlements.map((settlement) => (
                  <tr key={settlement.id}>
                    <td className="text-ink px-4 py-4 font-semibold">
                      {settlement.periodLabel}
                    </td>
                    <td className="text-deep px-4 py-4 font-mono font-semibold">
                      {formatCents(settlement.totalInCents)}
                    </td>
                    <td className="px-4 py-4">
                      {formatDate(settlement.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      {formatDate(settlement.paidAt)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-1 font-semibold ${
                          settlement.status === "PAID"
                            ? "bg-mint/30 text-deep"
                            : "bg-paper text-muted"
                        }`}
                      >
                        {settlement.status === "PAID" ? "Pagada" : "Pendiente"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {settlement.receiptUrl ? (
                        <a
                          href={settlement.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue hover:text-deep font-bold"
                        >
                          Comprobante
                        </a>
                      ) : (
                        <span className="text-muted">Sin comprobante</span>
                      )}
                    </td>
                  </tr>
                ))}
                {settlements.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-muted px-4 py-10 text-center"
                    >
                      Todavía no hay liquidaciones para mostrar.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function ClubProfileSection({
  data,
  activeAgreement,
}: {
  data: PortalData;
  activeAgreement?: Agreement;
}) {
  const utils = api.useUtils();
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordNotice, setPasswordNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const addMember = api.clubs.addMember.useMutation({
    onSuccess: async () => {
      setEmail("");
      setNotice(
        "Acceso agregado. La persona debe cerrar sesión y volver a ingresar para actualizar su rol.",
      );
      await utils.clubs.portalData.invalidate({ clubId: data.club.id });
    },
    onError: (error) => setNotice(error.message),
  });
  const removeMember = api.clubs.removeMember.useMutation({
    onSuccess: async () => {
      setNotice("Acceso eliminado.");
      await utils.clubs.portalData.invalidate({ clubId: data.club.id });
    },
    onError: (error) => setNotice(error.message),
  });
  const changePassword = api.identity.changePassword.useMutation({
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordNotice({
        type: "success",
        message: "Contraseña actualizada correctamente.",
      });
    },
    onError: (error) =>
      setPasswordNotice({ type: "error", message: error.message }),
  });
  const contactEmail = data.users.find((user) => user.email)?.email;
  const changeRequestHref = `mailto:hola@elestampadero.com?subject=${encodeURIComponent(
    `Solicitud de cambio · ${data.club.name}`,
  )}&body=${encodeURIComponent(
    `Hola, quiero solicitar un cambio en los datos o convenio de ${data.club.name}.`,
  )}`;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <span className="text-blue font-mono text-xs tracking-[.16em] uppercase">
          Mis datos
        </span>
        <h1 className="font-display text-ink mt-1 text-3xl font-black">
          Institución y accesos
        </h1>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1fr_.9fr]">
        <article className="bg-white p-6 sm:p-8">
          <h2 className="font-display text-ink text-2xl font-black">
            Datos del club
          </h2>
          <dl className="mt-6 divide-y divide-black/5">
            {[
              ["Institución", data.club.name],
              ["Actividad", data.club.sport ?? "No informada"],
              ["CBU", data.club.payoutCbu ?? "No informado"],
              ["Contacto", contactEmail ?? "No informado"],
              ["Estado", data.club.isActive ? "Activo" : "Inactivo"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="grid gap-2 py-4 sm:grid-cols-[150px_1fr] sm:items-baseline"
              >
                <dt className="text-mid font-semibold">{label}</dt>
                <dd className="text-ink break-all">{value}</dd>
              </div>
            ))}
          </dl>
          {data.club.description ? (
            <p className="bg-paper text-muted mt-5 p-4 text-sm">
              {data.club.description}
            </p>
          ) : null}
        </article>

        <article className="brand-card-cut bg-deep flex flex-col p-6 text-white sm:p-8">
          <span className="text-mint font-mono text-xs tracking-[.14em] uppercase">
            Convenio vigente
          </span>
          <h2 className="font-display mt-2 text-2xl font-black">
            {activeAgreement?.code ?? "Sin convenio activo"}
          </h2>
          {activeAgreement ? (
            <dl className="mt-6 grid gap-4 text-sm">
              <div className="flex justify-between gap-4 border-b border-white/15 pb-3">
                <dt className="text-white/65">Título</dt>
                <dd className="font-semibold">{activeAgreement.title}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-white/15 pb-3">
                <dt className="text-white/65">Participación</dt>
                <dd className="text-mint font-mono">
                  {activeAgreement.basePercentage}%
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-white/15 pb-3">
                <dt className="text-white/65">Vencimiento</dt>
                <dd>{formatDate(activeAgreement.endDate)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/65">Liquidación</dt>
                <dd>
                  {activeAgreement.settlementMethod === "TRANSFER"
                    ? "Transferencia"
                    : "Split Mercado Pago"}
                </dd>
              </div>
            </dl>
          ) : null}
          <div className="mt-auto flex flex-wrap gap-3 pt-8">
            {activeAgreement?.contractUrl ? (
              <a
                href={activeAgreement.contractUrl}
                target="_blank"
                rel="noreferrer"
                className="border-mint text-mint border-2 px-5 py-3 font-bold hover:bg-white/10"
              >
                Descargar convenio
              </a>
            ) : null}
            <a
              href={changeRequestHref}
              className="brand-cut bg-mint text-deep px-5 py-3 font-bold"
            >
              Solicitar cambio
            </a>
          </div>
        </article>
      </section>

      <section className="bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="text-blue font-mono text-xs tracking-[.14em] uppercase">
              Seguridad
            </span>
            <h2 className="font-display text-ink mt-1 text-2xl font-black">
              Usuarios con acceso
            </h2>
            <p className="text-muted mt-1 text-sm">
              Las cuentas de consulta pueden ver información, pero no aprobar
              diseños ni administrar otros usuarios.
            </p>
          </div>
          {data.canManageMembers ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setNotice(null);
                addMember.mutate({ clubId: data.club.id, email });
              }}
              className="flex flex-col gap-2 sm:flex-row"
            >
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="usuario@mail.com"
                className="focus:border-blue h-12 min-w-64 border-2 border-[#d9d5e2] px-4 outline-none"
              />
              <Button
                type="submit"
                disabled={addMember.isPending}
                loading={addMember.isPending}
                loadingLabel="Agregando acceso"
                className="!min-h-11 !w-auto !px-4 !py-2.5 !text-sm !whitespace-nowrap"
              >
                Agregar acceso
              </Button>
            </form>
          ) : null}
        </div>

        {notice ? (
          <p className="border-mint bg-paper text-deep mt-4 border-l-4 px-4 py-3 text-sm font-semibold">
            {notice}
          </p>
        ) : null}

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {data.users.map((user) => (
            <article
              key={user.id}
              className="flex items-center justify-between gap-4 border border-black/10 p-4"
            >
              <div className="min-w-0">
                <p className="font-display text-ink truncate font-bold">
                  {user.name ?? "Usuario sin nombre"}
                </p>
                <p className="text-muted truncate text-sm">{user.email}</p>
                <span className="bg-paper text-deep mt-2 inline-block px-2 py-1 text-xs font-semibold">
                  {ROLE_LABEL[user.role] ?? user.role}
                </span>
              </div>
              {data.canManageMembers && user.role !== "CLUB_ADMIN" ? (
                <button
                  type="button"
                  disabled={
                    removeMember.isPending &&
                    removeMember.variables?.userId === user.id
                  }
                  aria-busy={
                    (removeMember.isPending &&
                      removeMember.variables?.userId === user.id) ||
                    undefined
                  }
                  onClick={() => {
                    if (
                      window.confirm(
                        `¿Quitar el acceso de ${user.name ?? user.email ?? "este usuario"}?`,
                      )
                    ) {
                      removeMember.mutate({
                        clubId: data.club.id,
                        userId: user.id,
                      });
                    }
                  }}
                  className="text-blue hover:text-deep relative min-w-14 text-sm font-semibold disabled:cursor-wait"
                >
                  <span
                    className={`transition-opacity duration-200 ${
                      removeMember.isPending &&
                      removeMember.variables?.userId === user.id
                        ? "opacity-0"
                        : "opacity-100"
                    }`}
                  >
                    Quitar
                  </span>
                  {removeMember.isPending &&
                  removeMember.variables?.userId === user.id ? (
                    <span
                      aria-hidden="true"
                      className="absolute top-1/2 left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-2 border-current/25 border-t-current"
                    />
                  ) : null}
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 bg-white p-6 sm:p-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
        <div>
          <span className="text-blue font-mono text-xs tracking-[.14em] uppercase">
            Cuenta personal
          </span>
          <h2 className="font-display text-ink mt-1 text-2xl font-black">
            Cambiar contraseña
          </h2>
          <p className="text-muted mt-2 max-w-md text-sm leading-relaxed">
            Elegí una contraseña de al menos 8 caracteres. Este cambio afecta
            únicamente a tu usuario y no modifica los accesos de otras personas
            del club.
          </p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            setPasswordNotice(null);

            if (newPassword !== confirmPassword) {
              setPasswordNotice({
                type: "error",
                message: "Las contraseñas nuevas no coinciden.",
              });
              return;
            }

            changePassword.mutate({
              currentPassword,
              newPassword,
              confirmPassword,
            });
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <label className="grid gap-2 sm:col-span-2">
            <span className="text-ink text-sm font-semibold">
              Contraseña actual
            </span>
            <input
              required
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="focus:border-blue h-12 border-2 border-[#d9d5e2] px-4 outline-none"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-ink text-sm font-semibold">
              Nueva contraseña
            </span>
            <input
              required
              minLength={8}
              maxLength={72}
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="focus:border-blue h-12 border-2 border-[#d9d5e2] px-4 outline-none"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-ink text-sm font-semibold">
              Repetir nueva contraseña
            </span>
            <input
              required
              minLength={8}
              maxLength={72}
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="focus:border-blue h-12 border-2 border-[#d9d5e2] px-4 outline-none"
            />
          </label>

          {passwordNotice ? (
            <p
              role="status"
              className={`border-l-4 px-4 py-3 text-sm font-semibold sm:col-span-2 ${
                passwordNotice.type === "success"
                  ? "border-mint bg-paper text-deep"
                  : "border-red-500 bg-red-50 text-red-800"
              }`}
            >
              {passwordNotice.message}
            </p>
          ) : null}

          <div className="sm:col-span-2">
            <Button
              type="submit"
              disabled={changePassword.isPending}
              loading={changePassword.isPending}
              loadingLabel="Actualizando contraseña"
              className="!min-h-12 !w-auto !px-6"
            >
              Guardar nueva contraseña
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
