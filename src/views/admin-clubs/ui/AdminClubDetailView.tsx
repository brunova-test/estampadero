"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { formatCents } from "elestampadero/shared/lib/money";
import {
  AdminPage,
  AdminPanel,
  AdminStat,
} from "elestampadero/shared/ui/admin";
import { ModernSpinner } from "elestampadero/shared/ui/motion";
import { api, type RouterOutputs } from "elestampadero/trpc/react";

import { ClubStoreManagementPanel } from "./ClubStoreManagementPanel";

type AgreementSummary = RouterOutputs["agreements"]["listByClub"][number];
type ClubProduct = RouterOutputs["catalog"]["list"][number];
type CommissionEntry = RouterOutputs["commissions"]["listByClub"][number];
type AgreementStatusAction = "ACTIVE" | "PAUSED" | "CANCELLED";
type ClubDetailPanel = "mobbex" | "access" | "summary" | "agreements" | "store";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  PAUSED: "Pausado",
  EXPIRED: "Vencido",
  CANCELLED: "Eliminado",
};

const MOBBEX_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Sin iniciar",
  REGISTRATION_PENDING: "Creando cuenta",
  DETAILS_SUBMITTED: "Datos recibidos",
  ACCESS_REQUESTED: "Esperando autorización",
  AUTHORIZATION_CONFIRMED: "Listo para verificar",
  ACTIVE: "Cobros activos",
};

