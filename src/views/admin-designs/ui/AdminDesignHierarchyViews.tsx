"use client";

import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useState } from "react";

import {
  AdminAddButton,
  AdminPage,
  AdminPanel,
  ImageUploadField,
} from "elestampadero/shared/ui/admin";
import { ModernSpinner } from "elestampadero/shared/ui/motion";
import { api } from "elestampadero/trpc/react";
import { useAdminNavigation } from "elestampadero/shared/ui/admin/AdminNavigationContext";

const STATUS_LABELS: Record<string, string> = {
  PENDING_SEND: "Sin enviar al club",
  SENT_TO_CLUB: "Enviado al club",
  CHANGES_REQUESTED: "Cambios solicitados",
  APPROVED: "Aprobado",
};

const STATUS_CLASSES: Record<string, string> = {
  PENDING_SEND: "admin-chip--warning",
  SENT_TO_CLUB: "admin-chip--info",
  CHANGES_REQUESTED: "admin-chip--danger",
  APPROVED: "admin-chip--success",
};

function DesignStatusIcon({ status }: { status: string }) {
  return (
    <svg
      className="admin-design-status-icon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      {status === "APPROVED" ? (
        <path d="m5 12 4 4L19 6" />
      ) : status === "CHANGES_REQUESTED" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5m0 3h.01" />
        </>
      ) : status === "PENDING_SEND" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5m0 3h.01" />
        </>
      ) : (
        <path d="m4 12 16-8-5 16-3-6-8-2Zm8 2 8-10" />
      )}
    </svg>
  );
}

export function AdminClubDesignsView({ clubId }: { clubId: string }) {
  const { navigate } = useAdminNavigation();
  const utils = api.useUtils();
  const clubs = api.clubs.list.useQuery();
  const designs = api.designs.listByClub.useQuery({ clubId });
  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const clubName =
    clubs.data?.find((club) => club.id === clubId)?.name ?? "Club";
  const createDesign = api.designs.create.useMutation({
    onSuccess: async () => {
      setShowCreateModal(false);
      setTitle("");
      setImageUrl("");
      setImageUrls([]);
      await Promise.all([
        utils.designs.listByClub.invalidate({ clubId }),
        utils.designs.listAll.invalidate(),
      ]);
    },
  });

  return (
    <AdminPage
      module="Módulo 9 · Diseños"
      title={`Diseños de ${clubName}`}
      className="admin-designs-page admin-design-hierarchy-page"
    >
      <Link className="admin-back-button" href="/admin/disenos">
        Volver a clubes y clientes
      </Link>
      <AdminPanel className="admin-panel-pad">
        <div className="admin-design-hierarchy-heading">
          <div>
            <span>INDUMENTARIAS Y PROPUESTAS</span>
            <h2>{clubName}</h2>
          </div>
          <div className="admin-design-hierarchy-actions">
            <strong>{designs.data?.length ?? 0} diseños</strong>
            <AdminAddButton
              type="button"
              onClick={() => setShowCreateModal(true)}
            >
              Nuevo diseño
            </AdminAddButton>
          </div>
        </div>
        <div className="admin-design-product-list">
          {designs.isLoading ? (
            <div className="admin-design-hierarchy-loading">
                  <ModernSpinner label="Cargando..." />
            </div>
          ) : designs.data?.length ? (
            designs.data.map((design) => (
              <article
                key={design.id}
                tabIndex={0}
                className="admin-design-product-item"
                onClick={() => {
                  setNavigatingId(design.id);
                  navigate(`/admin/disenos/${design.id}`, "Versiones");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setNavigatingId(design.id);
                    navigate(`/admin/disenos/${design.id}`, "Versiones");
                  }
                }}
              >
                <div>
                  <span>DISEÑO · {clubName}</span>
                  <h3>{design.title}</h3>
                  <small>
                    {design.latestVersionNumber}{" "}
                    {design.latestVersionNumber === 1 ? "versión" : "versiones"}
                  </small>
                </div>
                {navigatingId === design.id ? (
                  <ModernSpinner label="Cargando..." />
                ) : (
                  <>
                    <span
                      className={`admin-chip ${STATUS_CLASSES[design.status] ?? "admin-chip--warning"}`}
                    >
                      {STATUS_LABELS[design.status] ?? design.status}
                    </span>
                    <span
                      className="admin-design-item-arrow"
                      aria-hidden="true"
                    >
                      ›
                    </span>
                  </>
                )}
              </article>
            ))
          ) : (
            <div className="admin-empty">
              Este club todavía no tiene diseños.
            </div>
          )}
        </div>
      </AdminPanel>
      {showCreateModal
        ? createPortal(
            <div className="admin-agreement-modal-backdrop">
              <section
                className="admin-agreement-modal admin-design-create-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-club-design-create-title"
              >
                <header>
                  <div>
                    <span>{clubName}</span>
                    <h2 id="admin-club-design-create-title">Crear diseño</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    aria-label="Cerrar"
                  >
                    ×
                  </button>
                </header>
                <form
                  className="admin-design-create-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!title.trim() || !imageUrl || createDesign.isPending)
                      return;
                    createDesign.mutate({ clubId, title, imageUrl, imageUrls });
                  }}
                >
                  <div className="admin-design-fixed-destination">
                    <span>Club seleccionado</span>
                    <strong>{clubName}</strong>
                  </div>
                  <label className="admin-design-create-field">
                    <span>Título del diseño</span>
                    <input
                      className="admin-input admin-design-title-input"
                      placeholder="Ej. Camiseta titular 2027"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                    />
                  </label>
                  <ImageUploadField
                    label="Imagen inicial del diseño"
                    value={imageUrl}
                    multiple
                    onChange={(url) => {
                      setImageUrl(url);
                      setImageUrls(url ? [url] : []);
                    }}
                    onMultipleChange={(urls) => {
                      setImageUrls(urls);
                      setImageUrl(urls[0] ?? "");
                    }}
                    uploadLabel="Seleccioná o arrastrá una o varias imágenes"
                  />
                  <footer>
                    <button
                      type="button"
                      className="admin-btn"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="admin-btn admin-btn--primary"
                      disabled={
                        !title.trim() || !imageUrl || createDesign.isPending
                      }
                    >
                      {createDesign.isPending ? "Creando…" : "Crear diseño"}
                    </button>
                  </footer>
                </form>
              </section>
            </div>,
            document.body,
          )
        : null}
    </AdminPage>
  );
}

