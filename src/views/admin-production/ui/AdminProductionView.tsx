"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { AdminPage, AdminPanel } from "elestampadero/shared/ui/admin";
import { ModernSpinner } from "elestampadero/shared/ui/motion";
import { api, type RouterOutputs } from "elestampadero/trpc/react";

type ProductionOrder = RouterOutputs["production"]["orders"][number];
type ProductionItem = ProductionOrder["items"][number];
type ProductionHistoryEntry = RouterOutputs["production"]["history"][number];
type ProductionStage = "waiting" | "production" | "completed";
type ActionKind = "send" | "ready" | "delivered";

const DELAY_OPTIONS = [0, 1, 2, 3, 7, 10, 15] as const;
const ORDERS_PER_PAGE = 10;

const STAGE_COPY: Record<ProductionStage, { step: string; title: string }> = {
  waiting: {
    step: "Paso 1",
    title: "Esperando producción",
  },
  production: {
    step: "Paso 2",
    title: "En producción",
  },
  completed: {
    step: "Paso 3",
    title: "Listos y entregados",
  },
};

function itemBelongsToStage(item: ProductionItem, stage: ProductionStage) {
  if (stage === "waiting") {
    return item.status === "WAITING" || item.status === "SCHEDULED";
  }
  if (stage === "production") return item.status === "IN_PRODUCTION";
  return item.status === "READY" || item.status === "DELIVERED";
}

function itemCanBeSelected(item: ProductionItem, stage: ProductionStage) {
  if (stage === "waiting") return true;
  if (stage === "production") return item.status === "IN_PRODUCTION";
  return item.status === "READY" || item.status === "DELIVERED";
}

function elapsedSincePayment(paidAt: string) {
  const days = paymentAgeDays(paidAt);
  if (days === 0) return "Hoy";
  if (days === 1) return "1 día";
  return `${days} días`;
}

function paymentAgeDays(paidAt: string) {
  return Math.floor(
    Math.max(0, Date.now() - new Date(paidAt).getTime()) / 86_400_000,
  );
}

function ProductionIcon({
  kind,
  className,
}: {
  kind:
    | "search"
    | "club"
    | "calendar"
    | "variant"
    | "waiting"
    | "workshop"
    | "delivered"
    | "refresh"
    | "sort"
    | "sliders"
    | "pointer"
    | "hint"
    | "payment"
    | "plus"
    | "trash"
    | "order"
    | "product"
    | "history"
    | "chevron"
    | "arrow-right";
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      {kind === "search" ? (
        <>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 4.5 4.5" />
        </>
      ) : kind === "club" ? (
        <>
          <path d="M4 20V9l8-5 8 5v11" />
          <path d="M8 20v-6h8v6M8 10h.01M12 10h.01M16 10h.01" />
        </>
      ) : kind === "calendar" ? (
        <>
          <rect x="3.5" y="5" width="17" height="15" rx="2" />
          <path d="M8 3v4m8-4v4M3.5 10h17" />
        </>
      ) : kind === "variant" ? (
        <>
          <path d="m8 4-5 4 3 4 2-1v9h8v-9l2 1 3-4-5-4-2 3h-4L8 4Z" />
          <path d="M10 15h4" />
        </>
      ) : kind === "waiting" ? (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </>
      ) : kind === "workshop" ? (
        <>
          <path d="M3.5 20V10l5 3V9l5 3V6l7 4v10h-17Z" />
          <path d="M8 17h2m4 0h2" />
        </>
      ) : kind === "delivered" ? (
        <>
          <path d="m4 8 8-4 8 4-8 4-8-4Z" />
          <path d="M4 8v8l8 4 8-4V8M12 12v8" />
          <path d="m8.5 15 1.5 1.5 3-3" />
        </>
      ) : kind === "refresh" ? (
        <>
          <path d="M20 7v5h-5" />
          <path d="M18.2 16a8 8 0 1 1 .6-9.2L20 12" />
        </>
      ) : kind === "sort" ? (
        <>
          <path d="M8 4v16m0-16L4.5 7.5M8 4l3.5 3.5M16 20V4m0 16-3.5-3.5M16 20l3.5-3.5" />
        </>
      ) : kind === "sliders" ? (
        <>
          <path d="M4 7h7m4 0h5M4 17h4m4 0h8" />
          <circle cx="13" cy="7" r="2" />
          <circle cx="10" cy="17" r="2" />
        </>
      ) : kind === "pointer" ? (
        <>
          <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-2.5a1.5 1.5 0 0 1 3 0V11m0-2a1.5 1.5 0 0 1 3 0v3m0-1a1.5 1.5 0 0 1 3 0v3.5c0 4.2-2.7 7-6.8 7H13c-2.5 0-4.1-1.1-5.4-3L4.4 14a1.5 1.5 0 0 1 2.3-1.9L9 14" />
          <path d="M5 5h1M7 2l.5 1M3 8l1-.5" />
        </>
      ) : kind === "payment" ? (
        <>
          <rect x="3.5" y="6" width="17" height="12" rx="2" />
          <path d="M3.5 10h17M7 14h3" />
        </>
      ) : kind === "plus" ? (
        <path d="M12 5v14M5 12h14" />
      ) : kind === "trash" ? (
        <>
          <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" />
          <path d="M10 11v5M14 11v5" />
        </>
      ) : kind === "order" ? (
        <>
          <rect x="5" y="3.5" width="14" height="17" rx="2" />
          <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
        </>
      ) : kind === "product" ? (
        <>
          <path d="m4 8 8-4 8 4-8 4-8-4Z" />
          <path d="M4 8v8l8 4 8-4V8M12 12v8" />
        </>
      ) : kind === "history" ? (
        <>
          <path d="M4 12a8 8 0 1 0 2.35-5.65L4 8.7" />
          <path d="M4 4v4.7h4.7M12 7.5V12l3 2" />
        </>
      ) : kind === "chevron" ? (
        <path d="m7 9.5 5 5 5-5" />
      ) : kind === "arrow-right" ? (
        <path d="M4.5 12h15m-6-6 6 6-6 6" />
      ) : (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 10v7m0-10.5v.2" />
        </>
      )}
    </svg>
  );
}