export function AdminClubDetailView({ slug }: { slug: string }) {
  const utils = api.useUtils();
  const clubQuery = api.clubs.bySlug.useQuery({ slug });
  const club = clubQuery.data;
  const [payoutCbu, setPayoutCbu] = useState("");
  const [mobbexEntityId, setMobbexEntityId] = useState("");
  const [activeDetailPanel, setActiveDetailPanel] =
    useState<ClubDetailPanel>("store");
  const [isDetailPanelLoading, setIsDetailPanelLoading] = useState(false);
  const detailPanelTimer = useRef<number | null>(null);
  const [passwordResetOpen, setPasswordResetOpen] = useState(false);
  const [newAccessPassword, setNewAccessPassword] = useState<string | null>(
    null,
  );
  const [copiedAccessValue, setCopiedAccessValue] = useState<
    "email" | "password" | "mobbexInvite" | null
  >(null);
  const updatePayoutAccount = api.clubs.updatePayoutAccount.useMutation({
    onSuccess: () => utils.clubs.bySlug.invalidate({ slug }),
  });
  const updateMobbexEntity = api.clubs.updateMobbexEntity.useMutation({
    onSuccess: () => utils.clubs.bySlug.invalidate({ slug }),
  });
  const markMobbexAccessRequested =
    api.clubs.markMobbexAccessRequested.useMutation({
      onSuccess: () => utils.clubs.bySlug.invalidate({ slug }),
    });
  const activateMobbexOnboarding =
    api.clubs.activateMobbexOnboarding.useMutation({
      onSuccess: () => utils.clubs.bySlug.invalidate({ slug }),
    });
  const returnMobbexOnboardingForReview =
    api.clubs.returnMobbexOnboardingForReview.useMutation({
      onSuccess: () => utils.clubs.bySlug.invalidate({ slug }),
    });
  const accessAccountQuery = api.clubs.accessAccount.useQuery(
    { clubId: club?.id ?? "" },
    { enabled: !!club },
  );
  const regenerateAccessPassword =
    api.clubs.regenerateAccessPassword.useMutation({
      onSuccess: ({ password }) => setNewAccessPassword(password),
    });
  const agreementsQuery = api.agreements.listByClub.useQuery(
    { clubId: club?.id ?? "" },
    { enabled: !!club },
  );
  const productsQuery = api.catalog.list.useQuery(
    { clubSlug: slug, availableOnly: false },
    { enabled: !!club },
  );
  const balanceQuery = api.commissions.balance.useQuery(
    { clubId: club?.id ?? "" },
    { enabled: !!club },
  );
  const commissionsQuery = api.commissions.listByClub.useQuery(
    { clubId: club?.id ?? "" },
    { enabled: !!club },
  );
  const [editorAgreementId, setEditorAgreementId] = useState<
    string | null | undefined
  >(undefined);
  const [statusConfirmation, setStatusConfirmation] = useState<{
    agreement: AgreementSummary;
    status: AgreementStatusAction;
  } | null>(null);
  const [selectedMovement, setSelectedMovement] =
    useState<CommissionEntry | null>(null);

  useEffect(() => {
    if (club) {
      setPayoutCbu(club.payoutCbu ?? "");
      setMobbexEntityId(
        club.mobbexSubmittedEntityId ?? club.mobbexEntityId ?? "",
      );
    }
  }, [club]);

  useEffect(() => {
    return () => {
      if (detailPanelTimer.current !== null) {
        window.clearTimeout(detailPanelTimer.current);
      }
    };
  }, []);

  if (!club) {
    return (
      <div className="admin-empty">
        {clubQuery.isLoading ? "Cargando..." : "Club no encontrado."}
      </div>
    );
  }

  const balance = balanceQuery.data;
  const accessAccount = accessAccountQuery.data;

  async function copyAccessValue(value: string, target: "email" | "password") {
    await navigator.clipboard.writeText(value);
    setCopiedAccessValue(target);
    window.setTimeout(() => setCopiedAccessValue(null), 3000);
  }

  async function copyMobbexInvite() {
    if (!club) return;
    const portalUrl = `${window.location.origin}/club`;
    const message = `Hola. Para que ${club.name} reciba automáticamente su participación por las ventas de El Estampadero, ingresá al portal privado y abrí la sección Cobros: ${portalUrl}. Desde allí podrán completar la vinculación con Mobbex. Nunca les pediremos contraseñas, PIN, API Key ni Access Token.`;
    await navigator.clipboard.writeText(message);
    setCopiedAccessValue("mobbexInvite");
    window.setTimeout(() => setCopiedAccessValue(null), 1800);
  }

  function closePasswordReset() {
    setPasswordResetOpen(false);
    setNewAccessPassword(null);
    regenerateAccessPassword.reset();
  }

  function selectDetailPanel(panel: ClubDetailPanel) {
    if (panel === activeDetailPanel) return;

    if (detailPanelTimer.current !== null) {
      window.clearTimeout(detailPanelTimer.current);
    }
    setActiveDetailPanel(panel);
    setIsDetailPanelLoading(true);
    detailPanelTimer.current = window.setTimeout(() => {
      setIsDetailPanelLoading(false);
      detailPanelTimer.current = null;
    }, 180);
  }

  return (
    <AdminPage
      module="Módulo 8 · Convenios"
      title="Clubes y convenios"
      className="admin-club-detail-page"
      hideHeader
    >
      <header className="admin-club-detail-hero">
        <Link
          href="/admin/clubes"
          className="admin-club-back"
          aria-label="Volver a clubes"
          title="Volver a clubes"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
            <path d="M14 5 7 12l7 7M8 12h10" />
          </svg>
        </Link>
        <p className="admin-eyebrow">Módulo 8 · Convenios</p>
        <h1>Clubes y convenios</h1>
        <nav
          className="admin-club-detail-tabs"
          role="tablist"
          aria-label="Información del club"
        >
          <button
            id="admin-club-tab-summary"
            type="button"
            role="tab"
            aria-selected={activeDetailPanel === "summary"}
            aria-controls="admin-club-panel-summary"
            className={
              activeDetailPanel === "summary" ? "is-active" : undefined
            }
            onClick={() => selectDetailPanel("summary")}
          >
            <AdminDetailIcon name="chart" />
            Resumen del club
          </button>
          <button
            id="admin-club-tab-store"
            type="button"
            role="tab"
            aria-selected={activeDetailPanel === "store"}
            aria-controls="admin-club-panel-store"
            className={activeDetailPanel === "store" ? "is-active" : undefined}
            onClick={() => selectDetailPanel("store")}
          >
            <AdminDetailIcon name="store" />
            Tienda y QR
          </button>
          <button
            id="admin-club-tab-access"
            type="button"
            role="tab"
            aria-selected={activeDetailPanel === "access"}
            aria-controls="admin-club-panel-access"
            className={activeDetailPanel === "access" ? "is-active" : undefined}
            onClick={() => selectDetailPanel("access")}
          >
            <AdminDetailIcon name="lock" />
            Acceso del socio
          </button>
          <button
            id="admin-club-tab-agreements"
            type="button"
            role="tab"
            aria-selected={activeDetailPanel === "agreements"}
            aria-controls="admin-club-panel-agreements"
            className={
              activeDetailPanel === "agreements" ? "is-active" : undefined
            }
            onClick={() => selectDetailPanel("agreements")}
          >
            <AdminDetailIcon name="handshake" />
            Convenios
          </button>
          <button
            id="admin-club-tab-mobbex"
            type="button"
            role="tab"
            aria-selected={activeDetailPanel === "mobbex"}
            aria-controls="admin-club-panel-mobbex"
            className={activeDetailPanel === "mobbex" ? "is-active" : undefined}
            onClick={() => selectDetailPanel("mobbex")}
          >
            <AdminDetailIcon name="transfer" />
            Vinculación Mobbex
          </button>
        </nav>
      </header>
      <AdminPanel className="admin-panel-pad admin-club-detail-panel">
        <div className="admin-club-detail-layout">
          {isDetailPanelLoading ? (
            <div className="admin-club-detail-loading">
              <ModernSpinner label="Cargando sección…" />
            </div>
          ) : null}
          <div className="admin-club-profile-column">
            <section
              hidden={activeDetailPanel !== "summary" || isDetailPanelLoading}
              className="admin-club-card"
            >
              <span>
                <Image
                  src={club.logoUrl ?? "/images/linea-club.png"}
                  alt=""
                  fill
                  sizes="72px"
                />
              </span>
              <div>
                <h2>{club.name}</h2>
                <strong>
                  {club.isActive ? "Activo" : "Inactivo"} · desde 03/2025
                </strong>
              </div>
              <p className="admin-club-contact-data">
                <span>
                  <AdminDetailIcon name="user" /> Responsable: Jorge Medina
                </span>
                <span>
                  <AdminDetailIcon name="phone" /> Contacto: 000 000 0000
                </span>
                <span>
                  <AdminDetailIcon name="pin" /> Dirección: Rosario, Santa Fe
                </span>
                <span>
                  <AdminDetailIcon name="clock" /> Liquidación: transferencia
                  periódica
                </span>
              </p>
              <div className="admin-club-payout-account">
                <label htmlFor="admin-club-payout-cbu">CBU/CVU del club</label>
                <div>
                  <input
                    id="admin-club-payout-cbu"
                    className="admin-input"
                    inputMode="numeric"
                    pattern="[0-9]{22}"
                    maxLength={22}
                    value={payoutCbu}
                    onChange={(event) =>
                      setPayoutCbu(event.target.value.replace(/\D/g, ""))
                    }
                    placeholder="22 dígitos"
                  />
                  <button
                    type="button"
                    disabled={
                      payoutCbu.length !== 22 || updatePayoutAccount.isPending
                    }
                    onClick={() =>
                      updatePayoutAccount.mutate({
                        clubId: club.id,
                        payoutCbu,
                      })
                    }
                  >
                    {updatePayoutAccount.isPending ? "Guardando…" : "Guardar"}
                  </button>
                </div>
                {updatePayoutAccount.isSuccess ? (
                  <small>Cuenta de liquidación actualizada.</small>
                ) : null}
              </div>
            </section>
            <section
              id="admin-club-panel-mobbex"
              role="tabpanel"
              aria-labelledby="admin-club-tab-mobbex"
              hidden={activeDetailPanel !== "mobbex" || isDetailPanelLoading}
              className="admin-club-mobbex-card brand-card-cut border-mint border-t-4 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-blue font-mono text-[10px] font-black tracking-[.12em] uppercase">
                    Split de pagos
                  </span>
                  <h3 className="text-ink mt-1 text-lg font-black">
                    Vinculación Mobbex
                  </h3>
                </div>
                <span
                  className={`inline-flex min-h-11 min-w-28 items-center justify-center rounded-full px-3 py-1 text-center text-[11px] leading-tight font-bold ${
                    club.mobbexOnboardingStatus === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-800"
                      : club.mobbexOnboardingStatus ===
                          "AUTHORIZATION_CONFIRMED"
                        ? "bg-[#fff0bd] text-[#765500]"
                        : "text-deep bg-[#eee8f5]"
                  }`}
                >
                  {MOBBEX_STATUS_LABELS[club.mobbexOnboardingStatus]}
                </span>
              </div>

              <div className="admin-club-mobbex-card__details mt-4 grid gap-2 text-sm">
                {club.mobbexLegalName ? (
                  <p className="text-muted">
                    <strong className="text-ink">Razón social:</strong>{" "}
                    {club.mobbexLegalName}
                  </p>
                ) : null}
                {club.mobbexTaxId ? (
                  <p className="text-muted">
                    <strong className="text-ink">CUIT:</strong>{" "}
                    {formatAdminTaxId(club.mobbexTaxId)}
                  </p>
                ) : null}
                {club.mobbexContactName ? (
                  <p className="text-muted">
                    <strong className="text-ink">Responsable:</strong>{" "}
                    {club.mobbexContactName}
                  </p>
                ) : null}
                {club.mobbexContactEmail ? (
                  <p className="text-muted break-all">
                    <strong className="text-ink">Contacto:</strong>{" "}
                    {club.mobbexContactEmail}
                  </p>
                ) : null}
              </div>

              {club.mobbexOnboardingStatus === "DETAILS_SUBMITTED" ? (
                <div className="admin-club-mobbex-card__notice mt-5 rounded-xl bg-[#f5f2f8] p-4 text-sm">
                  <strong className="text-deep block">
                    Solicitá acceso a la cuenta del club
                  </strong>
                  <p className="text-muted mt-2 leading-5">
                    Usá la aplicación de El Estampadero en el Portal de
                    Desarrolladores. No necesitás contraseñas ni credenciales
                    del club.
                  </p>
                  <ol className="admin-club-mobbex-card__steps">
                    <li>
                      <span>
                        Abrí tu aplicación y elegí{" "}
                        <strong>Solicitar acceso</strong>.
                      </span>
                    </li>
                    <li>
                      <span>
                        Buscá al club con el CUIT{" "}
                        <strong>
                          {formatAdminTaxId(club.mobbexTaxId ?? "")}
                        </strong>
                        {" y enviá la solicitud."}
                      </span>
                    </li>
                    <li>
                      <span>
                        Confirmá abajo cuando la hayas enviado. El club recibirá
                        una solicitud para autorizar desde su consola Mobbex.
                      </span>
                    </li>
                  </ol>
                  <div className="admin-club-mobbex-card__actions">
                    <a
                      href="https://mobbex.com/devportal"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir Portal de Desarrolladores →
                    </a>
                    <button
                      type="button"
                      disabled={markMobbexAccessRequested.isPending}
                      onClick={() =>
                        markMobbexAccessRequested.mutate({ clubId: club.id })
                      }
                    >
                      {markMobbexAccessRequested.isPending
                        ? "Guardando…"
                        : "Confirmar solicitud enviada"}
                    </button>
                  </div>
                </div>
              ) : null}

              {club.mobbexOnboardingStatus === "ACCESS_REQUESTED" ? (
                <div className="admin-club-mobbex-card__waiting border-blue/15 bg-blue/5 mt-5 rounded-xl border p-5 text-sm">
                  <strong className="text-deep block">
                    La solicitud ya fue enviada
                  </strong>
                  <p className="text-muted mt-2 leading-6">
                    Ahora el siguiente paso depende del club. Enviále la
                    invitación de abajo si todavía no conoce el proceso.
                  </p>
                  <ol className="admin-club-mobbex-card__steps">
                    <li>
                      <span>
                        El club ingresa a su consola Mobbex con sus propias
                        credenciales.
                      </span>
                    </li>
                    <li>
                      <span>
                        En <strong>APP/E-Commerce</strong>, abre la solicitud de
                        El Estampadero y la autoriza.
                      </span>
                    </li>
                    <li>
                      <span>
                        Desde su portal privado, presiona{" "}
                        <strong>“Ya autoricé el acceso”</strong>.
                      </span>
                    </li>
                  </ol>
                  <div className="admin-club-mobbex-card__next-step">
                    <strong>Qué sucede después</strong>
                    <p>
                      Cuando el club confirme, el estado pasará a{" "}
                      <strong>“Listo para verificar”</strong>. Actualizá esta
                      pantalla, verificá el UID de la entidad y activá los
                      cobros con split.
                    </p>
                    <button
                      type="button"
                      disabled={clubQuery.isFetching}
                      onClick={() => void clubQuery.refetch()}
                    >
                      {clubQuery.isFetching
                        ? "Actualizando…"
                        : "Actualizar estado"}
                    </button>
                  </div>
                </div>
              ) : null}

              {club.mobbexOnboardingStatus === "AUTHORIZATION_CONFIRMED" ? (
                <div className="admin-club-mobbex-card__activation border-mint bg-mint/10 mt-5 rounded-xl border p-5">
                  <p className="text-muted mb-4 text-sm leading-5">
                    El club confirmó la autorización. Antes de activar, revisá
                    que el UID pertenezca a este club en Mobbex.
                  </p>
                  <div className="admin-club-mobbex-card__verification-guide">
                    <strong>Qué tenés que comprobar</strong>
                    <ul>
                      <li>
                        Que el UID corresponda a la entidad autorizada para{" "}
                        <strong>{club.mobbexLegalName ?? club.name}</strong>.
                      </li>
                      <li>
                        Que el CUIT de esa entidad coincida con{" "}
                        <strong>
                          {formatAdminTaxId(club.mobbexTaxId ?? "")}
                        </strong>
                        .
                      </li>
                      <li>
                        Que sea el <strong>ID de entidad</strong>, no una API
                        Key, Access Token ni el UID de un pago.
                      </li>
                    </ul>
                    <p>
                      Al guardar, este UID se usará como <code>entity</code> en
                      los splits del checkout. La activación registra el UID en
                      El Estampadero; no realiza una consulta automática a
                      Mobbex.
                    </p>
                  </div>
                  <label
                    htmlFor="admin-club-mobbex-entity"
                    className="text-deep text-sm font-bold"
                  >
                    UID de entidad Mobbex
                  </label>
                  <input
                    id="admin-club-mobbex-entity"
                    className="admin-input mt-2 w-full"
                    value={mobbexEntityId}
                    onChange={(event) => setMobbexEntityId(event.target.value)}
                    placeholder="UID asignado por Mobbex"
                    maxLength={120}
                  />
                  <button
                    type="button"
                    disabled={
                      mobbexEntityId.trim().length < 2 ||
                      activateMobbexOnboarding.isPending
                    }
                    onClick={() =>
                      activateMobbexOnboarding.mutate({
                        clubId: club.id,
                        entityId: mobbexEntityId.trim(),
                      })
                    }
                    className="brand-cut bg-deep mt-4 px-5 py-3 font-bold text-white disabled:opacity-50"
                  >
                    {activateMobbexOnboarding.isPending
                      ? "Activando…"
                      : "Guardar UID y activar cobros"}
                  </button>
                </div>
              ) : null}

              {club.mobbexOnboardingStatus === "ACTIVE" ? (
                <div className="admin-club-mobbex-card__active-entity mt-5">
                  <label
                    htmlFor="admin-club-mobbex-entity"
                    className="text-ink text-sm font-bold"
                  >
                    UID de entidad activo
                  </label>
                  <div className="admin-club-mobbex-card__active-entity-actions mt-2 flex gap-2">
                    <input
                      id="admin-club-mobbex-entity"
                      className="admin-input min-w-0 flex-1"
                      value={mobbexEntityId}
                      onChange={(event) =>
                        setMobbexEntityId(event.target.value)
                      }
                      maxLength={120}
                    />
                    <button
                      type="button"
                      disabled={
                        mobbexEntityId.trim().length < 2 ||
                        updateMobbexEntity.isPending
                      }
                      onClick={() =>
                        updateMobbexEntity.mutate({
                          clubId: club.id,
                          mobbexEntityId: mobbexEntityId.trim(),
                        })
                      }
                      className="bg-deep rounded-lg px-4 font-bold text-white disabled:opacity-50"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              ) : null}

              {["ACCESS_REQUESTED", "AUTHORIZATION_CONFIRMED"].includes(
                club.mobbexOnboardingStatus,
              ) ? (
                <button
                  type="button"
                  disabled={returnMobbexOnboardingForReview.isPending}
                  onClick={() =>
                    returnMobbexOnboardingForReview.mutate({ clubId: club.id })
                  }
                  className="admin-club-mobbex-card__review"
                >
                  Devolver para revisar datos
                </button>
              ) : null}

              {club.mobbexOnboardingStatus !== "ACTIVE" ? (
                <button
                  type="button"
                  onClick={() => void copyMobbexInvite()}
                  className="admin-club-mobbex-card__invite border-deep/15 text-deep mt-4 flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-colors duration-200 hover:border-[#9b7edb] hover:bg-[#eee8fa]"
                >
                  <AdminDetailIcon name="copy" />
                  {copiedAccessValue === "mobbexInvite"
                    ? "Mensaje copiado"
                    : "Copiar invitación para el club"}
                </button>
              ) : null}

              {markMobbexAccessRequested.error ||
              activateMobbexOnboarding.error ||
              returnMobbexOnboardingForReview.error ||
              updateMobbexEntity.error ? (
                <p className="mt-3 text-xs font-semibold text-red-600">
                  {
                    (
                      markMobbexAccessRequested.error ??
                      activateMobbexOnboarding.error ??
                      returnMobbexOnboardingForReview.error ??
                      updateMobbexEntity.error
                    )?.message
                  }
                </p>
              ) : null}
            </section>
            <section
              id="admin-club-panel-access"
              role="tabpanel"
              aria-labelledby="admin-club-tab-access"
              hidden={activeDetailPanel !== "access" || isDetailPanelLoading}
              className="admin-club-access-card"
            >
              <div className="admin-club-access-card__heading">
                <span className="admin-section-icon">
                  <AdminDetailIcon name="lock" />
                </span>
                <div>
                  <h3>Acceso del socio</h3>
                  <p>Datos para ingresar al portal.</p>
                </div>
              </div>

              {accessAccountQuery.isLoading ? (
                <p className="admin-club-access-card__loading">
                  Cargando acceso…
                </p>
              ) : accessAccount?.email ? (
                <>
                  <div className="admin-club-access-field">
                    <span>Correo de acceso</span>
                    <div>
                      <AdminDetailIcon name="mail" />
                      <code>{accessAccount.email}</code>
                      <button
                        type="button"
                        onClick={() =>
                          void copyAccessValue(accessAccount.email!, "email")
                        }
                      >
                        <AdminDetailIcon
                          name={
                            copiedAccessValue === "email" ? "check" : "copy"
                          }
                        />
                        {copiedAccessValue === "email" ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                  </div>
                  <div className="admin-club-access-password">
                    <div>
                      <strong>Contraseña protegida</strong>
                      <p>
                        No se puede consultar. Si el socio la pierde, generá una
                        nueva.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPasswordResetOpen(true)}
                    >
                      <AdminDetailIcon name="key" />
                      Regenerar contraseña
                    </button>
                  </div>
                </>
              ) : (
                <p className="admin-club-access-card__empty">
                  No se encontró una cuenta administradora para este socio.
                </p>
              )}
            </section>
            <section
              id="admin-club-panel-summary"
              role="tabpanel"
              aria-labelledby="admin-club-tab-summary"
              hidden={activeDetailPanel !== "summary" || isDetailPanelLoading}
              className="admin-club-summary"
            >
              <h3 className="admin-section-heading">
                <span className="admin-section-icon">
                  <AdminDetailIcon name="chart" />
                </span>
                Resumen del club
              </h3>
              <dl>
                <div>
                  <dt>Productos relacionados</dt>
                  <dd>{club.productCount}</dd>
                </div>
                <div>
                  <dt>Ventas acumuladas</dt>
                  <dd>{balance ? formatCents(balance.salesInCents) : "—"}</dd>
                </div>
                <div>
                  <dt>Participación liquidada</dt>
                  <dd>{balance ? formatCents(balance.settledInCents) : "—"}</dd>
                </div>
              </dl>
            </section>
            <div
              id="admin-club-panel-store"
              role="tabpanel"
              aria-labelledby="admin-club-tab-store"
              hidden={activeDetailPanel !== "store" || isDetailPanelLoading}
            >
              <ClubStoreManagementPanel club={club} />
            </div>
          </div>

          <section
            id="admin-club-panel-agreements"
            role="tabpanel"
            aria-labelledby="admin-club-tab-agreements"
            hidden={activeDetailPanel !== "agreements" || isDetailPanelLoading}
            className="admin-club-agreements-section"
          >
            <div className="admin-toolbar admin-agreements-toolbar">
              <div>
                <h2 className="admin-panel-title admin-section-heading">
                  <span className="admin-section-icon">
                    <AdminDetailIcon name="handshake" />
                  </span>
                  Convenios
                </h2>
                <p>Administrá las condiciones vigentes y su trazabilidad.</p>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                onClick={() => setEditorAgreementId(null)}
              >
                <span
                  aria-hidden="true"
                  className="text-2xl leading-none font-semibold"
                >
                  +
                </span>
                Cargar convenio
              </button>
            </div>

            <div className="admin-agreements">
              {agreementsQuery.data?.map((agreement) => (
                <AgreementCard
                  key={agreement.id}
                  agreement={agreement}
                  slug={slug}
                  productCount={club.productCount}
                  onEdit={() => setEditorAgreementId(agreement.id)}
                  onStatusChange={(status) =>
                    setStatusConfirmation({ agreement, status })
                  }
                />
              ))}
            </div>

            <article className="admin-movements">
              <div className="admin-movements-header">
                <h3 className="admin-section-heading">
                  <span className="admin-section-icon">
                    <AdminDetailIcon name="clock" />
                  </span>
                  Movimientos recientes
                </h3>
                <Link href={`/admin/clubes/${slug}/participacion`}>
                  Ver todos los movimientos <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="admin-movements-list">
                {commissionsQuery.data?.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="admin-movement-row"
                    onClick={() => setSelectedMovement(item)}
                  >
                    <span>
                      {new Date(item.createdAt).toLocaleDateString("es-AR")} ·
                      Venta #{String(item.orderNumber).padStart(6, "0")}
                    </span>
                    <strong>
                      {item.amountInCents >= 0 ? "+" : ""}
                      {formatCents(item.amountInCents)}
                    </strong>
                  </button>
                ))}
              </div>
            </article>
          </section>
        </div>
      </AdminPanel>

      {editorAgreementId !== undefined ? (
        <AgreementEditorModal
          clubId={club.id}
          agreementId={editorAgreementId}
          products={productsQuery.data ?? []}
          onClose={() => setEditorAgreementId(undefined)}
        />
      ) : null}

      {statusConfirmation ? (
        <AgreementStatusConfirmation
          clubId={club.id}
          agreement={statusConfirmation.agreement}
          status={statusConfirmation.status}
          onClose={() => setStatusConfirmation(null)}
        />
      ) : null}

      {selectedMovement ? (
        <MovementDetailModal
          movement={selectedMovement}
          onClose={() => setSelectedMovement(null)}
        />
      ) : null}

      {passwordResetOpen && accessAccount?.email ? (
        <ClubPasswordResetModal
          email={accessAccount.email}
          password={newAccessPassword}
          isPending={regenerateAccessPassword.isPending}
          error={regenerateAccessPassword.error?.message ?? null}
          copiedEmail={copiedAccessValue === "email"}
          copiedPassword={copiedAccessValue === "password"}
          onConfirm={() => regenerateAccessPassword.mutate({ clubId: club.id })}
          onCopy={(value, target) => void copyAccessValue(value, target)}
          onClose={closePasswordReset}
        />
      ) : null}
    </AdminPage>
  );
}

