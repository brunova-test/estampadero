"use client";

import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Button, Container } from "elestampadero/shared/ui";
import { api } from "elestampadero/trpc/react";

import {
  ClubDesignsSection,
  ClubHomeSection,
  ClubProductsSection,
  ClubProfileSection,
  ClubSalesSection,
  ClubSettlementsSection,
  type PortalTab,
} from "./ClubPortalSections";
import { ClubPaymentsNotice, ClubPaymentsSection } from "./ClubPaymentsSection";

const TABS: Array<{ id: PortalTab; label: string; description: string }> = [
  {
    id: "inicio",
    label: "Inicio",
    description: "Resumen general de la actividad de tu institución.",
  },
  {
    id: "disenos",
    label: "Diseños",
    description: "Revisá propuestas, versiones y aprobaciones pendientes.",
  },
  {
    id: "productos",
    label: "Productos",
    description: "Consultá el catálogo vinculado, precios y disponibilidad.",
  },
  {
    id: "ventas",
    label: "Ventas",
    description: "Seguí pedidos, unidades vendidas y comisiones generadas.",
  },
  {
    id: "liquidaciones",
    label: "Liquidaciones",
    description: "Controlá saldos, períodos y pagos de la institución.",
  },
  {
    id: "cobros",
    label: "Cobros",
    description: "Vinculá Mobbex y seguí el estado de los pagos automáticos.",
  },
  {
    id: "datos",
    label: "Mis datos",
    description: "Información institucional, convenio y usuarios autorizados.",
  },
];

function PortalTabIcon({ tab }: { tab: PortalTab }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="club-portal-nav-icon h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {tab === "inicio" ? (
        <>
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
        </>
      ) : null}
      {tab === "disenos" ? (
        <>
          <path d="m4 20 4.2-1 10.4-10.4a2.1 2.1 0 0 0-3-3L5.2 16.8Z" />
          <path d="m14.5 6.7 2.8 2.8" />
          <path d="M4 20h4" />
        </>
      ) : null}
      {tab === "productos" ? (
        <>
          <path d="m4 8 8-4 8 4-8 4-8-4Z" />
          <path d="M4 12c0 2.2 3.6 4 8 4s8-1.8 8-4" />
          <path d="M4 16c0 2.2 3.6 4 8 4s8-1.8 8-4" />
        </>
      ) : null}
      {tab === "ventas" ? (
        <>
          <path d="M4 20V5" />
          <path d="M4 20h16" />
          <path d="m7 15 4-4 3 3 5-7" />
        </>
      ) : null}
      {tab === "liquidaciones" ? (
        <>
          <rect x="3" y="5" width="18" height="15" rx="2" />
          <path d="M3 9h18M7 14h.01M11 14h5" />
        </>
      ) : null}
      {tab === "cobros" ? (
        <>
          <path d="M4 7.5h14a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12" />
          <path d="M15 13h5" />
          <circle cx="16" cy="13" r=".7" fill="currentColor" />
        </>
      ) : null}
      {tab === "datos" ? (
        <>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 20a5.5 5.5 0 0 1 11 0M17 8h4M19 6v4M16 15h5" />
        </>
      ) : null}
    </svg>
  );
}

function ClubSidebarActionIcon({ name }: { name: "store" | "logout" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="club-portal-nav-icon h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === "store" ? (
        <>
          <path d="M3 10h18l-1.5-5h-15Z" />
          <path d="M5 10v9h14v-9M9 19v-5h6v5M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
        </>
      ) : (
        <>
          <path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9" />
        </>
      )}
    </svg>
  );
}

