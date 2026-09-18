"use client";

import { useEffect, useState, type FormEvent } from "react";

import { api, type RouterOutputs } from "elestampadero/trpc/react";

type PortalData = RouterOutputs["clubs"]["portalData"];
type OnboardingStatus = PortalData["club"]["mobbexOnboardingStatus"];

const STATUS_COPY: Record<
  OnboardingStatus,
  { label: string; detail: string; step: number }
> = {
  NOT_STARTED: {
    label: "Vinculación pendiente",
    detail: "Completá el alta para recibir automáticamente cada participación.",
    step: 1,
  },
  REGISTRATION_PENDING: {
    label: "Creando cuenta Mobbex",
    detail: "Cuando Mobbex habilite la cuenta, completá los datos del club.",
    step: 1,
  },
  DETAILS_SUBMITTED: {
    label: "Datos enviados",
    detail:
      "El Estampadero revisará los datos y solicitará acceso al comercio.",
    step: 2,
  },
  ACCESS_REQUESTED: {
    label: "Esperando tu autorización",
    detail: "Autorizá a El Estampadero desde la consola de Mobbex.",
    step: 3,
  },
  AUTHORIZATION_CONFIRMED: {
    label: "Verificación final",
    detail: "Estamos validando la entidad antes de habilitar los cobros.",
    step: 4,
  },
  ACTIVE: {
    label: "Cobros automáticos activos",
    detail: "El club ya puede recibir participaciones mediante split de pagos.",
    step: 4,
  },
};

type PaymentIconName =
  | "wallet"
  | "store"
  | "shield"
  | "check"
  | "file"
  | "send"
  | "building"
  | "id"
  | "link"
  | "calendar"
  | "lock"
  | "arrow"
  | "external"
  | "globe";

function PaymentIcon({ name }: { name: PaymentIconName }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === "wallet" ? (
        <>
          <path d="M4 7.5h14a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12" />
          <path d="M15 13h5" />
          <circle cx="16" cy="13" r=".7" fill="currentColor" />
        </>
      ) : null}
      {name === "store" ? (
        <>
          <path d="M4 10v10h16V10" />
          <path d="M3 10 5 4h14l2 6" />
          <path d="M3 10a3 3 0 0 0 5 2 3 3 0 0 0 4 0 3 3 0 0 0 4 0 3 3 0 0 0 5-2" />
        </>
      ) : null}
      {name === "shield" ? (
        <>
          <path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6Z" />
          <path d="m9 12 2 2 4-4" />
        </>
      ) : null}
      {name === "check" ? <path d="m5 12 4 4L19 6" /> : null}
      {name === "file" ? (
        <>
          <path d="M6 3h8l4 4v14H6Z" />
          <path d="M14 3v5h4M9 12h6m-6 4h6" />
        </>
      ) : null}
      {name === "send" ? (
        <>
          <path d="m3 11 18-8-8 18-2.5-7.5Z" />
          <path d="M10.5 13.5 15 9" />
        </>
      ) : null}
      {name === "building" ? (
        <>
          <path d="M4 21V7l8-4 8 4v14M8 10h2m4 0h2M8 14h2m4 0h2M9 21v-3h6v3" />
        </>
      ) : null}
      {name === "id" ? (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="8" cy="11" r="2" />
          <path d="M5.5 16a3 3 0 0 1 5 0M13 10h5m-5 4h5" />
        </>
      ) : null}
      {name === "link" ? (
        <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2m2.7 5.3a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2" />
      ) : null}
      {name === "calendar" ? (
        <>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4m8-4v4M4 10h16m-12 4h3m2 0h3m-8 3h3" />
        </>
      ) : null}
      {name === "lock" ? (
        <>
          <rect x="5" y="10" width="14" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
          <circle cx="12" cy="15" r="1" />
        </>
      ) : null}
      {name === "arrow" ? <path d="M5 12h14m-5-5 5 5-5 5" /> : null}
      {name === "external" ? (
        <>
          <path d="M14 4h6v6m0-6-9 9" />
          <path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" />
        </>
      ) : null}
      {name === "globe" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </>
      ) : null}
    </svg>
  );
}