function ClubPasswordResetModal({
  email,
  password,
  isPending,
  error,
  copiedEmail,
  copiedPassword,
  onConfirm,
  onCopy,
  onClose,
}: {
  email: string;
  password: string | null;
  isPending: boolean;
  error: string | null;
  copiedEmail: boolean;
  copiedPassword: boolean;
  onConfirm: () => void;
  onCopy: (value: string, target: "email" | "password") => void;
  onClose: () => void;
}) {
  return (
    <div
      className="admin-agreement-confirm-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isPending) onClose();
      }}
    >
      <section
        className="admin-club-password-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="club-password-reset-title"
      >
        <span className="admin-club-password-modal__icon">
          <AdminDetailIcon name="key" />
        </span>
        <div>
          <span>Acceso del socio</span>
          <h2 id="club-password-reset-title">
            {password ? "Nueva contraseña generada" : "Regenerar contraseña"}
          </h2>
        </div>

        {password ? (
          <>
            <p>
              Copiala y envíasela al socio ahora. Por seguridad, no volverá a
              mostrarse cuando cierres esta ventana.
            </p>
            <div className="admin-club-password-result">
              <span>Correo de acceso</span>
              <div>
                <code>{email}</code>
                <button type="button" onClick={() => onCopy(email, "email")}>
                  <AdminDetailIcon name={copiedEmail ? "check" : "copy"} />
                  {copiedEmail ? "Copiado" : "Copiar"}
                </button>
              </div>
              <span>Nueva contraseña</span>
              <div>
                <code>{password}</code>
                <button type="button" onClick={() => onCopy(password, "password")}>
                  <AdminDetailIcon name={copiedPassword ? "check" : "copy"} />
                  {copiedPassword ? "Copiada" : "Copiar"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <p>
            La contraseña anterior dejará de funcionar y se cerrarán las
            sesiones abiertas del socio. La nueva clave se mostrará una sola
            vez.
          </p>
        )}

        {error ? (
          <p className="admin-form-error" role="alert">
            {error}
          </p>
        ) : null}

        <footer>
          {password ? (
            <button type="button" className="admin-btn" onClick={onClose}>
              Listo, cerrar
            </button>
          ) : (
            <>
              <button
                type="button"
                className="admin-btn"
                disabled={isPending}
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                disabled={isPending}
                onClick={onConfirm}
              >
                {isPending ? "Regenerando…" : "Sí, generar nueva"}
              </button>
            </>
          )}
        </footer>
      </section>
    </div>
  );
}