export function AdminDesignVersionsView({ designId }: { designId: string }) {
  const { navigate } = useAdminNavigation();
  const designQuery = api.designs.byId.useQuery({ id: designId });
  const [navigatingVersionId, setNavigatingVersionId] = useState<string | null>(
    null,
  );
  const [showNewVersionModal, setShowNewVersionModal] = useState(false);
  const [newVersionUrl, setNewVersionUrl] = useState("");
  const [newVersionTitle, setNewVersionTitle] = useState("");
  const [newVersionDescription, setNewVersionDescription] = useState("");
  const utils = api.useUtils();
  const addVersion = api.designs.addVersion.useMutation({
    onSuccess: async () => {
      setNewVersionUrl("");
      setNewVersionTitle("");
      setNewVersionDescription("");
      setShowNewVersionModal(false);
      await utils.designs.byId.invalidate({ id: designId });
    },
  });
  const design = designQuery.data;

  if (designQuery.isLoading) {
    return <div className="admin-empty">Cargando...</div>;
  }
  if (!design) return <div className="admin-empty">Diseño no encontrado.</div>;

  const backHref = design.clubId
    ? `/admin/disenos/club/${design.clubId}`
    : "/admin/disenos";

  return (
    <AdminPage
      module="Módulo 9 · Diseños"
      title={design.title}
      className="admin-designs-page admin-design-hierarchy-page"
    >
      <Link className="admin-back-button" href={backHref}>
        Volver a diseños
      </Link>
      <AdminPanel className="admin-panel-pad">
        <div className="admin-design-hierarchy-heading">
          <div>
            <span>{design.clubName}</span>
            <h2>Versiones del diseño</h2>
          </div>
          <div className="admin-design-hierarchy-actions">
            <strong>{design.versions.length} versiones</strong>
            <AdminAddButton
              type="button"
              onClick={() => setShowNewVersionModal(true)}
            >
              Nueva versión
            </AdminAddButton>
          </div>
        </div>
        <div className="admin-design-version-gallery">
          {design.versions
            .slice()
            .reverse()
            .map((version) => (
              <article
                key={version.id}
                tabIndex={0}
                className="admin-design-version-gallery-item"
                onClick={() => {
                  setNavigatingVersionId(version.id);
                  navigate(
                    `/admin/disenos/${design.id}/versiones/${version.id}`,
                    `Versión ${version.versionNumber}`,
                  );
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setNavigatingVersionId(version.id);
                    navigate(
                      `/admin/disenos/${design.id}/versiones/${version.id}`,
                      `Versión ${version.versionNumber}`,
                    );
                  }
                }}
              >
                <div className="admin-design-version-gallery-image">
                  <Image
                    src={version.imageUrl}
                    alt={`${design.title}, versión ${version.versionNumber}`}
                    fill
                    sizes="(max-width: 700px) 100vw, 320px"
                  />
                </div>
                <div className="admin-design-version-gallery-copy">
                  <div>
                    <strong>
                      Versión {version.versionNumber}
                      {version.title ? ` · ${version.title}` : ""}
                    </strong>
                    <small>
                      {new Date(version.updatedAt).toLocaleDateString("es-AR")}
                    </small>
                  </div>
                  {navigatingVersionId === version.id ? (
                    <ModernSpinner label="Cargando..." />
                  ) : (
                    <span
                      className={`admin-chip ${STATUS_CLASSES[version.status] ?? "admin-chip--warning"}`}
                    >
                      <DesignStatusIcon status={version.status} />
                      {STATUS_LABELS[version.status] ?? version.status}
                    </span>
                  )}
                </div>
                {version.description || version.changeNote ? (
                  <p>{version.description ?? version.changeNote}</p>
                ) : null}
                <button type="button">Ver detalle de la versión</button>
              </article>
            ))}
        </div>
      </AdminPanel>
      {showNewVersionModal ? (
        <div className="admin-agreement-modal-backdrop">
          <section
            className="admin-agreement-modal admin-design-version-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-design-new-version-title"
          >
            <header>
              <div>
                <span>Módulo 9 · Diseños</span>
                <h2 id="admin-design-new-version-title">Nueva versión</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowNewVersionModal(false)}
                aria-label="Cerrar"
              >
                ×
              </button>
            </header>
            <div className="admin-design-version-form">
              <p>Cargá una nueva versión para este diseño.</p>
                  <label className="admin-design-create-field">
                    <span>Título de la versión</span>
                    <input
                      className="admin-input"
                      placeholder="Ej. Ajuste de escudo y sponsor"
                      value={newVersionTitle}
                      onChange={(event) => setNewVersionTitle(event.target.value)}
                    />
                  </label>
                  <label className="admin-design-create-field">
                    <span>Descripción de los cambios</span>
                    <textarea
                      className="admin-input"
                      placeholder="Describí las mejoras de esta versión"
                      value={newVersionDescription}
                      onChange={(event) =>
                        setNewVersionDescription(event.target.value)
                      }
                      rows={4}
                    />
                  </label>
                  <ImageUploadField
                label=""
                value={newVersionUrl}
                onChange={setNewVersionUrl}
                showUrlInput={false}
                uploadLabel="Arrastrá y soltá una imagen aquí"
              />
              <footer>
                <button
                  type="button"
                  className="admin-btn"
                  onClick={() => setShowNewVersionModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--primary"
                  disabled={
                    !newVersionUrl ||
                    newVersionTitle.trim().length < 3 ||
                    newVersionDescription.trim().length < 3 ||
                    addVersion.isPending
                  }
                  onClick={() =>
                    addVersion.mutate({
                      designId,
                      imageUrl: newVersionUrl,
                      title: newVersionTitle.trim(),
                      description: newVersionDescription.trim(),
                    })
                  }
                >
                  {addVersion.isPending ? "Cargando..." : "Crear versión"}
                </button>
              </footer>
            </div>
          </section>
        </div>
      ) : null}
    </AdminPage>
  );
}