function RequiredPasswordChange({ clubName }: { clubName: string }) {
  const utils = api.useUtils();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const changePassword = api.identity.changePassword.useMutation({
    onSuccess: async () => {
      await utils.clubs.portalData.invalidate();
    },
    onError: (mutationError) => setError(mutationError.message),
  });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }
    changePassword.mutate({
      newPassword,
      confirmPassword,
      forceChange: true,
    });
  }

  return (
    <main className="bg-paper grid min-h-[calc(100vh-130px)] place-items-center p-4 sm:p-8">
      <section className="grid w-full max-w-4xl gap-8 bg-white p-6 shadow-sm sm:grid-cols-[.8fr_1.2fr] sm:p-10">
        <div>
          <span className="text-blue font-mono text-xs tracking-[.16em] uppercase">
            Seguridad de la cuenta
          </span>
          <h1 className="font-display text-ink mt-2 text-3xl font-black">
            Cambiá tu contraseña
          </h1>
          <p className="text-muted mt-3 text-sm leading-relaxed">
            Para ingresar al portal de {clubName}, primero elegí una contraseña
            personal de al menos 8 caracteres.
          </p>
        </div>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-ink text-sm font-semibold">Nueva contraseña</span>
              <input
                required
                minLength={8}
                maxLength={72}
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="h-12 border border-[#d9d5e2] px-4 outline-none transition-colors focus:border-[#8fe8cf]"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-ink text-sm font-semibold">Repetir contraseña</span>
              <input
                required
                minLength={8}
                maxLength={72}
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="h-12 border border-[#d9d5e2] px-4 outline-none transition-colors focus:border-[#8fe8cf]"
              />
            </label>
          </div>
          {error ? (
            <p className="border-red-500 bg-red-50 text-red-800 border-l-4 px-4 py-3 text-sm font-semibold">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={changePassword.isPending} loading={changePassword.isPending} loadingLabel="Actualizando contraseña">
            Guardar nueva contraseña
          </Button>
        </form>
      </section>
    </main>
  );
}

export function ClubPortalView() {
  const [activeTab, setActiveTab] = useState<PortalTab>("inicio");
  const [chosenClubId, setChosenClubId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const myClubsQuery = api.clubs.myClubs.useQuery();
  const memberships = myClubsQuery.data ?? [];
  const selectedMembership =
    memberships.find((club) => club.id === chosenClubId) ?? memberships[0];
  const clubId = selectedMembership?.id ?? "";

  const portalQuery = api.clubs.portalData.useQuery(
    { clubId },
    { enabled: !!clubId },
  );
  const agreementsQuery = api.agreements.listByClub.useQuery(
    { clubId },
    { enabled: !!clubId },
  );
  const balanceQuery = api.commissions.balance.useQuery(
    { clubId },
    { enabled: !!clubId },
  );
  const commissionsQuery = api.commissions.listByClub.useQuery(
    { clubId },
    { enabled: !!clubId },
  );
  const settlementsQuery = api.settlements.listByClub.useQuery(
    { clubId },
    { enabled: !!clubId },
  );
  const designsQuery = api.designs.listByClub.useQuery(
    { clubId },
    { enabled: !!clubId },
  );

  const portalData = portalQuery.data;
  const activeAgreement = agreementsQuery.data?.find(
    (agreement) => agreement.status === "ACTIVE",
  );
  const commissions = commissionsQuery.data ?? [];
  const settlements = settlementsQuery.data ?? [];
  const designs = designsQuery.data ?? [];

  function navigate(tab: PortalTab) {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (myClubsQuery.isLoading) {
    return <div className="bg-paper min-h-screen" />;
  }

  if (!selectedMembership) {
    return (
      <main className="bg-paper grid min-h-screen place-items-center p-6">
        <div className="brand-card-cut border-mint max-w-xl border-t-8 bg-white p-10 text-center">
          <span className="text-blue font-mono text-xs tracking-[.16em] uppercase">
            Portal privado
          </span>
          <h1 className="font-display text-ink mt-3 text-3xl font-black">
            Tu cuenta todavía no está asociada a un club
          </h1>
          <p className="text-muted mt-3">
            Pedile al administrador de la institución que agregue tu correo
            desde “Mis datos”.
          </p>
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: "/ingresar" })}
            className="brand-cut bg-deep mt-7 px-7 py-3 font-bold text-white"
          >
            Volver a la tienda
          </button>
        </div>
      </main>
    );
  }

  const headerClub = portalData?.club ?? selectedMembership;
  const activeSection = TABS.find((tab) => tab.id === activeTab) ?? TABS[0]!;

  return (
    <div
      className={`club-portal-shell bg-paper min-h-screen lg:flex ${
        isSidebarCollapsed ? "club-portal-shell--collapsed" : ""
      }`}
    >
      <aside className="club-portal-sidebar sticky top-0 z-50 border-r border-white/10 bg-[#0e0a1a] text-white lg:h-screen lg:w-[240px] lg:shrink-0">
        <div className="flex h-full flex-col px-3 py-3 sm:px-5 lg:overflow-y-auto lg:px-[18px] lg:pt-[30px] lg:pb-[22px]">
          <div className="club-portal-brand flex items-center gap-3">
            <div className="border-mint/70 relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 bg-white lg:h-[52px] lg:w-[52px]">
              {headerClub.logoUrl ? (
                <Image
                  src={headerClub.logoUrl}
                  alt={headerClub.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-deep grid h-full place-items-center bg-white font-black">
                  {headerClub.name.charAt(0)}
                </span>
              )}
            </div>
            <div className="club-portal-brand-copy min-w-0 flex-1">
              <span className="block max-w-[155px] truncate text-base leading-[1.1] font-bold">
                {headerClub.name}
              </span>
              <span className="text-mint mt-1 block max-w-[155px] truncate text-[11px] font-semibold tracking-[.08em] uppercase">
                Portal de clubes
              </span>
            </div>
          </div>

          <button
            type="button"
            className="club-portal-sidebar-toggle"
            onClick={() => setIsSidebarCollapsed((value) => !value)}
            aria-label={
              isSidebarCollapsed
                ? "Expandir barra lateral"
                : "Contraer barra lateral"
            }
            aria-expanded={!isSidebarCollapsed}
            title={isSidebarCollapsed ? "Expandir menú" : "Contraer menú"}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="m15 5-7 7 7 7" />
            </svg>
          </button>

          {memberships.length > 1 ? (
            <label className="club-portal-switcher mt-4 block lg:mt-5">
              <span className="sr-only">Cambiar club</span>
              <select
                value={selectedMembership.id}
                onChange={(event) => {
                  setChosenClubId(event.target.value);
                  setActiveTab("inicio");
                }}
                className="focus:border-mint w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white outline-none"
              >
                {memberships.map((club) => (
                  <option key={club.id} value={club.id} className="text-ink">
                    {club.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <nav
            aria-label="Secciones del portal"
            className="club-portal-nav mt-4 flex [scrollbar-width:none] gap-1.5 overflow-x-auto lg:mt-0 lg:min-h-0 lg:flex-1 lg:flex-col lg:gap-[3px] lg:overflow-x-hidden lg:overflow-y-auto lg:pt-0.5 lg:pr-[5px] lg:pb-3.5"
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => navigate(tab.id)}
                  className={`club-portal-nav-item group relative flex shrink-0 items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-semibold outline-none lg:w-full lg:gap-3 lg:px-3.5 lg:py-3 lg:text-base lg:font-medium ${
                    isActive
                      ? "is-active bg-[#4a08a2] text-white lg:font-bold"
                      : "text-white/65 hover:text-white"
                  }`}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center lg:h-[22px] lg:w-[22px]">
                    <PortalTabIcon tab={tab.id} />
                  </span>
                  <span className="club-portal-nav-label">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto hidden border-t border-white/10 pt-3 lg:block">
            {portalData?.mustChangePassword ? (
              <div
                aria-disabled="true"
                className="club-portal-nav-item flex cursor-not-allowed items-center gap-3 px-3.5 py-3 text-base font-medium text-white/25"
                title="Cambiá tu contraseña para continuar"
              >
                <ClubSidebarActionIcon name="store" />
                <span className="club-portal-nav-label">Volver a la tienda</span>
              </div>
            ) : (
              <Link
                href="/"
                data-loading-label="Inicio"
                className="club-portal-nav-item flex items-center gap-3 px-3.5 py-3 text-base font-medium text-white/65"
              >
                <ClubSidebarActionIcon name="store" />
                <span className="club-portal-nav-label">Volver a la tienda</span>
              </Link>
            )}
            <button
              type="button"
              disabled={signingOut}
              onClick={async () => {
                setSigningOut(true);
                await signOut({ callbackUrl: "/ingresar" });
              }}
              className="club-portal-nav-item mt-1 flex w-full items-center gap-3 px-3.5 py-3 text-left text-base font-medium text-white/65 disabled:opacity-50"
            >
              <ClubSidebarActionIcon name="logout" />
              <span className="club-portal-nav-label">
                {signingOut ? "Saliendo..." : "Cerrar sesión"}
              </span>
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header
          className={`border-deep/8 border-b bg-white px-4 py-4 sm:px-6 lg:px-8 lg:py-5 ${
            activeTab === "cobros" ? "club-payments-admin-type" : ""
          }`}
        >
          <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <span
                className={`text-blue font-mono font-semibold tracking-[.18em] uppercase ${
                  activeTab === "cobros"
                    ? "text-[11px] sm:text-[13px]"
                    : "text-[11px] sm:text-[13px]"
                }`}
              >
                Portal privado · {portalData?.club.slug ?? headerClub.slug}
              </span>
              <h1
                className={`font-display text-ink mt-2 leading-none font-black ${
                  activeTab === "cobros"
                    ? "text-[clamp(32px,3.35vw,50px)]"
                    : "text-[clamp(32px,3.36vw,50px)]"
                }`}
              >
                {activeSection.label}
              </h1>
              <p
                className={`text-muted mt-1 max-w-2xl ${
                  activeTab === "cobros"
                    ? "text-[15px] sm:text-[17px]"
                    : "text-[15px] sm:text-[17px]"
                }`}
              >
                {activeSection.description}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`bg-mint/30 text-deep rounded-full px-4 py-2 font-bold ${
                  activeTab === "cobros" ? "text-[16px]" : "text-[15px]"
                }`}
              >
                Club activo
              </span>
              <button
                type="button"
                disabled={signingOut}
                onClick={async () => {
                  setSigningOut(true);
                  await signOut({ callbackUrl: "/ingresar" });
                }}
                className="text-muted hover:text-deep text-sm font-semibold lg:hidden"
              >
                {signingOut ? "Saliendo..." : "Salir"}
              </button>
            </div>
          </div>
        </header>

        {portalQuery.error ? (
          <Container className="max-w-[1500px] py-10 lg:px-8">
            <div className="border-mint rounded-xl border-l-8 bg-white p-8 shadow-sm">
              <h2 className="font-display text-ink text-2xl font-black">
                No pudimos cargar el portal
              </h2>
              <p className="text-muted mt-2">{portalQuery.error.message}</p>
              <button
                type="button"
                onClick={() => void portalQuery.refetch()}
                className="text-blue hover:text-deep mt-5 font-bold"
              >
                Intentar de nuevo
              </button>
            </div>
          </Container>
        ) : null}

        {!portalData && !portalQuery.error ? (
          <div className="grid min-h-[420px] place-items-center">
            <span className="global-loader__spinner" aria-label="Cargando..." />
          </div>
        ) : null}

        {portalData?.mustChangePassword ? (
          <RequiredPasswordChange clubName={portalData.club.name} />
        ) : null}

        {portalData && !portalData.mustChangePassword ? (
          <main className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
            <Container className="max-w-[1500px] px-0">
              {activeTab === "inicio" ? (
                <>
                  <ClubPaymentsNotice
                    data={portalData}
                    onOpen={() => navigate("cobros")}
                  />
                  <ClubHomeSection
                    data={portalData}
                    activeAgreement={activeAgreement}
                    balance={balanceQuery.data}
                    commissions={commissions}
                    settlements={settlements}
                    designs={designs}
                    onNavigate={navigate}
                  />
                </>
              ) : null}
              {activeTab === "disenos" ? (
                <ClubDesignsSection
                  clubId={portalData.club.id}
                  designs={designs}
                  canReview={portalData.canReviewDesigns}
                />
              ) : null}
              {activeTab === "productos" ? (
                <ClubProductsSection data={portalData} />
              ) : null}
              {activeTab === "ventas" ? (
                <ClubSalesSection data={portalData} commissions={commissions} />
              ) : null}
              {activeTab === "liquidaciones" ? (
                <ClubSettlementsSection
                  settlements={settlements}
                  balance={balanceQuery.data}
                />
              ) : null}
              {activeTab === "cobros" ? (
                <ClubPaymentsSection data={portalData} />
              ) : null}
              {activeTab === "datos" ? (
                <ClubProfileSection
                  data={portalData}
                  activeAgreement={activeAgreement}
                />
              ) : null}
            </Container>
          </main>
        ) : null}
      </div>
    </div>
  );
}