function MovementDetailModal({
  movement,
  onClose,
}: {
  movement: CommissionEntry;
  onClose: () => void;
}) {
  return (
    <div
      className="admin-agreement-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="admin-agreement-modal admin-movement-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="movement-detail-title"
      >
        <header>
          <div>
            <span>Detalle de venta</span>
            <h2 id="movement-detail-title">
              Venta #{String(movement.orderNumber).padStart(6, "0")}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </header>
        <div className="admin-agreement-modal__body admin-movement-modal__body">
          <div className="admin-movement-product">
            <span className="admin-movement-product__image" aria-hidden="true">
              <Image src="/images/linea-club.png" alt="" fill sizes="64px" />
            </span>
            <div>
              <span>Producto vendido</span>
              <strong>{movement.productName}</strong>
            </div>
          </div>
          <dl className="admin-movement-details">
            <div>
              <dt>Fecha</dt>
              <dd>
                {new Date(movement.createdAt).toLocaleDateString("es-AR")}
              </dd>
            </div>
            <div>
              <dt>Porcentaje aplicado</dt>
              <dd>{movement.percentageApplied}%</dd>
            </div>
            <div>
              <dt>Participación</dt>
              <dd>{formatCents(movement.amountInCents)}</dd>
            </div>
          </dl>
        </div>
        <footer>
          <button type="button" className="admin-btn" onClick={onClose}>
            Cerrar
          </button>
        </footer>
      </section>
    </div>
  );
}