function EmptyProductionIllustration() {
  return (
    <svg
      className="admin-production-empty-illustration"
      viewBox="0 0 150 120"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="78" cy="60" r="52" fill="#F2ECFA" />
      <path
        d="M39 32h46a6 6 0 0 1 6 6v53a6 6 0 0 1-6 6H39a6 6 0 0 1-6-6V38a6 6 0 0 1 6-6Z"
        fill="white"
        stroke="#6730AE"
        strokeWidth="3"
      />
      <path
        d="M53 31v-7h16v7m-22 0h28v10H47V31Z"
        fill="white"
        stroke="#6730AE"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M45 55h27M45 67h19M45 79h24"
        stroke="#D9CBEA"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="m73 65 30-15 31 15-31 16-30-16Z"
        fill="white"
        stroke="#5520A5"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="m73 65 1 34 29 15V81L73 65Zm61 0-1 34-30 15V81l31-16Z"
        fill="#F7F3FC"
        stroke="#5520A5"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="m91 57 30 16v11l-10 5V78L81 62"
        stroke="#5520A5"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M19 49h10m-5-5v10M129 34h10m-5-5v10"
        stroke="#CDB4EA"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function formattedDate(value: string) {
  return new Date(value).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function actionForStage(stage: ProductionStage): ActionKind {
  if (stage === "waiting") return "send";
  if (stage === "production") return "ready";
  return "delivered";
}

function actionLabel(kind: ActionKind, count?: number) {
  const suffix = count ? ` (${count})` : "";
  if (kind === "send") return `Enviar a producción${suffix}`;
  if (kind === "ready") return `Producción finalizada${suffix}`;
  return `Marcar como enviado${suffix}`;
}

function paymentNotice(status: string | null) {
  if (status === "CANCELLED") {
    return { label: "Pago anulado", tone: "cancelled" } as const;
  }
  if (status === "REFUNDED") {
    return { label: "Pago reintegrado", tone: "refunded" } as const;
  }
  if (status === "PARTIALLY_REFUNDED") {
    return { label: "Reintegro parcial", tone: "partial" } as const;
  }
  return null;
}

export function AdminProductionView() {
  const utils = api.useUtils();
  const [activeStage, setActiveStage] = useState<ProductionStage>("waiting");
  const [showHistory, setShowHistory] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialog, setDialog] = useState<{
    kind: ActionKind;
    itemIds: string[];
    step: "schedule" | "confirm";
  } | null>(null);
  const [delayDays, setDelayDays] = useState(0);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [clubFilter, setClubFilter] = useState("all");
  const [variantFilter, setVariantFilter] = useState("all");
  const [productionPage, setProductionPage] = useState(1);
  const [collapsedOrderIds, setCollapsedOrderIds] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(
    null,
  );
  const [orderToRemove, setOrderToRemove] = useState<ProductionOrder | null>(
    null,
  );
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualTab, setManualTab] = useState<"order" | "product">("order");
  const [selectedRemovedOrderId, setSelectedRemovedOrderId] = useState("");
  const [manualProduct, setManualProduct] = useState({
    productName: "",
    size: "",
    color: "",
    quantity: "1",
    notes: "",
  });

  const ordersQuery = api.production.orders.useQuery(undefined, {
    refetchInterval: 30_000,
  });
  const historyQuery = api.production.history.useQuery(undefined, {
    enabled: showHistory,
    refetchInterval: showHistory ? 30_000 : false,
  });
  const removedOrdersQuery = api.production.removedOrders.useQuery(undefined, {
    enabled: manualModalOpen && manualTab === "order",
  });

  const finishMutation = async (successMessage: string) => {
    await Promise.all([
      utils.production.orders.invalidate(),
      utils.production.history.invalidate(),
      utils.orders.list.invalidate(),
    ]);
    setDialog(null);
    setSelectedIds([]);
    setMessage(successMessage);
  };
  const showMutationError = (error: { message: string }) => {
    setDialog(null);
    setMessage(error.message || "No se pudo actualizar la producción.");
  };

  const sendItems = api.production.sendItems.useMutation({
    onSuccess: () =>
      finishMutation(
        delayDays === 0
          ? "Los productos fueron enviados a producción."
          : `Los productos quedaron programados para dentro de ${delayDays} días.`,
      ),
    onError: showMutationError,
  });
  const markReady = api.production.markReady.useMutation({
    onSuccess: () =>
      finishMutation("Los productos fueron marcados como listos."),
    onError: showMutationError,
  });
  const markShipped = api.production.markShipped.useMutation({
    onSuccess: () =>
      finishMutation("Los productos fueron marcados como enviados."),
    onError: showMutationError,
  });
  const removeOrder = api.production.removeOrder.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.production.orders.invalidate(),
        utils.production.history.invalidate(),
        utils.production.removedOrders.invalidate(),
      ]);
      setOrderToRemove(null);
      setMessage(
        "El pedido se quitó de Producción. Podés volver a cargarlo manualmente desde Esperando producción.",
      );
    },
    onError: showMutationError,
  });
  const restoreOrder = api.production.restoreOrder.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.production.orders.invalidate(),
        utils.production.removedOrders.invalidate(),
      ]);
      setManualModalOpen(false);
      setSelectedRemovedOrderId("");
      setMessage("El pedido volvió a Esperando producción.");
    },
    onError: (error) => setMessage(error.message),
  });
  const createManualItem = api.production.createManualItem.useMutation({
    onSuccess: async () => {
      await utils.production.orders.invalidate();
      setManualModalOpen(false);
      setManualProduct({
        productName: "",
        size: "",
        color: "",
        quantity: "1",
        notes: "",
      });
      setMessage("El producto manual se agregó a Esperando producción.");
    },
    onError: (error) => setMessage(error.message),
  });

  const stageOrders = useMemo(
    () =>
      (ordersQuery.data ?? [])
        .map((order) => ({
          ...order,
          items: order.items.filter((item) =>
            itemBelongsToStage(item, activeStage),
          ),
        }))
        .filter((order) => order.items.length > 0),
    [activeStage, ordersQuery.data],
  );

  const clubOptions = useMemo(() => {
    const clubs = new Map<
      string,
      { id: string; name: string; logoUrl: string | null }
    >();
    for (const order of ordersQuery.data ?? []) {
      for (const item of order.items) {
        if (item.club) clubs.set(item.club.id, item.club);
      }
    }
    return [...clubs.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [ordersQuery.data]);

  const clubFilterLabel =
    clubFilter === "all"
      ? activeStage === "waiting"
        ? "Todos los clubes"
        : activeStage === "completed"
          ? "Filtros"
          : "Club / Institución"
      : (clubOptions.find((club) => club.id === clubFilter)?.name ??
        "Club / Institución");

  const variantOptions = useMemo(
    () =>
      [
        ...new Set(
          (ordersQuery.data ?? []).flatMap((order) =>
            order.items.map((item) => item.size),
          ),
        ),
      ].sort(),
    [ordersQuery.data],
  );

  const visibleOrders = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es");
    return stageOrders
      .map((order) => ({
        ...order,
        items: order.items.filter((item) => {
          const matchesSearch =
            !term ||
            item.productName.toLocaleLowerCase("es").includes(term) ||
            order.contactName.toLocaleLowerCase("es").includes(term) ||
            String(order.orderNumber).includes(term) ||
            item.club?.name.toLocaleLowerCase("es").includes(term);
          const matchesClub =
            clubFilter === "all" || item.club?.id === clubFilter;
          const matchesVariant =
            variantFilter === "all" || item.size === variantFilter;
          return matchesSearch && matchesClub && matchesVariant;
        }),
      }))
      .filter((order) => order.items.length > 0)
      .sort(
        (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
      );
  }, [clubFilter, search, stageOrders, variantFilter]);

  const visibleHistory = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es");
    if (!term) return historyQuery.data ?? [];
    return (historyQuery.data ?? []).filter(
      (entry: ProductionHistoryEntry) =>
        entry.contactName.toLocaleLowerCase("es").includes(term) ||
        (entry.contactEmail?.toLocaleLowerCase("es").includes(term) ?? false) ||
        String(entry.orderNumber ?? "").includes(term) ||
        entry.items.some(
          (item) =>
            item.productName.toLocaleLowerCase("es").includes(term) ||
            (item.club?.name.toLocaleLowerCase("es").includes(term) ?? false),
        ),
    );
  }, [historyQuery.data, search]);

  const totalProductionPages = Math.max(
    1,
    Math.ceil(
      (showHistory ? visibleHistory.length : visibleOrders.length) /
        ORDERS_PER_PAGE,
    ),
  );
  const paginatedOrders = visibleOrders.slice(
    (productionPage - 1) * ORDERS_PER_PAGE,
    productionPage * ORDERS_PER_PAGE,
  );
  const paginatedHistory = visibleHistory.slice(
    (productionPage - 1) * ORDERS_PER_PAGE,
    productionPage * ORDERS_PER_PAGE,
  );

  useEffect(() => {
    setProductionPage(1);
    setCollapsedOrderIds([]);
  }, [activeStage, clubFilter, search, showHistory, variantFilter]);

  useEffect(() => {
    setProductionPage((currentPage) =>
      Math.min(currentPage, totalProductionPages),
    );
  }, [totalProductionPages]);

  const activeCopy = showHistory
    ? { step: "Registro", title: "Historial de producción" }
    : STAGE_COPY[activeStage];
  const selectedCount = selectedIds.length;
  const isMutating =
    sendItems.isPending || markReady.isPending || markShipped.isPending;

  const changeStage = (stage: ProductionStage) => {
    setShowHistory(false);
    setActiveStage(stage);
    setSelectedIds([]);
    setMessage("");
  };

  const toggleItem = (itemId: string) => {
    setSelectedIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId],
    );
  };

  const toggleOrder = (order: ProductionOrder) => {
    const orderIds = order.items
      .filter((item) => itemCanBeSelected(item, activeStage))
      .map((item) => item.id);
    const orderSelected = orderIds.every((id) => selectedIds.includes(id));
    setSelectedIds((current) =>
      orderSelected
        ? current.filter((id) => !orderIds.includes(id))
        : [...new Set([...current, ...orderIds])],
    );
  };

  const toggleOrderCollapsed = (orderId: string) => {
    setCollapsedOrderIds((current) =>
      current.includes(orderId)
        ? current.filter((id) => id !== orderId)
        : [...current, orderId],
    );
  };

  const openAction = (kind: ActionKind, itemIds: string[]) => {
    setDelayDays(0);
    setDialog({
      kind,
      itemIds,
      step: kind === "send" ? "schedule" : "confirm",
    });
  };

  const confirmAction = () => {
    if (!dialog) return;
    if (dialog.kind === "send") {
      sendItems.mutate({ itemIds: dialog.itemIds, delayDays });
    } else if (dialog.kind === "ready") {
      markReady.mutate({ itemIds: dialog.itemIds });
    } else {
      markShipped.mutate({ itemIds: dialog.itemIds });
    }
  };

  const bulkKind = actionForStage(activeStage);

  return (
    <AdminPage
      module="Módulo de Producción"
      title="Gestión de producción"
      className="admin-production-page"
      hideHeader
    >
      <AdminPanel className="admin-panel-pad admin-production-workspace">
        <div className="admin-production-heading">
          <div>
            <span className="admin-production-module-label">
              Módulo de Producción
            </span>
            <span className="admin-production-section-label">
              {activeCopy.step}
            </span>
            <h2 className="admin-panel-title">{activeCopy.title}</h2>
          </div>
          <button
            type="button"
            className={`admin-production-history-toggle ${showHistory ? "is-active" : ""}`}
            onClick={() => {
              setShowHistory((current) => !current);
              setSelectedIds([]);
              setSearch("");
              setMessage("");
            }}
          >
            <ProductionIcon kind="history" />
            {showHistory ? "Volver al tablero" : "Ver historial"}
          </button>
        </div>

        <div
          className="admin-production-flow"
          role="tablist"
          aria-label="Flujo de producción"
          hidden={showHistory}
        >
          {(
            [
              [
                "waiting",
                "1",
                "Esperando producción",
                "Pagados o programados",
                "waiting",
              ],
              [
                "production",
                "2",
                "En producción",
                "En preparación en el taller",
                "workshop",
              ],
              [
                "completed",
                "3",
                "Listos y entregados",
                "Seguimiento de entrega",
                "delivered",
              ],
            ] as const
          ).map(([stage, number, title, description, icon], index) => {
            const activeIndex = ["waiting", "production", "completed"].indexOf(
              activeStage,
            );
            const completed = index < activeIndex;
            return (
              <button
                key={stage}
                type="button"
                role="tab"
                aria-selected={activeStage === stage}
                className={`${activeStage === stage ? "is-active" : ""} ${completed ? "is-completed" : ""}`}
                onClick={() => changeStage(stage)}
              >
                <span className="admin-production-step-icon">
                  <ProductionIcon kind={icon} />
                  <i>{completed ? "✓" : number}</i>
                </span>
                <div>
                  <strong>{title}</strong>
                  <small>{description}</small>
                </div>
              </button>
            );
          })}
        </div>

        {message ? (
          <p className="admin-production-message" role="status">
            {message}
          </p>
        ) : null}

        {showHistory ? (
          <section className="admin-production-section admin-production-history-panel">
            <header className="admin-production-products-header">
              <div className="admin-production-products-copy">
                <h3>Pedidos finalizados</h3>
                <p>
                  Registro de pedidos enviados o quitados de producción. Esta
                  sección es únicamente de lectura.
                </p>
              </div>
              <div className="admin-production-filters">
                <label className="admin-production-filter admin-production-search">
                  <ProductionIcon kind="search" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar en el historial"
                  />
                </label>
              </div>
            </header>

            <div className="admin-production-history-list">
              {historyQuery.isLoading ? (
                <div className="admin-production-loading">
                  <ModernSpinner label="Cargando historial..." />
                </div>
              ) : null}

              {!historyQuery.isLoading && visibleHistory.length === 0 ? (
                <div className="admin-production-empty-state">
                  <span className="admin-production-history-empty-icon">
                    <ProductionIcon kind="history" />
                  </span>
                  <strong>No hay movimientos en el historial</strong>
                  <p>
                    Los pedidos enviados o quitados de producción aparecerán acá
                    automáticamente.
                  </p>
                  <button
                    type="button"
                    className="admin-production-refresh"
                    onClick={() => void historyQuery.refetch()}
                  >
                    <ProductionIcon kind="refresh" />
                    Actualizar
                  </button>
                </div>
              ) : null}

              {paginatedHistory.map((entry) => {
                const unitCount = entry.items.reduce(
                  (sum, item) => sum + item.quantity,
                  0,
                );
                const removed = entry.historyStatus === "REMOVED";
                return (
                  <article
                    className="admin-production-history-entry"
                    key={`${entry.historyStatus}:${entry.orderId}`}
                  >
                    <span
                      className={`admin-production-history-entry__icon ${removed ? "is-removed" : "is-shipped"}`}
                    >
                      <ProductionIcon kind={removed ? "trash" : "delivered"} />
                    </span>
                    <div className="admin-production-history-entry__main">
                      <span>
                        {entry.isManual
                          ? "Carga manual"
                          : `Pedido #${String(entry.orderNumber).padStart(6, "0")}`}
                      </span>
                      <strong>{entry.contactName}</strong>
                      <small>
                        {entry.items.length} producto
                        {entry.items.length === 1 ? "" : "s"} · {unitCount}{" "}
                        {unitCount === 1 ? "unidad" : "unidades"}
                      </small>
                    </div>
                    <div className="admin-production-history-entry__date">
                      <small>{removed ? "Quitado el" : "Enviado el"}</small>
                      <time dateTime={entry.historyAt}>
                        {formattedDate(entry.historyAt)}
                      </time>
                    </div>
                    <span
                      className={`admin-production-history-entry__status ${removed ? "is-removed" : "is-shipped"}`}
                    >
                      {removed ? "Quitado" : "Enviado"}
                    </span>
                    <button
                      type="button"
                      className="admin-production-history-entry__view"
                      onClick={() => setSelectedOrder(entry)}
                    >
                      Ver detalle
                      <ProductionIcon kind="arrow-right" />
                    </button>
                  </article>
                );
              })}

              {totalProductionPages > 1 ? (
                <nav
                  className="admin-production-pagination"
                  aria-label="Paginación del historial"
                >
                  <button
                    type="button"
                    disabled={productionPage === 1}
                    onClick={() => setProductionPage((page) => page - 1)}
                  >
                    <ProductionIcon
                      kind="arrow-right"
                      className="admin-production-pagination-previous"
                    />
                    Anterior
                  </button>
                  <span>
                    Página {productionPage} de {totalProductionPages}
                  </span>
                  <button
                    type="button"
                    disabled={productionPage === totalProductionPages}
                    onClick={() => setProductionPage((page) => page + 1)}
                  >
                    Siguiente
                    <ProductionIcon kind="arrow-right" />
                  </button>
                </nav>
              ) : null}
            </div>
          </section>
        ) : null}

        <section
          className={`admin-production-section admin-production-products-section admin-production-products-section--${activeStage}`}
          hidden={showHistory}
        >
          <header className="admin-production-products-header">
            <div className="admin-production-products-copy">
              <h3>Productos por pedido</h3>
              {activeStage === "waiting" ? (
                <button
                  type="button"
                  className="admin-production-manual-add"
                  onClick={() => {
                    setManualTab("order");
                    setManualModalOpen(true);
                  }}
                >
                  <ProductionIcon kind="plus" />
                  Cargar pedido o producto
                </button>
              ) : null}
              <button
                type="button"
                className="admin-btn admin-btn--primary admin-production-bulk-action admin-production-bulk-action--inline"
                disabled={selectedCount < 2}
                onClick={() => openAction(bulkKind, selectedIds)}
              >
                {actionLabel(
                  bulkKind,
                  selectedCount >= 2 ? selectedCount : undefined,
                )}
              </button>
            </div>

            <div className="admin-production-filters">
              <label className="admin-production-filter admin-production-search">
                <ProductionIcon kind="search" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar producto o pedido"
                />
              </label>

              <details className="admin-production-filter admin-production-club-filter">
                <summary>
                  <ProductionIcon
                    kind={activeStage === "completed" ? "sliders" : "club"}
                  />
                  <span>{clubFilterLabel}</span>
                  <ProductionIcon
                    kind="chevron"
                    className="admin-production-chevron"
                  />
                </summary>
                <div className="admin-production-club-options">
                  <button
                    type="button"
                    className={clubFilter === "all" ? "is-active" : ""}
                    onClick={(event) => {
                      setClubFilter("all");
                      event.currentTarget
                        .closest("details")
                        ?.removeAttribute("open");
                    }}
                  >
                    <span className="admin-production-club-option-icon">
                      <ProductionIcon
                        kind={activeStage === "completed" ? "sliders" : "club"}
                      />
                    </span>
                    <span>
                      {clubFilterLabel === "Filtros"
                        ? "Todos"
                        : "Todos los clubes"}
                    </span>
                  </button>
                  {clubOptions.map((club) => (
                    <button
                      type="button"
                      className={clubFilter === club.id ? "is-active" : ""}
                      key={club.id}
                      onClick={(event) => {
                        setClubFilter(club.id);
                        event.currentTarget
                          .closest("details")
                          ?.removeAttribute("open");
                      }}
                    >
                      <span className="admin-production-club-option-icon">
                        {club.logoUrl ? (
                          <Image
                            src={club.logoUrl}
                            alt=""
                            width={24}
                            height={24}
                          />
                        ) : (
                          <ProductionIcon kind="club" />
                        )}
                      </span>
                      <span>{club.name}</span>
                    </button>
                  ))}
                </div>
              </details>

              {activeStage === "production" ? (
                <label className="admin-production-filter">
                  <ProductionIcon kind="variant" />
                  <select
                    value={variantFilter}
                    onChange={(event) => setVariantFilter(event.target.value)}
                  >
                    <option value="all">Variante</option>
                    {variantOptions.map((variant) => (
                      <option key={variant} value={variant}>
                        Talle {variant}
                      </option>
                    ))}
                  </select>
                  <ProductionIcon
                    kind="chevron"
                    className="admin-production-chevron"
                  />
                </label>
              ) : null}
            </div>
          </header>

          <div className="admin-production-order-list">
            {ordersQuery.isLoading ? (
              <div className="admin-production-loading">
                <ModernSpinner label="Cargando producción..." />
              </div>
            ) : null}

            {!ordersQuery.isLoading && visibleOrders.length === 0 ? (
              <div className="admin-production-empty-state">
                <EmptyProductionIllustration />
                <strong>
                  {activeStage === "waiting"
                    ? "No hay productos esperando producción"
                    : activeStage === "production"
                      ? "No hay productos en producción"
                      : "No hay productos listos o entregados"}
                </strong>
                <p>
                  {activeStage === "waiting"
                    ? "Los productos pagados aparecerán acá cuando estén listos para enviar al taller."
                    : "Los productos aparecerán acá cuando alcancen esta etapa."}
                </p>
                <button
                  type="button"
                  className="admin-production-refresh"
                  onClick={() => void ordersQuery.refetch()}
                >
                  <ProductionIcon kind="refresh" />
                  Actualizar
                </button>
              </div>
            ) : null}

            {paginatedOrders.map((order) => {
              const orderSelectableIds = order.items
                .filter((item) => itemCanBeSelected(item, activeStage))
                .map((item) => item.id);
              const orderSelected =
                orderSelectableIds.length > 0 &&
                orderSelectableIds.every((id) => selectedIds.includes(id));
              return (
                <article
                  className={`admin-production-order-card ${collapsedOrderIds.includes(order.orderId) ? "is-collapsed" : ""}`}
                  key={order.orderId}
                >
                  <header
                    aria-expanded={!collapsedOrderIds.includes(order.orderId)}
                    tabIndex={0}
                    onClick={(event) => {
                      if (
                        (event.target as HTMLElement).closest(
                          "a, input, button",
                        )
                      ) {
                        return;
                      }
                      toggleOrderCollapsed(order.orderId);
                    }}
                    onKeyDown={(event) => {
                      if (
                        (event.key === "Enter" || event.key === " ") &&
                        !(event.target as HTMLElement).closest(
                          "a, input, button",
                        )
                      ) {
                        event.preventDefault();
                        toggleOrderCollapsed(order.orderId);
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={orderSelected}
                      onChange={() => toggleOrder(order)}
                      disabled={orderSelectableIds.length === 0}
                      aria-label={
                        order.isManual
                          ? "Seleccionar carga manual"
                          : `Seleccionar pedido ${order.orderNumber}`
                      }
                    />
                    <strong>
                      {order.isManual
                        ? "Carga manual"
                        : `Pedido #${String(order.orderNumber).padStart(6, "0")}`}
                    </strong>
                    <span>{order.contactName}</span>
                    <small>{order.contactEmail ?? "Sin venta asociada"}</small>
                    {order.batchNumber ? (
                      <em>Tanda #{order.batchNumber}</em>
                    ) : null}
                    <div className="admin-production-order-actions">
                      {!order.isManual ? (
                        <button
                          type="button"
                          className="admin-production-order-remove"
                          title="Quitar de Producción"
                          onClick={(event) => {
                            event.stopPropagation();
                            setOrderToRemove(order);
                          }}
                        >
                          <ProductionIcon kind="trash" />
                          Quitar
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="admin-production-order-link"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedOrder(order);
                        }}
                      >
                        {order.isManual ? "Ver carga" : "Ver pedido"}
                        <ProductionIcon kind="arrow-right" />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="admin-production-collapse-toggle"
                      aria-expanded={!collapsedOrderIds.includes(order.orderId)}
                      aria-label={`${collapsedOrderIds.includes(order.orderId) ? "Desplegar" : "Plegar"} ${order.isManual ? "carga manual" : `pedido ${order.orderNumber}`}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleOrderCollapsed(order.orderId);
                      }}
                    >
                      <ProductionIcon kind="chevron" />
                    </button>
                  </header>

                  <div
                    className="admin-production-order-columns"
                    aria-hidden="true"
                  >
                    <span />
                    <strong>Producto</strong>
                    <strong>Variante</strong>
                    <strong>Cantidad</strong>
                    <strong>Tiempo desde el pago</strong>
                    <strong>Acción</strong>
                  </div>

                  {order.items.map((item) => {
                    const selectable = itemCanBeSelected(item, activeStage);
                    const paymentStatus = paymentNotice(order.paymentStatus);
                    return (
                      <div
                        className="admin-production-order-item"
                        key={item.id}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleItem(item.id)}
                          disabled={!selectable}
                          aria-label={`Seleccionar ${item.productName}`}
                        />
                        <div className="admin-production-product-cell">
                          <span>
                            <Image
                              src={item.imageUrl ?? "/images/remeras.png"}
                              alt=""
                              width={72}
                              height={72}
                            />
                          </span>
                          <strong>{item.productName}</strong>
                        </div>
                        <span className="admin-production-variant">
                          Talle {item.size} · {item.color}
                        </span>
                        <span className="admin-production-quantity">
                          <strong>{item.quantity}</strong>
                        </span>
                        <span className="admin-production-elapsed">
                          <strong>{elapsedSincePayment(order.paidAt)}</strong>
                          <small>Pagado el {formattedDate(order.paidAt)}</small>
                        </span>
                        <div className="admin-production-item-action-cell">
                          {item.status === "SHIPPED" ? (
                            <span className="admin-production-item-status">
                              Enviado
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="admin-production-item-action admin-production-item-action--primary"
                              disabled={selectedCount >= 2}
                              onClick={() =>
                                openAction(actionForStage(activeStage), [
                                  item.id,
                                ])
                              }
                            >
                              {activeStage === "waiting"
                                ? item.status === "SCHEDULED"
                                  ? "Reprogramar"
                                  : "Enviar a producción"
                                : activeStage === "production"
                                  ? "Marcar como listo"
                                  : "Marcar enviado"}
                            </button>
                          )}
                          {paymentStatus ? (
                            <span
                              className={`admin-production-payment-notice admin-production-payment-notice--${paymentStatus.tone}`}
                            >
                              <ProductionIcon kind="payment" />
                              {paymentStatus.label}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </article>
              );
            })}

            {totalProductionPages > 1 ? (
              <nav
                className="admin-production-pagination"
                aria-label="Paginación de pedidos"
              >
                <button
                  type="button"
                  disabled={productionPage === 1}
                  onClick={() => setProductionPage((page) => page - 1)}
                >
                  <ProductionIcon
                    kind="arrow-right"
                    className="admin-production-pagination-previous"
                  />
                  Anterior
                </button>
                <span>
                  Página {productionPage} de {totalProductionPages}
                </span>
                <button
                  type="button"
                  disabled={productionPage === totalProductionPages}
                  onClick={() => setProductionPage((page) => page + 1)}
                >
                  Siguiente
                  <ProductionIcon kind="arrow-right" />
                </button>
              </nav>
            ) : null}
          </div>
        </section>
      </AdminPanel>

      {orderToRemove ? (
        <div className="admin-period-modal-backdrop admin-production-modal-backdrop">
          <section
            className="admin-period-modal admin-production-remove-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="remove-production-order-title"
          >
            <div className="admin-production-remove-modal__heading">
              <span className="admin-production-modal-icon is-danger">
                <ProductionIcon kind="trash" />
              </span>
              <div>
                <span>Gestión de producción</span>
                <h2 id="remove-production-order-title">Quitar de producción</h2>
              </div>
            </div>
            <p>
              El pedido #{String(orderToRemove.orderNumber).padStart(6, "0")}{" "}
              dejará de aparecer en el tablero. La venta y su pago permanecerán
              guardados.
            </p>
            <div className="admin-production-warning-card">
              <ProductionIcon kind="hint" />
              <span>
                Para volver a trabajarlo, tendrás que cargarlo nuevamente desde{" "}
                <strong>Esperando producción</strong> usando el botón “Cargar
                pedido o producto”.
              </span>
            </div>
            <footer>
              <button
                type="button"
                className="admin-btn"
                disabled={removeOrder.isPending}
                onClick={() => setOrderToRemove(null)}
              >
                Conservar pedido
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--danger"
                disabled={removeOrder.isPending}
                onClick={() =>
                  removeOrder.mutate({ orderId: orderToRemove.orderId })
                }
              >
                <ProductionIcon kind="trash" />
                {removeOrder.isPending ? "Quitando…" : "Quitar pedido"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {manualModalOpen ? (
        <div
          className="admin-period-modal-backdrop admin-production-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !restoreOrder.isPending &&
              !createManualItem.isPending
            ) {
              setManualModalOpen(false);
            }
          }}
        >
          <section
            className="admin-period-modal admin-production-manual-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="manual-production-title"
          >
            <button
              type="button"
              className="admin-modal-close"
              aria-label="Cerrar carga manual"
              onClick={() => setManualModalOpen(false)}
            >
              ×
            </button>
            <span>Carga manual</span>
            <h2 id="manual-production-title">Agregar a Esperando producción</h2>
            <div className="admin-production-manual-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={manualTab === "order"}
                className={manualTab === "order" ? "is-active" : ""}
                onClick={() => setManualTab("order")}
              >
                <ProductionIcon kind="order" />
                Pedido eliminado
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={manualTab === "product"}
                className={manualTab === "product" ? "is-active" : ""}
                onClick={() => setManualTab("product")}
              >
                <ProductionIcon kind="product" />
                Producto manual
              </button>
            </div>

            {manualTab === "order" ? (
              <div className="admin-production-manual-panel">
                <p>Seleccioná un pedido que hayas quitado anteriormente.</p>
                <div className="admin-production-removed-orders">
                  {removedOrdersQuery.isLoading ? (
                    <ModernSpinner label="Buscando pedidos..." />
                  ) : null}
                  {removedOrdersQuery.data?.map((order) => (
                    <label
                      key={order.orderId}
                      className={
                        selectedRemovedOrderId === order.orderId
                          ? "is-selected"
                          : ""
                      }
                    >
                      <input
                        type="radio"
                        name="removed-production-order"
                        value={order.orderId}
                        checked={selectedRemovedOrderId === order.orderId}
                        onChange={() =>
                          setSelectedRemovedOrderId(order.orderId)
                        }
                      />
                      <ProductionIcon kind="order" />
                      <span>
                        <strong>
                          Pedido #{String(order.orderNumber).padStart(6, "0")}
                        </strong>
                        <small>
                          {order.contactName} · {order.itemCount} producto
                          {order.itemCount === 1 ? "" : "s"} · {order.unitCount}{" "}
                          unidad{order.unitCount === 1 ? "" : "es"}
                        </small>
                      </span>
                    </label>
                  ))}
                  {!removedOrdersQuery.isLoading &&
                  removedOrdersQuery.data?.length === 0 ? (
                    <div className="admin-production-manual-empty">
                      No hay pedidos eliminados para volver a cargar.
                    </div>
                  ) : null}
                </div>
                <footer>
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => setManualModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--primary"
                    disabled={!selectedRemovedOrderId || restoreOrder.isPending}
                    onClick={() =>
                      restoreOrder.mutate({ orderId: selectedRemovedOrderId })
                    }
                  >
                    <ProductionIcon kind="plus" />
                    {restoreOrder.isPending ? "Cargando…" : "Cargar pedido"}
                  </button>
                </footer>
              </div>
            ) : (
              <div className="admin-production-manual-panel">
                <div className="admin-production-warning-card">
                  <ProductionIcon kind="hint" />
                  <span>
                    Este producto no estará relacionado con ningún pedido y{" "}
                    <strong>no se verá reflejado en las ventas</strong>, porque
                    no tiene un precio asociado.
                  </span>
                </div>
                <div className="admin-production-manual-fields">
                  <label>
                    <span>Nombre del producto</span>
                    <input
                      value={manualProduct.productName}
                      placeholder="Ej. Remera para exhibición"
                      onChange={(event) =>
                        setManualProduct((current) => ({
                          ...current,
                          productName: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    <span>Talle</span>
                    <input
                      value={manualProduct.size}
                      placeholder="Ej. M"
                      onChange={(event) =>
                        setManualProduct((current) => ({
                          ...current,
                          size: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    <span>Color</span>
                    <input
                      value={manualProduct.color}
                      placeholder="Ej. Negro"
                      onChange={(event) =>
                        setManualProduct((current) => ({
                          ...current,
                          color: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    <span>Cantidad</span>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={manualProduct.quantity}
                      onChange={(event) =>
                        setManualProduct((current) => ({
                          ...current,
                          quantity: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="is-wide">
                    <span>Nota interna (opcional)</span>
                    <textarea
                      value={manualProduct.notes}
                      placeholder="Información útil para el taller"
                      onChange={(event) =>
                        setManualProduct((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
                <footer>
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => setManualModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--primary"
                    disabled={
                      createManualItem.isPending ||
                      !manualProduct.productName.trim() ||
                      !manualProduct.size.trim() ||
                      !manualProduct.color.trim() ||
                      !Number.isInteger(Number(manualProduct.quantity)) ||
                      Number(manualProduct.quantity) < 1
                    }
                    onClick={() =>
                      createManualItem.mutate({
                        productName: manualProduct.productName,
                        size: manualProduct.size,
                        color: manualProduct.color,
                        quantity: Number(manualProduct.quantity),
                        ...(manualProduct.notes.trim()
                          ? { notes: manualProduct.notes }
                          : {}),
                      })
                    }
                  >
                    <ProductionIcon kind="plus" />
                    {createManualItem.isPending
                      ? "Agregando…"
                      : "Agregar a producción"}
                  </button>
                </footer>
              </div>
            )}
          </section>
        </div>
      ) : null}

      {selectedOrder ? (
        <div
          className="admin-period-modal-backdrop admin-production-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedOrder(null);
          }}
        >
          <section
            className="admin-period-modal admin-production-order-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="production-order-detail-title"
          >
            <button
              type="button"
              className="admin-modal-close"
              aria-label={
                selectedOrder.isManual
                  ? "Cerrar detalle de la carga manual"
                  : "Cerrar detalle del pedido"
              }
              onClick={() => setSelectedOrder(null)}
            >
              ×
            </button>
            <span>
              {selectedOrder.isManual
                ? "Detalle de la carga manual"
                : "Detalle del pedido"}
            </span>
            <h2 id="production-order-detail-title">
              {selectedOrder.isManual
                ? "Producto cargado manualmente"
                : `Pedido #${String(selectedOrder.orderNumber).padStart(6, "0")}`}
            </h2>
            <div className="admin-production-order-modal__customer">
              <strong>{selectedOrder.contactName}</strong>
              <small>
                {selectedOrder.contactEmail ?? "Sin venta asociada"}
              </small>
            </div>
            <div className="admin-production-order-modal__items">
              {selectedOrder.items.map((item) => (
                <article key={item.id}>
                  <Image
                    src={item.imageUrl ?? "/images/remeras.png"}
                    alt=""
                    width={64}
                    height={64}
                  />
                  <div>
                    <strong>{item.productName}</strong>
                    <small>
                      Talle {item.size} · {item.color} · {item.quantity}{" "}
                      {item.quantity === 1 ? "unidad" : "unidades"}
                    </small>
                    {item.notes ? (
                      <small className="admin-production-manual-note">
                        Nota: {item.notes}
                      </small>
                    ) : null}
                  </div>
                  <span>{item.status.replaceAll("_", " ")}</span>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {dialog ? (
        <div
          className="admin-period-modal-backdrop admin-production-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isMutating) {
              setDialog(null);
            }
          }}
        >
          <section
            className="admin-period-modal admin-production-action-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="production-action-title"
          >
            <button
              type="button"
              className="admin-modal-close"
              aria-label="Cerrar"
              disabled={isMutating}
              onClick={() => setDialog(null)}
            >
              ×
            </button>

            {dialog.kind === "send" && dialog.step === "schedule" ? (
              <>
                <span>Programación de producción</span>
                <h2 id="production-action-title">¿Cuándo querés enviarlos?</h2>
                <p>
                  Elegí si los {dialog.itemIds.length} producto(s) ingresan al
                  taller ahora o quedan programados para más adelante.
                </p>
                <div className="admin-production-delay-options">
                  {DELAY_OPTIONS.map((days) => (
                    <button
                      key={days}
                      type="button"
                      className={delayDays === days ? "is-active" : ""}
                      onClick={() => setDelayDays(days)}
                    >
                      <strong>{days === 0 ? "Ahora" : days}</strong>
                      {days > 0 ? (
                        <small>{days === 1 ? "día" : "días"}</small>
                      ) : null}
                    </button>
                  ))}
                </div>
                <label className="admin-production-custom-delay">
                  <span>Otra cantidad de días</span>
                  <div>
                    <input
                      type="number"
                      min={0}
                      max={365}
                      step={1}
                      value={delayDays}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        setDelayDays(
                          Number.isFinite(value)
                            ? Math.min(365, Math.max(0, Math.floor(value)))
                            : 0,
                        );
                      }}
                      aria-label="Cantidad personalizada de días"
                    />
                    <span>{delayDays === 1 ? "día" : "días"}</span>
                  </div>
                </label>
                <div className="admin-production-modal-actions">
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => setDialog(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--primary"
                    onClick={() =>
                      setDialog((current) =>
                        current ? { ...current, step: "confirm" } : current,
                      )
                    }
                  >
                    Continuar
                  </button>
                </div>
              </>
            ) : (
              <>
                <span>Confirmación</span>
                <h2 id="production-action-title">¿Estás seguro?</h2>
                <p>
                  {dialog.kind === "send"
                    ? delayDays === 0
                      ? `Se enviarán ahora ${dialog.itemIds.length} producto(s) a producción.`
                      : `Se programarán ${dialog.itemIds.length} producto(s) para ingresar a producción dentro de ${delayDays} días.`
                    : dialog.kind === "ready"
                      ? `Se marcarán ${dialog.itemIds.length} producto(s) como listos.`
                      : `Se marcarán ${dialog.itemIds.length} producto(s) como enviados.`}
                </p>
                <div className="admin-production-confirmation-note">
                  Esta acción actualizará también el estado general del pedido
                  cuando todos sus productos alcancen la etapa correspondiente.
                </div>
                <div className="admin-production-modal-actions">
                  <button
                    type="button"
                    className="admin-btn"
                    disabled={isMutating}
                    onClick={() =>
                      dialog.kind === "send"
                        ? setDialog({ ...dialog, step: "schedule" })
                        : setDialog(null)
                    }
                  >
                    {dialog.kind === "send" ? "Volver" : "Cancelar"}
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--primary"
                    disabled={isMutating}
                    onClick={confirmAction}
                  >
                    {isMutating ? "Guardando…" : "Sí, confirmar"}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      ) : null}
    </AdminPage>
  );
}