function Progress({ status }: { status: OnboardingStatus }) {
  const current = STATUS_COPY[status].step;
  const steps: { label: string; icon: PaymentIconName }[] = [
    { label: "Datos", icon: "file" },
    { label: "Solicitud", icon: "send" },
    { label: "Autorización", icon: "shield" },
    { label: "Activación", icon: "check" },
  ];
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Progreso de vinculación">
      {steps.map(({ label, icon }, index) => {
        const step = index + 1;
        const completed = status === "ACTIVE" || step < current;
        const active = step === current && status !== "ACTIVE";
        return (
          <li key={label} className="min-w-0">
            <div
              className={`h-1.5 rounded-full ${
                completed || active ? "bg-mint" : "bg-white/15"
              }`}
            />
            <span
              className={`mx-auto mt-3 grid h-8 w-8 place-items-center rounded-full [&>svg]:h-4 [&>svg]:w-4 ${
                completed || active
                  ? "bg-mint text-deep"
                  : "bg-white/10 text-white/40"
              }`}
            >
              <PaymentIcon name={icon} />
            </span>
            <span
              className={`mt-2 block truncate text-center text-[11px] font-bold tracking-[.08em] uppercase ${
                completed || active ? "text-white" : "text-white/40"
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function ClubPaymentsNotice({
  data,
  onOpen,
}: {
  data: PortalData;
  onOpen: () => void;
}) {
  const status = data.club.mobbexOnboardingStatus;
  if (status === "ACTIVE") return null;
  const copy = STATUS_COPY[status];
  return (
    <section className="club-payments-admin-type brand-card-cut border-mint bg-deep mb-5 overflow-hidden border-l-8 p-5 text-white sm:mb-7 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="bg-mint text-deep grid h-11 w-11 shrink-0 place-items-center rounded-xl">
            <PaymentIcon name="wallet" />
          </span>
          <div>
            <span className="text-mint font-mono text-[10px] font-bold tracking-[.16em] uppercase">
              Cobros con Mobbex
            </span>
            <h2 className="font-display mt-1 text-xl font-black">
              {copy.label}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-white/65">
              {copy.detail}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="club-payments-continue brand-cut bg-mint text-deep inline-flex shrink-0 items-center justify-center gap-2 px-5 py-3 text-sm font-black"
        >
          Continuar vinculación
          <PaymentIcon name="arrow" />
        </button>
      </div>
    </section>
  );
}

export function ClubPaymentsSection({ data }: { data: PortalData }) {
  const utils = api.useUtils();
  const club = data.club;
  const status = club.mobbexOnboardingStatus;
  const copy = STATUS_COPY[status];
  const catalogUrlExample = `https://tu-dominio.com/catalogo?club=${club.slug}`;
  const [showForm, setShowForm] = useState(status === "REGISTRATION_PENDING");
  const isInitialScreen =
    (status === "NOT_STARTED" || status === "REGISTRATION_PENDING") &&
    !showForm;
  const [legalName, setLegalName] = useState(club.mobbexLegalName ?? club.name);
  const [taxId, setTaxId] = useState(club.mobbexTaxId ?? "");
  const [contactName, setContactName] = useState(club.mobbexContactName ?? "");
  const [contactEmail, setContactEmail] = useState(
    club.mobbexContactEmail ?? "",
  );
  const [contactPhone, setContactPhone] = useState(
    club.mobbexContactPhone ?? "",
  );
  const [entityId, setEntityId] = useState(club.mobbexSubmittedEntityId ?? "");

  useEffect(() => {
    setShowForm(club.mobbexOnboardingStatus === "REGISTRATION_PENDING");
    setLegalName(club.mobbexLegalName ?? club.name);
    setTaxId(club.mobbexTaxId ?? "");
    setContactName(club.mobbexContactName ?? "");
    setContactEmail(club.mobbexContactEmail ?? "");
    setContactPhone(club.mobbexContactPhone ?? "");
    setEntityId(club.mobbexSubmittedEntityId ?? "");
  }, [club]);

  const refresh = () => utils.clubs.portalData.invalidate({ clubId: club.id });
  const start = api.clubs.startMobbexOnboarding.useMutation({
    onSuccess: refresh,
  });
  const submit = api.clubs.submitMobbexOnboarding.useMutation({
    onSuccess: refresh,
  });
  const confirm = api.clubs.confirmMobbexAuthorization.useMutation({
    onSuccess: refresh,
  });

  function submitDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit.mutate({
      clubId: club.id,
      legalName,
      taxId,
      contactName,
      contactEmail,
      contactPhone,
      entityId: entityId || undefined,
    });
  }

  return (
    <div
      className={`club-payments-admin-type grid gap-5 ${
        isInitialScreen ? "lg:grid-cols-[minmax(0,1fr)_360px]" : ""
      }`}
    >
      <section className="brand-card-cut overflow-hidden bg-white">
        <div className="bg-deep p-6 text-white sm:p-8">
          <div className="flex flex-col items-center text-center">
            <span
              className={`mb-4 grid h-14 w-14 place-items-center rounded-2xl ${
                status === "ACTIVE"
                  ? "bg-mint text-deep"
                  : "text-mint bg-white/10"
              }`}
            >
              <PaymentIcon name={status === "ACTIVE" ? "check" : "wallet"} />
            </span>
            <div>
              <span className="text-mint font-mono text-[13px] font-bold tracking-[.16em] uppercase">
                Split de pagos
              </span>
              <h2 className="font-display mt-2 text-[32px] font-black sm:text-[38px]">
                {copy.label}
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-6 text-white/65 sm:text-[17px]">
                {copy.detail}
              </p>
            </div>
          </div>
          <div className="mt-7">
            <Progress status={status} />
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {isInitialScreen ? (
            <div>
              <h3 className="font-display text-ink text-2xl font-black">
                ¿El club ya tiene una cuenta Mobbex?
              </h3>
              <p className="text-muted mt-2 max-w-2xl text-sm leading-6">
                No pediremos contraseñas, PIN, API Key ni Access Token. La
                vinculación se realiza con el CUIT y la autorización del club.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <article className="border-blue/20 flex flex-col items-center rounded-2xl border-2 bg-white p-5 text-center shadow-sm transition hover:border-[#9ab9ff] hover:shadow-md">
                  <span className="bg-blue/10 text-blue grid h-10 w-10 place-items-center rounded-xl">
                    <PaymentIcon name="store" />
                  </span>
                  <strong className="text-ink mt-4 block text-lg">
                    Sí, ya tenemos cuenta
                  </strong>
                  <span className="text-muted mt-1 block text-sm">
                    Cargá los datos para solicitar la vinculación.
                  </span>
                  <button
                    type="button"
                    disabled={!data.canManageMembers}
                    onClick={() => setShowForm(true)}
                    className="border-blue text-blue hover:text-deep focus-visible:outline-blue mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 bg-white px-5 py-2.5 text-[15px] font-bold transition-colors hover:border-[#9ab9ff] hover:bg-[#dce9ff] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>svg]:h-4 [&>svg]:w-4"
                  >
                    <PaymentIcon name="arrow" />
                    Cargar datos
                  </button>
                </article>
                <article className="border-mint bg-mint/10 flex flex-col items-center rounded-2xl border-2 p-5 text-center shadow-sm transition hover:border-[#9ab9ff] hover:shadow-md">
                  <span className="bg-mint text-deep grid h-10 w-10 place-items-center rounded-xl">
                    <PaymentIcon name="shield" />
                  </span>
                  <strong className="text-ink mt-4 block text-lg">
                    Todavía no tenemos
                  </strong>
                  <span className="text-muted mt-1 block text-sm">
                    Te guiamos para crearla y continuar después.
                  </span>
                  <button
                    type="button"
                    disabled={!data.canManageMembers || start.isPending}
                    onClick={() => {
                      start.mutate({ clubId: club.id, hasAccount: false });
                      window.open(
                        "https://mobbex.com/auth/?backUrl=%2Fconsole%2F",
                        "_blank",
                        "noopener,noreferrer",
                      );
                    }}
                    className="border-deep text-deep focus-visible:outline-blue mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 bg-white px-5 py-2.5 text-[15px] font-bold transition-colors hover:border-[#9ab9ff] hover:bg-[#dce9ff] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>svg]:h-4 [&>svg]:w-4"
                  >
                    <PaymentIcon name="external" />
                    Crear cuenta
                  </button>
                </article>
              </div>
            </div>
          ) : null}

          {showForm &&
          status !== "ACCESS_REQUESTED" &&
          status !== "AUTHORIZATION_CONFIRMED" &&
          status !== "ACTIVE" ? (
            <div>
              {["NOT_STARTED", "REGISTRATION_PENDING"].includes(status) ? (
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="border-deep/20 text-deep mb-6 inline-flex items-center justify-center gap-2 rounded-full border-2 bg-white px-4 py-2 text-sm font-bold transition-colors hover:border-[#9ab9ff] hover:bg-[#dce9ff] [&>svg]:h-4 [&>svg]:w-4 [&>svg]:rotate-180"
                >
                  <PaymentIcon name="arrow" />
                  Volver a las opciones
                </button>
              ) : null}
              {status === "REGISTRATION_PENDING" ? (
                <div className="mobbex-registration-guide border-mint bg-mint/10 mb-6 rounded-2xl border p-5">
                  <div className="text-center">
                    <span className="bg-mint text-deep mx-auto grid h-12 w-12 place-items-center rounded-xl">
                      <PaymentIcon name="building" />
                    </span>
                    <strong className="text-deep mt-3 block text-[20px]">
                      Primero solicitá el alta del club en Mobbex
                    </strong>
                    <p className="text-muted mx-auto mt-2 max-w-2xl text-[16px] leading-7">
                      Completá el alta con los datos fiscales reales del club.
                    </p>
                  </div>

                  <MobbexFieldGuide catalogUrl={catalogUrlExample} />

                  <ol className="mt-5 grid gap-3 sm:grid-cols-3">
                    <RegistrationStep
                      icon="file"
                      number="1"
                      title="Enviá el alta"
                      detail="Completá el formulario comercial de Mobbex con los datos del club."
                    />
                    <RegistrationStep
                      icon="send"
                      number="2"
                      title="Esperá la habilitación"
                      detail="Mobbex revisa la información y envía el acceso al representante."
                    />
                    <RegistrationStep
                      icon="check"
                      number="3"
                      title="Volvé al portal"
                      detail="Cuando puedas ingresar a la consola, cargá aquí los datos de vinculación."
                    />
                  </ol>

                  <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                    <a
                      href="https://www.mobbex.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="brand-cut bg-deep inline-flex items-center justify-center gap-2 px-5 py-3 text-center text-[16px] font-black text-white transition hover:bg-[#48108f]"
                    >
                      <PaymentIcon name="external" />
                      Solicitar alta en Mobbex
                    </a>
                    <a
                      href="https://mobbex.com/console/"
                      target="_blank"
                      rel="noreferrer"
                      className="brand-cut border-deep text-deep inline-flex items-center justify-center gap-2 border-2 bg-white px-5 py-3 text-center text-[16px] font-black transition hover:bg-[#f5f2f8]"
                    >
                      <PaymentIcon name="lock" />
                      Ya tengo acceso a la consola
                    </a>
                  </div>
                </div>
              ) : null}
              <h3 className="font-display text-ink text-2xl font-black">
                Datos para la vinculación
              </h3>
              <p className="text-muted mt-2 text-sm">
                El Estampadero utilizará estos datos únicamente para localizar
                la entidad y solicitar acceso.
              </p>
              <form
                onSubmit={submitDetails}
                className="mt-6 grid gap-5 sm:grid-cols-2"
              >
                <label className="sm:col-span-2">
                  <span className="text-ink text-sm font-bold">
                    Razón social
                  </span>
                  <input
                    required
                    value={legalName}
                    onChange={(event) => setLegalName(event.target.value)}
                    className="focus:border-blue mt-2 h-12 w-full rounded-xl border-2 border-[#ddd8e6] px-4 outline-none"
                    maxLength={160}
                  />
                </label>
                <label>
                  <span className="text-ink text-sm font-bold">
                    CUIT del club
                  </span>
                  <input
                    required
                    inputMode="numeric"
                    value={taxId}
                    onChange={(event) =>
                      setTaxId(
                        event.target.value.replace(/\D/g, "").slice(0, 11),
                      )
                    }
                    placeholder="11 dígitos"
                    className="focus:border-blue mt-2 h-12 w-full rounded-xl border-2 border-[#ddd8e6] px-4 outline-none"
                  />
                </label>
                <label>
                  <span className="text-ink text-sm font-bold">UID Mobbex</span>
                  <input
                    value={entityId}
                    onChange={(event) => setEntityId(event.target.value)}
                    placeholder="Opcional si todavía no lo conocés"
                    className="focus:border-blue mt-2 h-12 w-full rounded-xl border-2 border-[#ddd8e6] px-4 outline-none"
                    maxLength={120}
                  />
                </label>
                <label>
                  <span className="text-ink text-sm font-bold">
                    Responsable
                  </span>
                  <input
                    required
                    value={contactName}
                    onChange={(event) => setContactName(event.target.value)}
                    className="focus:border-blue mt-2 h-12 w-full rounded-xl border-2 border-[#ddd8e6] px-4 outline-none"
                    maxLength={120}
                  />
                </label>
                <label>
                  <span className="text-ink text-sm font-bold">Teléfono</span>
                  <input
                    required
                    type="tel"
                    value={contactPhone}
                    onChange={(event) => setContactPhone(event.target.value)}
                    className="focus:border-blue mt-2 h-12 w-full rounded-xl border-2 border-[#ddd8e6] px-4 outline-none"
                    maxLength={40}
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className="text-ink text-sm font-bold">
                    Correo de contacto
                  </span>
                  <input
                    required
                    type="email"
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                    className="focus:border-blue mt-2 h-12 w-full rounded-xl border-2 border-[#ddd8e6] px-4 outline-none"
                    maxLength={254}
                  />
                </label>
                <div className="flex flex-col items-center sm:col-span-2">
                  <button
                    type="submit"
                    disabled={
                      !data.canManageMembers ||
                      submit.isPending ||
                      taxId.length !== 11
                    }
                    className="brand-cut bg-deep hover:bg-blue inline-flex w-full items-center justify-center gap-2 px-6 py-3.5 font-black text-white transition disabled:opacity-50 sm:w-auto"
                  >
                    <PaymentIcon name="send" />
                    {submit.isPending
                      ? "Enviando…"
                      : "Enviar datos de vinculación"}
                  </button>
                  {submit.error ? (
                    <p className="mt-3 text-sm font-semibold text-red-600">
                      {submit.error.message}
                    </p>
                  ) : null}
                </div>
              </form>
            </div>
          ) : null}

          {status === "DETAILS_SUBMITTED" && !showForm ? (
            <StatusDetails
              data={data}
              canEdit={data.canManageMembers}
              onEdit={() => setShowForm(true)}
            />
          ) : null}

          {status === "ACCESS_REQUESTED" ? (
            <div>
              <h3 className="font-display text-ink text-2xl font-black">
                Autorizá la aplicación de El Estampadero
              </h3>
              <ol className="text-muted mt-5 grid gap-3 text-sm">
                <li className="rounded-xl bg-[#f5f2f8] p-4">
                  <strong className="text-deep">1.</strong> Ingresá a la consola
                  Mobbex.
                </li>
                <li className="rounded-xl bg-[#f5f2f8] p-4">
                  <strong className="text-deep">2.</strong> Abrí APP/E-Commerce
                  y seleccioná Administrar.
                </li>
                <li className="rounded-xl bg-[#f5f2f8] p-4">
                  <strong className="text-deep">3.</strong> Autorizá la
                  solicitud de El Estampadero.
                </li>
              </ol>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <a
                  href="https://mobbex.com/console/"
                  target="_blank"
                  rel="noreferrer"
                  className="brand-cut bg-deep inline-flex items-center justify-center gap-2 px-6 py-3.5 text-center font-black text-white transition hover:bg-[#48108f]"
                >
                  <PaymentIcon name="external" />
                  Abrir consola Mobbex
                </a>
                <button
                  type="button"
                  disabled={!data.canManageMembers || confirm.isPending}
                  onClick={() => confirm.mutate({ clubId: club.id })}
                  className="brand-cut bg-mint text-deep inline-flex items-center justify-center gap-2 px-6 py-3.5 font-black transition hover:bg-[#9af3ce] disabled:opacity-50"
                >
                  <PaymentIcon name="check" />
                  {confirm.isPending ? "Confirmando…" : "Ya autoricé el acceso"}
                </button>
              </div>
              {confirm.error ? (
                <p className="mt-3 text-sm font-semibold text-red-600">
                  {confirm.error.message}
                </p>
              ) : null}
            </div>
          ) : null}

          {status === "AUTHORIZATION_CONFIRMED" ? (
            <div className="py-4 text-center">
              <span className="bg-mint/30 text-deep mx-auto grid h-16 w-16 place-items-center rounded-2xl">
                <PaymentIcon name="shield" />
              </span>
              <h3 className="font-display text-ink mt-5 text-2xl font-black">
                Recibimos tu confirmación
              </h3>
              <p className="text-muted mx-auto mt-2 max-w-xl text-sm leading-6">
                El Estampadero verificará el UID con Mobbex. Cuando finalice,
                los productos del club quedarán habilitados para el reparto
                automático.
              </p>
            </div>
          ) : null}

          {status === "ACTIVE" ? (
            <div>
              <div className="border-mint bg-mint/10 rounded-2xl border p-5">
                <div className="flex flex-col items-center text-center">
                  <span className="bg-mint text-deep grid h-12 w-12 place-items-center rounded-xl">
                    <PaymentIcon name="check" />
                  </span>
                  <div className="mt-3">
                    <strong className="text-deep text-[19px]">
                      Vinculación verificada
                    </strong>
                    <p className="text-muted mx-auto mt-1 max-w-xl text-[15px] leading-6">
                      Las próximas compras se repartirán automáticamente según
                      el convenio vigente del club.
                    </p>
                  </div>
                </div>
              </div>
              <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                <Info
                  icon="building"
                  label="Razón social"
                  value={club.mobbexLegalName ?? club.name}
                />
                <Info
                  icon="id"
                  label="CUIT"
                  value={formatTaxId(club.mobbexTaxId)}
                />
                <Info
                  icon="link"
                  label="Entidad"
                  value={maskEntity(club.mobbexEntityId)}
                />
                <Info
                  icon="calendar"
                  label="Activada"
                  value={formatDate(club.mobbexActivatedAt)}
                />
              </dl>
            </div>
          ) : null}

          {!data.canManageMembers && status !== "ACTIVE" ? (
            <p className="border-blue/20 bg-blue/5 text-muted mt-6 rounded-xl border p-4 text-sm">
              Tu acceso es de consulta. Un administrador del club debe completar
              estos pasos.
            </p>
          ) : null}
        </div>
      </section>

      {isInitialScreen ? (
        <aside className="grid content-start gap-4">
          <article className="brand-card-cut border-blue border-t-4 bg-white p-6 text-center">
            <span className="bg-blue/10 text-blue mx-auto grid h-11 w-11 place-items-center rounded-xl">
              <PaymentIcon name="wallet" />
            </span>
            <span className="text-blue mt-3 block font-mono text-[11px] font-bold tracking-[.16em] uppercase">
              Cómo funciona
            </span>
            <h3 className="font-display text-ink mt-2 text-[21px] font-black">
              Un pago, reparto automático
            </h3>
            <div className="mt-5 grid gap-4 text-[15px]">
              <SideStep
                icon="store"
                title="El cliente compra"
                detail="Paga todo junto con tarjeta, cuotas o QR."
              />
              <SideStep
                icon="wallet"
                title="Mobbex distribuye"
                detail="Separa la participación del club y la comisión de la tienda."
              />
              <SideStep
                icon="shield"
                title="Cada parte controla"
                detail="El club consulta sus operaciones desde su propia consola."
              />
            </div>
          </article>
          <article className="brand-card-cut bg-deep p-6 text-center text-white">
            <span className="bg-mint text-deep mx-auto grid h-11 w-11 place-items-center rounded-xl">
              <PaymentIcon name="lock" />
            </span>
            <span className="text-mint mt-3 block font-mono text-[11px] font-bold tracking-[.16em] uppercase">
              Seguridad
            </span>
            <p className="mt-3 text-[15px] leading-6 text-white/70">
              Nunca compartas contraseñas, PIN, API Key ni Access Token. El club
              solamente autoriza la aplicación desde Mobbex.
            </p>
          </article>
        </aside>
      ) : null}
    </div>
  );
}

function StatusDetails({
  data,
  canEdit,
  onEdit,
}: {
  data: PortalData;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const club = data.club;
  return (
    <div>
      <h3 className="font-display text-ink text-2xl font-black">
        Solicitud recibida
      </h3>
      <p className="text-muted mt-2 text-sm leading-6">
        Te avisaremos en este portal cuando la solicitud de acceso esté
        disponible para autorizar.
      </p>
      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <Info
          icon="building"
          label="Razón social"
          value={club.mobbexLegalName}
        />
        <Info icon="id" label="CUIT" value={formatTaxId(club.mobbexTaxId)} />
        <Info icon="store" label="Responsable" value={club.mobbexContactName} />
        <Info icon="send" label="Contacto" value={club.mobbexContactEmail} />
      </dl>
      {canEdit ? (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={onEdit}
            className="border-blue/25 text-blue hover:bg-blue/5 inline-flex items-center justify-center gap-2 rounded-xl border-2 bg-white px-5 py-3 text-sm font-bold transition"
          >
            <PaymentIcon name="file" />
            Corregir datos enviados
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: PaymentIconName;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-xl bg-[#f5f2f8] p-4 text-center">
      <span className="bg-mint/25 text-deep mx-auto grid h-10 w-10 place-items-center rounded-xl [&>svg]:h-5 [&>svg]:w-5">
        <PaymentIcon name={icon} />
      </span>
      <dt className="text-muted mt-3 text-[13px] font-bold tracking-[.08em] uppercase">
        {label}
      </dt>
      <dd className="text-ink mt-1 text-[17px] font-semibold break-words">
        {value ?? "—"}
      </dd>
    </div>
  );
}

function SideStep({
  icon,
  title,
  detail,
}: {
  icon: "wallet" | "store" | "shield";
  title: string;
  detail: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="bg-mint/25 text-deep grid h-9 w-9 shrink-0 place-items-center rounded-lg [&>svg]:h-4 [&>svg]:w-4">
        <PaymentIcon name={icon} />
      </span>
      <div>
        <strong className="text-ink block">{title}</strong>
        <p className="text-muted mt-0.5 leading-5">{detail}</p>
      </div>
    </div>
  );
}

function MobbexFieldGuide({ catalogUrl }: { catalogUrl: string }) {
  return (
    <section className="border-deep/10 mt-6 rounded-2xl border bg-white p-5 sm:p-6">
      <div className="text-center">
        <span className="bg-blue/10 text-blue mx-auto grid h-14 w-14 place-items-center rounded-2xl">
          <PaymentIcon name="file" />
        </span>
        <h4 className="text-ink mt-3 text-[22px] font-extrabold">
          Qué debe completar el club
        </h4>
        <p className="text-muted mx-auto mt-2 max-w-xl text-[17px] leading-7">
          Usá los datos fiscales reales de la institución. El club participa
          como vendedor dentro del marketplace de El Estampadero.
        </p>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <FieldGuideItem
          icon="building"
          label="Nombre o razón social"
          value="La denominación legal que figura en ARCA."
        />
        <FieldGuideItem
          icon="id"
          label="CUIT"
          value="El CUIT propio de la institución, sin usar el de la tienda."
        />
        <FieldGuideItem
          icon="file"
          label="Condición fiscal"
          value="La condición impositiva vigente del club."
        />
        <FieldGuideItem
          icon="store"
          label="Rubro"
          value="La actividad vinculada a los productos que comercializa."
        />
        <FieldGuideItem
          icon="globe"
          label="URL del sitio web"
          value="La página pública del club dentro de El Estampadero."
          note={catalogUrl}
        />
        <FieldGuideItem
          icon="check"
          label="¿Tiene e-commerce?"
          value="Sí. Las ventas se realizan mediante El Estampadero."
        />
      </dl>
    </section>
  );
}

function FieldGuideItem({
  icon,
  label,
  value,
  note,
}: {
  icon: PaymentIconName;
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-xl bg-[#f5f2f8] p-4 text-center">
      <span className="bg-mint/25 text-deep mx-auto grid h-11 w-11 place-items-center rounded-xl [&>svg]:h-5 [&>svg]:w-5">
        <PaymentIcon name={icon} />
      </span>
      <dt className="text-ink mt-3 text-[17px] font-extrabold">{label}</dt>
      <dd className="text-muted mt-1 text-[16px] leading-7">{value}</dd>
      {note ? (
        <code className="text-blue mt-3 block overflow-hidden rounded-lg bg-white px-3 py-2 text-[14px] font-semibold text-ellipsis">
          {note}
        </code>
      ) : null}
    </div>
  );
}

function RegistrationStep({
  icon,
  number,
  title,
  detail,
}: {
  icon: PaymentIconName;
  number: string;
  title: string;
  detail: string;
}) {
  return (
    <li className="rounded-xl bg-white p-4 text-center shadow-sm">
      <span className="bg-blue/10 text-blue mx-auto grid h-12 w-12 place-items-center rounded-xl [&>svg]:h-6 [&>svg]:w-6">
        <PaymentIcon name={icon} />
      </span>
      <strong className="text-ink mt-3 block text-[18px]">
        {number}. {title}
      </strong>
      <p className="text-muted mt-2 text-[16px] leading-7">{detail}</p>
    </li>
  );
}

function formatTaxId(value: string | null) {
  if (value?.length !== 11) return value ?? "—";
  return `${value.slice(0, 2)}-${value.slice(2, 10)}-${value.slice(10)}`;
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("es-AR") : "—";
}

function maskEntity(value: string | null) {
  if (!value) return "—";
  if (value.length <= 8) return value;
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}