type AdminDetailIconName =
  | "calendar"
  | "chart"
  | "clock"
  | "document"
  | "edit"
  | "handshake"
  | "history"
  | "copy"
  | "check"
  | "key"
  | "lock"
  | "mail"
  | "package"
  | "phone"
  | "pin"
  | "pause"
  | "percent"
  | "transfer"
  | "store"
  | "trash"
  | "user";

function AdminDetailIcon({ name }: { name: AdminDetailIconName }) {
  const paths: Record<AdminDetailIconName, ReactNode> = {
    calendar: (
      <path d="M5 4v3m14-3v3M4 9h16M6 3h12a1 1 0 0 1 1 1v16H5V4a1 1 0 0 1 1-1Z" />
    ),
    chart: <path d="M5 19V9m5 10V5m5 14v-7m5 7V3" />,
    clock: <path d="M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
    document: <path d="M7 3h7l4 4v14H7V3Zm7 0v5h4M9 12h6m-6 4h6" />,
    edit: <path d="m4 16-.8 4.8L8 20l11-11-4-4L4 16Zm8-8 4 4" />,
    handshake: (
      <>
        <path d="m3.5 11.5 3.2-3.2 4.2 2 2.1-2.1 7.5 4.2-3.4 4.8-4.1-2.1-2.1 2.1-7.4-4.1Z" />
        <path d="m6.7 8.3 2.2-2.4 4.1 2.1m3 3.1 1.8 1.7a1.5 1.5 0 0 1-2.1 2.1L13.6 13m.4 4.1 1.1 1.1a1.5 1.5 0 0 1-2.1 2.1l-2.1-2.1" />
      </>
    ),
    history: <path d="M4 12a8 8 0 1 0 2-5m-2-4v5h5m5-1v5l3 2" />,
    copy: <path d="M8 8h11v11H8V8Zm-3 8H4V4h12v1" />,
    check: <path d="m5 12 4 4L19 6" />,
    key: (
      <>
        <circle cx="7.5" cy="15.5" r="4.5" />
        <path d="m10.7 12.3 8.8-8.8M16 7l2 2m-4.5 1.5 2 2" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
        <circle cx="12" cy="15" r="1" />
      </>
    ),
    mail: <path d="M3 5h18v14H3V5Zm0 1 9 7 9-7" />,
    package: <path d="m4 7 8-4 8 4-8 4-8-4Zm0 0v10l8 4 8-4V7m-8 4v10" />,
    phone: (
      <path d="M7 4h3l1 4-2 1a12 12 0 0 0 6 6l1-2 4 1v3c0 1-1 2-2 2C11 19 5 13 5 6c0-1 1-2 2-2Z" />
    ),
    pin: (
      <path d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Zm-4 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    ),
    pause: <path d="M8 5v14m8-14v14" />,
    percent: <path d="m6 18 12-12M7 7h.01M17 17h.01" />,
    transfer: <path d="M5 8h14m-4-3 4 3-4 3M19 16H5m4-3-4 3 4 3" />,
    store: (
      <>
        <path d="M4 10h16l-1.5-6h-13L4 10Zm1 0v10h14V10" />
        <path d="M8 20v-6h4v6m-8-10c0 2 3 2 4 0 1 2 3 2 4 0 1 2 3 2 4 0 1 2 4 2 4 0" />
      </>
    ),
    trash: (
      <path d="M5 7h14m-9-3h4l1 3H9l1-3Zm-4 3 1 13h10l1-13M10 11v8m4-8v8" />
    ),
    user: <path d="M19 20a7 7 0 0 0-14 0m10-11a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />,
  };

  return (
    <svg
      className="admin-detail-icon"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function formatAdminTaxId(value: string) {
  if (value.length !== 11) return value;
  return `${value.slice(0, 2)}-${value.slice(2, 10)}-${value.slice(10)}`;
}

function AgreementCard({
  agreement,
  slug,
  productCount,
  onEdit,
  onStatusChange,
}: {
  agreement: AgreementSummary;
  slug: string;
  productCount: number;
  onEdit: () => void;
  onStatusChange: (status: AgreementStatusAction) => void;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const statusClass =
    agreement.status === "ACTIVE"
      ? "admin-chip--success"
      : agreement.status === "CANCELLED"
        ? "admin-chip--danger"
        : "admin-chip--warning";

  return (
    <article className="admin-agreement">
      <div className="admin-toolbar">
        <h3>
          {agreement.code} · {agreement.title}
        </h3>
        <span className={`admin-chip ${statusClass}`}>
          {STATUS_LABELS[agreement.status] ?? agreement.status}
        </span>
      </div>
      <div className="admin-agreement-data">
        <div>
          <span>
            <AdminDetailIcon name="calendar" /> Inicio
          </span>
          <strong>
            {new Date(agreement.startDate).toLocaleDateString("es-AR")}
          </strong>
        </div>
        <div>
          <span>
            <AdminDetailIcon name="calendar" /> Vence
          </span>
          <strong>
            {new Date(agreement.endDate).toLocaleDateString("es-AR")}
          </strong>
        </div>
        <div>
          <span>
            <AdminDetailIcon name="percent" /> Porcentaje base
          </span>
          <strong>{agreement.basePercentage}% · ajustable por producto</strong>
        </div>
        <div>
          <span>
            <AdminDetailIcon name="transfer" /> Modalidad
          </span>
          <strong>
            {agreement.settlementMethod === "TRANSFER"
              ? "Transferencia"
              : "Split de pagos"}
          </strong>
        </div>
        <div>
          <span>
            <AdminDetailIcon name="calendar" /> Frecuencia de cierre
          </span>
          <strong>
            {agreement.settlementFrequency === "BIWEEKLY"
              ? "Quincenal"
              : "Mensual"}
          </strong>
        </div>
      </div>

      <div className="admin-agreement-links">
        {agreement.contractUrl ? (
          <a
            className="admin-agreement-link--contract"
            href={agreement.contractUrl}
            target="_blank"
            rel="noreferrer"
          >
            <AdminDetailIcon name="document" /> contrato-{agreement.code}.pdf
          </a>
        ) : null}
        <Link
          className="admin-agreement-link--products"
          href={`/admin/clubes/${slug}/participacion`}
        >
          <AdminDetailIcon name="package" /> Ver productos ({productCount})
        </Link>
        <Link
          className="admin-agreement-link--sales"
          href="/admin/liquidaciones"
        >
          <AdminDetailIcon name="chart" /> Ver ventas
        </Link>
      </div>

      <div className="admin-agreement-actions">
        <button
          type="button"
          className="admin-agreement-action--edit"
          onClick={onEdit}
        >
          <AdminDetailIcon name="edit" /> Editar
        </button>
        {agreement.status !== "CANCELLED" ? (
          <button
            type="button"
            className="admin-agreement-action--pause"
            onClick={() =>
              onStatusChange(
                agreement.status === "PAUSED" ? "ACTIVE" : "PAUSED",
              )
            }
          >
            <AdminDetailIcon name="pause" />
            {agreement.status === "PAUSED" ? "Reactivar" : "Pausar"}
          </button>
        ) : null}
        {agreement.status !== "CANCELLED" ? (
          <button
            type="button"
            className="is-danger admin-agreement-action--delete"
            onClick={() => onStatusChange("CANCELLED")}
          >
            <AdminDetailIcon name="trash" /> Eliminar
          </button>
        ) : null}
        <button
          type="button"
          className="admin-agreement-action--history"
          onClick={() => setShowHistory((value) => !value)}
        >
          <AdminDetailIcon name="history" />
          {showHistory ? "Ocultar historial" : "Ver historial"}
        </button>
      </div>

      {showHistory ? <AgreementHistory agreementId={agreement.id} /> : null}
    </article>
  );
}

function AgreementHistory({ agreementId }: { agreementId: string }) {
  const query = api.agreements.byId.useQuery({ id: agreementId });
  return (
    <section className="admin-agreement-history">
      <h4>Historial de cambios</h4>
      {query.isLoading ? (
        <ModernSpinner label="Cargando..." />
      ) : query.data?.changes.length ? (
        query.data.changes.map((change) => (
          <div key={change.id}>
            <span>{change.summary}</span>
            <time dateTime={change.createdAt}>
              {new Date(change.createdAt).toLocaleString("es-AR")}
            </time>
          </div>
        ))
      ) : (
        <p>No hay cambios registrados todavía.</p>
      )}
    </section>
  );
}

function AgreementEditorModal({
  clubId,
  agreementId,
  products,
  onClose,
}: {
  clubId: string;
  agreementId: string | null;
  products: ClubProduct[];
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const utils = api.useUtils();
  const detailQuery = api.agreements.byId.useQuery(
    { id: agreementId ?? "" },
    { enabled: !!agreementId },
  );
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [basePercentage, setBasePercentage] = useState("10");
  const [settlementMethod, setSettlementMethod] = useState<
    "TRANSFER" | "SPLIT_MP"
  >("TRANSFER");
  const [settlementFrequency] = useState<"AUTOMATIC">("AUTOMATIC");
  const [contractUrl, setContractUrl] = useState("");
  const [productRates, setProductRates] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const detail = detailQuery.data;
    if (!detail) return;
    setCode(detail.code);
    setTitle(detail.title);
    setStartDate(detail.startDate.slice(0, 10));
    setEndDate(detail.endDate.slice(0, 10));
    setBasePercentage(String(detail.basePercentage));
    setSettlementMethod(
      detail.settlementMethod === "SPLIT_MP" ? "SPLIT_MP" : "TRANSFER",
    );
    setContractUrl(detail.contractUrl ?? "");
    setProductRates(
      Object.fromEntries(
        detail.productRates.map((rate) => [
          rate.productId,
          String(rate.percentage),
        ]),
      ),
    );
  }, [detailQuery.data]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const invalidate = async () => {
    await Promise.all([
      utils.agreements.listByClub.invalidate({ clubId }),
      agreementId
        ? utils.agreements.byId.invalidate({ id: agreementId })
        : Promise.resolve(),
    ]);
    onClose();
  };
  const create = api.agreements.create.useMutation({
    onSuccess: invalidate,
    onError: (mutationError) => {
      setConfirming(false);
      setError(mutationError.message);
    },
  });
  const update = api.agreements.update.useMutation({
    onSuccess: invalidate,
    onError: (mutationError) => {
      setConfirming(false);
      setError(mutationError.message);
    },
  });
  const isSaving = create.isPending || update.isPending;

  const payload = {
    code: code.trim(),
    title: title.trim(),
    startDate: new Date(`${startDate}T12:00:00`),
    endDate: new Date(`${endDate}T12:00:00`),
    basePercentage: Number(basePercentage),
    settlementMethod,
    settlementFrequency,
    contractUrl: contractUrl.trim() || undefined,
    productRates: Object.entries(productRates)
      .filter(([, percentage]) => percentage !== "")
      .map(([productId, percentage]) => ({
        productId,
        percentage: Number(percentage),
      })),
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setConfirming(true);
  };

  const save = () => {
    if (agreementId) update.mutate({ id: agreementId, ...payload });
    else create.mutate({ clubId, ...payload });
  };

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="admin-agreement-modal-backdrop">
      <section
        className="admin-agreement-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agreement-editor-title"
      >
        <header>
          <div>
            <span>Gestión de convenios</span>
            <h2 id="agreement-editor-title">
              {agreementId ? "Editar convenio" : "Cargar nuevo convenio"}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <CloseIcon />
          </button>
        </header>

        {detailQuery.isLoading ? (
          <div className="admin-agreement-modal__loading">
            <ModernSpinner label="Cargando..." />
          </div>
        ) : confirming ? (
          <div className="admin-agreement-warning">
            <span aria-hidden="true">!</span>
            <h3>Este cambio impactará en el sistema</h3>
            <p>
              Los nuevos porcentajes se aplicarán a las operaciones futuras. Las
              ventas y liquidaciones anteriores conservarán sus valores
              originales.
            </p>
            <div>
              <button type="button" onClick={() => setConfirming(false)}>
                Revisar datos
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                disabled={isSaving}
                onClick={save}
              >
                {isSaving ? "Guardando…" : "Sí, confirmar cambio"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="admin-agreement-form">
            <div className="admin-agreement-form__grid">
              <label>
                Código
                <input
                  className="admin-input"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  required
                  minLength={3}
                  maxLength={40}
                />
              </label>
              <label>
                Nombre del convenio
                <input
                  className="admin-input"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  minLength={3}
                  maxLength={160}
                />
              </label>
              <label>
                Fecha de inicio
                <input
                  className="admin-input"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  required
                />
              </label>
              <label>
                Fecha de vencimiento
                <input
                  className="admin-input"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  required
                />
              </label>
              <label>
                Porcentaje base
                <input
                  className="admin-input"
                  type="number"
                  min="0"
                  max="100"
                  value={basePercentage}
                  onChange={(event) => setBasePercentage(event.target.value)}
                  required
                />
              </label>
              <label>
                Método de liquidación
                <select
                  className="admin-select"
                  value={settlementMethod}
                  onChange={(event) =>
                    setSettlementMethod(
                      event.target.value as "TRANSFER" | "SPLIT_MP",
                    )
                  }
                >
                  <option value="TRANSFER">Transferencia</option>
                  <option value="SPLIT_MP" disabled>
                    Split de pagos (no disponible)
                  </option>
                </select>
              </label>
              <div className="admin-form-note is-wide">
                Liquidación automática por transacción mediante Mobbex. El
                porcentaje configurado se aplica al confirmar la comisión.
              </div>
              <label className="is-wide">
                URL del contrato
                <input
                  className="admin-input"
                  type="url"
                  value={contractUrl}
                  onChange={(event) => setContractUrl(event.target.value)}
                  placeholder="https://…"
                />
              </label>
            </div>

            <section className="admin-agreement-products">
              <div>
                <h3>Indumentaria y porcentajes</h3>
                <p>
                  Marcá los productos con un porcentaje propio. Los demás usarán
                  el porcentaje base.
                </p>
              </div>
              <div className="admin-agreement-products__list">
                {products.map((product) => {
                  const selected = product.id in productRates;
                  return (
                    <label key={product.id}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(event) =>
                          setProductRates((current) => {
                            const next = { ...current };
                            if (event.target.checked) {
                              next[product.id] = basePercentage;
                            } else {
                              delete next[product.id];
                            }
                            return next;
                          })
                        }
                      />
                      <span>{product.name}</span>
                      <input
                        className="admin-input"
                        type="number"
                        min="0"
                        max="100"
                        aria-label={`Porcentaje de ${product.name}`}
                        value={productRates[product.id] ?? ""}
                        disabled={!selected}
                        onChange={(event) =>
                          setProductRates((current) => ({
                            ...current,
                            [product.id]: event.target.value,
                          }))
                        }
                      />
                      <small>%</small>
                    </label>
                  );
                })}
              </div>
            </section>

            {error ? <p className="admin-form-error">{error}</p> : null}
            <footer>
              <button type="button" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="admin-btn admin-btn--primary">
                {agreementId ? "Guardar cambios" : "Cargar convenio"}
              </button>
            </footer>
          </form>
        )}
      </section>
    </div>,
    document.body,
  );
}

function AgreementStatusConfirmation({
  clubId,
  agreement,
  status,
  onClose,
}: {
  clubId: string;
  agreement: AgreementSummary;
  status: AgreementStatusAction;
  onClose: () => void;
}) {
  const utils = api.useUtils();
  const mutation = api.agreements.changeStatus.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.agreements.listByClub.invalidate({ clubId }),
        utils.agreements.byId.invalidate({ id: agreement.id }),
      ]);
      onClose();
    },
  });
  const action =
    status === "PAUSED"
      ? "pausar"
      : status === "ACTIVE"
        ? "reactivar"
        : "eliminar";

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="admin-agreement-confirm-backdrop">
      <section
        role="alertdialog"
        aria-modal="true"
        className="admin-agreement-confirm"
      >
        <span aria-hidden="true">!</span>
        <h2>¿Seguro que querés {action} este convenio?</h2>
        <p>
          Esta acción modificará la operatoria de{" "}
          <strong>{agreement.code}</strong>. El cambio quedará registrado en el
          historial administrativo.
        </p>
        {status === "CANCELLED" ? (
          <small>
            El convenio dejará de utilizarse, pero sus ventas, comisiones e
            historial no serán eliminados.
          </small>
        ) : null}
        <div>
          <button type="button" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className={status === "CANCELLED" ? "is-danger" : "is-primary"}
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ id: agreement.id, status })}
          >
            {mutation.isPending ? "Aplicando…" : `Sí, ${action}`}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 4h11l3 3v13H5V4Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path
        d="M8 4v6h8V4M8.5 20v-6h7v6"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AdminClubParticipationView({ slug }: { slug: string }) {
  const clubQuery = api.clubs.bySlug.useQuery({ slug });
  const club = clubQuery.data;
  const agreements = api.agreements.listByClub.useQuery(
    { clubId: club?.id ?? "" },
    { enabled: !!club },
  );
  const active =
    agreements.data?.find((item) => item.status === "ACTIVE") ??
    agreements.data?.[0];
  const detail = api.agreements.byId.useQuery(
    { id: active?.id ?? "" },
    { enabled: !!active },
  );
  const products = api.catalog.list.useQuery(
    { clubSlug: slug, availableOnly: false },
    { enabled: !!club },
  );
  const [page, setPage] = useState(1);
  const productsPerPage = 10;
  const totalPages = Math.max(
    1,
    Math.ceil((products.data?.length ?? 0) / productsPerPage),
  );
  const visibleProducts = products.data?.slice(
    (page - 1) * productsPerPage,
    page * productsPerPage,
  );
  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);
  const balance = api.commissions.balance.useQuery(
    { clubId: club?.id ?? "" },
    { enabled: !!club },
  );
  const utils = api.useUtils();
  const [pendingRateChange, setPendingRateChange] = useState<{
    productId: string;
    productName: string;
    percentage: number;
  } | null>(null);
  const setRate = api.agreements.setProductRate.useMutation({
    onSuccess: async () => {
      if (active) await utils.agreements.byId.invalidate({ id: active.id });
      setPendingRateChange(null);
    },
  });
  if (!club || !active) return <div className="admin-empty">Cargando...</div>;
  return (
    <AdminPage
      module="Módulo de Participaciones"
      title="Participación por producto"
      className="admin-participation-page"
      hideHeader
    >
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Módulo de Participaciones</p>
          <h1 className="admin-page-title">Participación por producto</h1>
        </div>
      </header>
      <Link
        href={`/admin/clubes/${slug}`}
        className="admin-club-back admin-participation-back"
      >
        Volver a convenio
      </Link>
      <AdminPanel className="admin-panel-pad">
        <div className="admin-toolbar">
          <h2 className="admin-panel-title">
            {club.name} · {active.code}
          </h2>
          <div className="admin-participation-actions">
            <button type="button" className="admin-btn">
              Aplicar base a todos
            </button>
            <button type="button" className="admin-btn admin-btn--primary">
              Guardar cambios
            </button>
          </div>
        </div>
        <div className="admin-stats admin-participation-stats">
          <AdminStat
            label="Porcentaje base del convenio"
            value={`${active.basePercentage}%`}
            note="Se aplica si el producto no define otro"
          />
          <AdminStat
            label="Productos con % propio"
            value={detail.data?.productRates.length ?? 0}
            note={`de ${products.data?.length ?? 0} vinculados`}
          />
          <AdminStat
            label="Método de liquidación"
            value={
              active.settlementMethod === "TRANSFER"
                ? "Transferencia"
                : "Split MP"
            }
            note={`${"Automática por transacción · Mobbex"}`}
          />
          <AdminStat
            label="Participación estimada"
            value={formatCents(balance.data?.accruedInCents ?? 0)}
            note="Período en curso"
            accent
          />
        </div>
        <div className="admin-table-wrap admin-participation-table">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio</th>
                <th>% aplicado</th>
                <th>Participación</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts?.map((product) => {
                const rate = detail.data?.productRates.find(
                  (item) => item.productId === product.id,
                )?.percentage;
                const applied = rate ?? active.basePercentage;
                return (
                  <ParticipationRow
                    key={product.id}
                    product={product}
                    rate={rate}
                    applied={applied}
                    saving={
                      setRate.isPending &&
                      setRate.variables?.productId === product.id
                    }
                    onSave={(percentage) =>
                      setPendingRateChange({
                        productId: product.id,
                        productName: product.name,
                        percentage,
                      })
                    }
                  />
                );
              })}
            </tbody>
          </table>
        </div>
        <nav
          className="admin-clubs-pagination"
          aria-label="Páginas de productos"
        >
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Anterior
          </button>
          <span>
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
          >
            Siguiente
          </button>
        </nav>
      </AdminPanel>
      {pendingRateChange ? (
        <ProductRateConfirmation
          productName={pendingRateChange.productName}
          percentage={pendingRateChange.percentage}
          isSaving={setRate.isPending}
          onCancel={() => {
            if (!setRate.isPending) setPendingRateChange(null);
          }}
          onConfirm={() =>
            setRate.mutate({
              agreementId: active.id,
              productId: pendingRateChange.productId,
              percentage: pendingRateChange.percentage,
            })
          }
        />
      ) : null}
    </AdminPage>
  );
}

