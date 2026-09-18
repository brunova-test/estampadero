"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  AdminAddButton,
  AdminPage,
  AdminPanel,
  ImageUploadField,
} from "elestampadero/shared/ui/admin";
import { api } from "elestampadero/trpc/react";

const CLUBS_PER_PAGE = 6;

export function AdminClubsListView() {
  const query = api.clubs.list.useQuery();
  const [page, setPage] = useState(1);
  const [showCreateClub, setShowCreateClub] = useState(false);
  const clubs = query.data ?? [];
  const totalPages = Math.max(1, Math.ceil(clubs.length / CLUBS_PER_PAGE));
  const visibleClubs = clubs.slice(
    (page - 1) * CLUBS_PER_PAGE,
    page * CLUBS_PER_PAGE,
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <AdminPage
      module="Módulo de Convenios"
      title="Socios y convenios"
      className="admin-clubs-page"
    >
      <AdminPanel className="admin-panel-pad admin-clubs-panel">
        <div className="admin-toolbar admin-clubs-toolbar">
          <h2 className="admin-panel-title">Clubes</h2>
          <AdminAddButton type="button" onClick={() => setShowCreateClub(true)}>
            Nuevo socio
          </AdminAddButton>
        </div>

        <div className="admin-clubs-list">
          {visibleClubs.map((club) => (
            <Link href={`/admin/clubes/${club.slug}`} key={club.id}>
              <span>
                <Image
                  src={club.logoUrl ?? "/images/linea-club.png"}
                  alt=""
                  fill
                  sizes="74px"
                />
              </span>
              <div>
                <h3>{club.name}</h3>
                <p>{club.sport ?? "Club asociado"}</p>
              </div>
              <small>
                {club.productCount} productos ·{" "}
                {club.mobbexOnboardingStatus === "ACTIVE"
                  ? "Mobbex activo"
                  : club.mobbexOnboardingStatus === "DETAILS_SUBMITTED"
                    ? "Vinculación por revisar"
                    : club.mobbexOnboardingStatus ===
                        "AUTHORIZATION_CONFIRMED"
                      ? "Mobbex por activar"
                      : "Mobbex pendiente"}
              </small>
              <strong
                className={`admin-chip ${
                  club.isActive ? "admin-chip--success" : "admin-chip--warning"
                }`}
              >
                {club.isActive ? "Activo" : "Inactivo"}
              </strong>
            </Link>
          ))}
        </div>

        <nav className="admin-clubs-pagination" aria-label="Páginas de clubes">
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
      {showCreateClub ? (
        <CreateClubModal
          onClose={() => setShowCreateClub(false)}
          onCreated={() => setPage(1)}
        />
      ) : null}
    </AdminPage>
  );
}

interface CreatedClubAccess {
  club: { id: string; name: string; slug: string };
  credentials: { email: string; password: string };
  portalPath: string;
}

function CreateClubModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const utils = api.useUtils();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [name, setName] = useState("");
  const [sport, setSport] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [adminName, setAdminName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"email" | "password" | "all" | null>(
    null,
  );
  const [result, setResult] = useState<CreatedClubAccess | null>(null);

  const createClub = api.clubs.create.useMutation({
    onSuccess: async (created) => {
      await utils.clubs.list.invalidate();
      setResult(created);
      onCreated();
    },
    onError: (mutationError) => setError(mutationError.message),
  });

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !createClub.isPending) onClose();
    };
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [createClub.isPending, onClose]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    createClub.mutate({
      name: name.trim(),
      sport: sport.trim() || undefined,
      description: description.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined,
      adminName: adminName.trim(),
      isActive,
    });
  }

  async function copyCredential(
    value: string,
    target: "email" | "password" | "all",
  ) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(target);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setError("No se pudo copiar. Seleccioná el dato manualmente.");
    }
  }

  if (typeof document === "undefined") return null;

  const normalizedLogoUrl = logoUrl.trim();
  const canPreviewLogo =
    normalizedLogoUrl.startsWith("/") ||
    /^https?:\/\/[^\s]+$/i.test(normalizedLogoUrl);

  return createPortal(
    <div className="admin-agreement-modal-backdrop">
      <section
        className="admin-agreement-modal admin-club-create-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-club-title"
      >
        <header>
          <div>
            <span>Socios y convenios</span>
            <h2 id="create-club-title">
              {result ? "Club creado" : "Nuevo socio"}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            disabled={createClub.isPending}
            aria-label="Cerrar"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        {result ? (
          <div className="admin-club-created">
            <span className="admin-club-created__icon" aria-hidden="true">
              ✓
            </span>
            <div>
              <span>Alta completada</span>
              <h3>{result.club.name}</h3>
              <p>
                Se creó el club, su administrador y el acceso al portal. La
                contraseña se muestra únicamente en esta pantalla.
              </p>
            </div>

            <dl className="admin-club-credentials">
              <div>
                <dt>Correo de acceso</dt>
                <dd>
                  <code>{result.credentials.email}</code>
                  <button
                    type="button"
                    onClick={() =>
                      void copyCredential(result.credentials.email, "email")
                    }
                  >
                    {copied === "email" ? "Copiado" : "Copiar"}
                  </button>
                </dd>
              </div>
              <div>
                <dt>Contraseña inicial</dt>
                <dd>
                  <code>{result.credentials.password}</code>
                  <button
                    type="button"
                    onClick={() =>
                      void copyCredential(
                        result.credentials.password,
                        "password",
                      )
                    }
                  >
                    {copied === "password" ? "Copiada" : "Copiar"}
                  </button>
                </dd>
              </div>
            </dl>

            <p className="admin-club-created__note">
              Este correo funciona como identificador de inicio de sesión. No
              crea una casilla de correo externa.
            </p>

            {error ? (
              <p className="admin-form-error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="admin-club-created__actions">
              <button
                type="button"
                onClick={() =>
                  void copyCredential(
                    `Correo: ${result.credentials.email}\nContraseña: ${result.credentials.password}\nPortal: ${window.location.origin}${result.portalPath}`,
                    "all",
                  )
                }
              >
                {copied === "all" ? "Datos copiados" : "Copiar todos los datos"}
              </button>
              <Link
                className="admin-btn admin-btn--primary"
                href={`/admin/clubes/${result.club.slug}`}
                onClick={() => {
                  document.body.style.removeProperty("overflow");
                  onClose();
                }}
              >
                Ver club
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="admin-agreement-form">
            <div className="admin-agreement-form__grid">
              <label>
                Nombre del club o institución
                <input
                  className="admin-input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  minLength={2}
                  maxLength={120}
                  autoFocus
                />
              </label>
              <label>
                Disciplina o actividad
                <input
                  className="admin-input"
                  value={sport}
                  onChange={(event) => setSport(event.target.value)}
                  placeholder="Fútbol, gimnasio, escuela…"
                  maxLength={100}
                />
              </label>
              <label>
                Responsable del acceso
                <input
                  className="admin-input"
                  value={adminName}
                  onChange={(event) => setAdminName(event.target.value)}
                  placeholder="Nombre y apellido"
                  required
                  minLength={2}
                  maxLength={120}
                />
              </label>
              <label className="is-wide">
                Descripción
                <textarea
                  className="admin-input admin-club-create-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  maxLength={1200}
                  placeholder="Información institucional, categorías, alcance del acuerdo…"
                />
              </label>
              <div className="is-wide admin-club-create-logo">
                <ImageUploadField
                  value={logoUrl}
                  onChange={setLogoUrl}
                  label="Logo del club"
                  placeholder="/images/club.png o https://..."
                />
                {canPreviewLogo ? (
                  <div className="admin-club-logo-preview">
                    <div className="admin-club-logo-preview__image">
                      {/* A native image also previews remote URLs without requiring
                          every club domain in Next.js image configuration. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={normalizedLogoUrl}
                        alt="Vista previa del logo del club"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div>
                      <strong>Vista previa</strong>
                      <p>Este será el logo visible para el club.</p>
                    </div>
                  </div>
                ) : null}
              </div>
              <label className="is-wide admin-club-create-status">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                />
                Crear el club activo y habilitar el acceso al portal
              </label>
            </div>

            <div className="admin-club-create-access-note">
              <strong>Credenciales automáticas</strong>
              <p>
                Al confirmar se generarán un correo de acceso único y una
                contraseña segura para el administrador del club.
              </p>
            </div>

            {error ? (
              <p className="admin-form-error" role="alert">
                {error}
              </p>
            ) : null}

            <footer>
              <button
                type="button"
                onClick={onClose}
                disabled={createClub.isPending}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="admin-btn admin-btn--primary"
                disabled={createClub.isPending}
              >
                {createClub.isPending ? "Creando club…" : "Crear club y acceso"}
              </button>
            </footer>
          </form>
        )}
      </section>
    </div>,
    document.body,
  );
}