function ProductRateConfirmation({
  productName,
  percentage,
  isSaving,
  onCancel,
  onConfirm,
}: {
  productName: string;
  percentage: number;
  isSaving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="admin-agreement-confirm-backdrop">
      <section
        role="alertdialog"
        aria-modal="true"
        className="admin-agreement-confirm"
      >
        <span aria-hidden="true">!</span>
        <h2>¿Confirmar porcentaje?</h2>
        <p>
          Vas a asignar <strong>{percentage}%</strong> a{" "}
          <strong>{productName}</strong>.
        </p>
        <small>
          Este porcentaje se aplicará únicamente a las próximas compras. Las
          compras anteriores conservarán el porcentaje que tenían al momento de
          la venta.
        </small>
        <div>
          <button type="button" onClick={onCancel} disabled={isSaving}>
            Cancelar
          </button>
          <button
            type="button"
            className="is-primary"
            disabled={isSaving}
            onClick={onConfirm}
          >
            {isSaving ? "Guardando…" : "Sí, confirmar cambio"}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}

function ParticipationRow({
  product,
  rate,
  applied,
  saving,
  onSave,
}: {
  product: { name: string; priceInCents: number };
  rate?: number;
  applied: number;
  saving: boolean;
  onSave: (value: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(applied));
  return (
    <tr>
      <td>
        <strong>{product.name}</strong>
      </td>
      <td>{formatCents(product.priceInCents)}</td>
      <td>
        {saving ? (
          <span className="admin-rate-loading">
            <ModernSpinner label="Cargando..." />
          </span>
        ) : editing ? (
          <span className="admin-rate-editor">
            <input
              className="admin-rate-input"
              type="number"
              disabled={saving}
              min="0"
              max="100"
              value={value}
              aria-label={`Porcentaje propio de ${product.name}`}
              onChange={(event) => setValue(event.target.value)}
            />
            <button
              type="button"
              className="admin-rate-save"
              aria-label={`Guardar porcentaje de ${product.name}`}
              title="Guardar porcentaje"
              disabled={saving}
              onClick={() => {
                onSave(Number(value));
                setEditing(false);
              }}
            >
              <SaveIcon />
            </button>
          </span>
        ) : rate !== undefined ? (
          <button
            type="button"
            className="admin-rate"
            onClick={() => setEditing(true)}
          >
            {rate}% <small>editar</small>
          </button>
        ) : (
          <button
            type="button"
            className="admin-use-base-button"
            onClick={() => setEditing(true)}
            title="Este producto usa el porcentaje base. Hacé clic para asignar uno propio."
          >
            {applied}%
          </button>
        )}
      </td>
      <td>
        <strong>
          {formatCents(Math.round((product.priceInCents * applied) / 100))}
        </strong>
      </td>
    </tr>
  );
}
