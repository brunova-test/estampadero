"use client";

import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useState } from "react";

import {
  AdminPage,
  AdminPanel,
  ImageUploadField,
} from "elestampadero/shared/ui/admin";
import { api } from "elestampadero/trpc/react";

function DesignActionIcon({ kind }: { kind: "add" | "send" | "link" }) {
  return (
    <svg
      aria-hidden="true"
      className="admin-design-button-icon"
      viewBox="0 0 24 24"
      fill="none"
    >
      {kind === "add" ? (
        <path d="M12 5v14M5 12h14" />
      ) : kind === "send" ? (
        <path d="M7 17 17 7M8 7h9v9" />
      ) : (
        <>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </>
      )}
    </svg>
  );
}

function DesignDetailIcon({
  kind,
}: {
  kind:
    | "send"
    | "info"
    | "check"
    | "person"
    | "calendar"
    | "note"
    | "chat"
    | "external"
    | "chevron";
}) {
  const paths = {
    send: <path d="m3 11 18-8-8 18-2.8-7.2L3 11Zm7.2 2.8L21 3" />,
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6m0-10h.01" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    person: (
      <>
        <circle cx="12" cy="8" r="3" />
        <path d="M6 20c.5-4 2.5-6 6-6s5.5 2 6 6" />
      </>
    ),
    calendar: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4m8-4v4M4 10h16" />
      </>
    ),
    note: (
      <>
        <path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" />
      </>
    ),
    chat: <path d="M21 12a8 8 0 0 1-8 8H6l-3 2 1-5a8 8 0 1 1 17-5Z" />,
    external: (
      <>
        <path d="M14 4h6v6M20 4l-9 9" />
        <path d="M18 13v6H5V6h6" />
      </>
    ),
    chevron: <path d="m7 10 5 5 5-5" />,
  };
  return (
    <svg
      className="admin-design-detail-icon"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
    >
      {paths[kind]}
    </svg>
  );
}

const DESIGN_STATUS_LABELS: Record<string, string> = {
  PENDING_SEND: "Sin enviar al club",
  SENT_TO_CLUB: "Enviado al club",
  CHANGES_REQUESTED: "Cambios solicitados",
  APPROVED: "Aprobado",
};

export function AdminDesignDetailView({
  designId,
  versionId,
}: {
  designId: string;
  versionId?: string;
}) {
  const utils = api.useUtils();
  const designQuery = api.designs.byId.useQuery({ id: designId });
  const [newVersionUrl, setNewVersionUrl] = useState("");
  const [newVersionTitle, setNewVersionTitle] = useState("");
  const [newVersionDescription, setNewVersionDescription] = useState("");
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionToEdit, setVersionToEdit] = useState<{
    id: string;
    versionNumber: number;
    imageUrl: string;
  } | null>(null);
  const [editedVersionUrl, setEditedVersionUrl] = useState("");
  const [editVersionComment, setEditVersionComment] = useState("");
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(
    null,
  );
  const [showAllVersionDetails, setShowAllVersionDetails] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comment, setComment] = useState("");
  const [feedback, setFeedback] = useState("");
  const addVersion = api.designs.addVersion.useMutation({
    onSuccess: async () => {
      setNewVersionUrl("");
      setNewVersionTitle("");
      setNewVersionDescription("");
      setShowVersionModal(false);
      await utils.designs.byId.invalidate({ id: designId });
    },
  });
  const updateVersion = api.designs.updateVersion.useMutation({
    onSuccess: async () => {
      setEditedVersionUrl("");
      setEditVersionComment("");
      setVersionToEdit(null);
      setFeedback("Los cambios se guardaron sobre la misma versión.");
      await utils.designs.byId.invalidate({ id: designId });
    },
  });
  const sendToClub = api.designs.sendToClub.useMutation({
    onSuccess: async () => {
      setFeedback("La propuesta fue enviada al club.");
      await utils.designs.byId.invalidate({ id: designId });
    },
  });
  const addComment = api.designs.addComment.useMutation({
    onSuccess: async () => {
      setComment("");
      setShowCommentInput(false);
      setFeedback("La respuesta quedó registrada.");
      await utils.designs.byId.invalidate({ id: designId });
    },
  });
  const design = designQuery.data;
  if (designQuery.isLoading)
    return <div className="admin-empty">Cargando...</div>;
  if (!design) return <div className="admin-empty">Diseño no encontrado.</div>;
  const latest = design.versions.at(-1);
  const routeVersion = versionId
    ? design.versions.find((version) => version.id === versionId)
    : null;
  const reversedVersions = design.versions.slice().reverse();
  const openVersionId = expandedVersionId ?? latest?.id ?? null;
  const desiredStatus = activeStatus ?? routeVersion?.status ?? design.status;
  const selectedVersion =
    routeVersion ??
    reversedVersions.find((version) => version.status === desiredStatus) ??
    null;
  const displayVersion = selectedVersion ?? latest;
  const selectedStatus = activeStatus ?? selectedVersion?.status ?? design.status;
  const isPendingSend = selectedStatus === "PENDING_SEND";
  const approvalStatus = selectedVersion?.status ?? "SENT_TO_CLUB";
  const counterpartyComments = design.comments.filter(
    (item) =>
      item.versionId === selectedVersion?.id &&
      ["CLUB_ADMIN", "CLUB_VIEWER", "CUSTOMER"].includes(item.authorRole),
  );
  const approvalIcon: "send" | "info" | "check" =
    approvalStatus === "APPROVED"
      ? "check"
      : approvalStatus === "CHANGES_REQUESTED"
        ? "info"
        : "send";
  const selectedStatusContent: Record<
    string,
    { icon: "send" | "info" | "check"; description: string }
  > = {
    PENDING_SEND: {
      icon: "info",
      description:
        "Esta versión todavía no fue enviada. Para que el club pueda verla, revisala y tocá “Enviar al club”.",
    },
    SENT_TO_CLUB: {
      icon: "send",
      description: `La versión v${selectedVersion?.versionNumber ?? design.latestVersionNumber} fue enviada a ${design.clubName} y está esperando su revisión.`,
    },
    CHANGES_REQUESTED: {
      icon: "info",
      description: counterpartyComments.length
        ? "Estos son los mensajes recibidos sobre esta versión."
        : "No hay mensajes ni cambios solicitados sobre esta versión.",
    },
    APPROVED: {
      icon: approvalIcon,
      description:
        selectedVersion?.status === "APPROVED"
          ? `El club aprobó la versión v${selectedVersion.versionNumber}.`
          : selectedVersion?.status === "CHANGES_REQUESTED"
            ? "El club no aprobó esta versión y solicitó cambios."
            : "El club todavía no respondió sobre esta versión.",
    },
  };
  const activeStatusContent = selectedStatusContent[selectedStatus];
  return (
    <AdminPage
      module="Módulo 9 · Diseños"
      title="Propuestas y aprobación de diseños"
      className="admin-design-detail-page"
    >
      <Link className="admin-back-button" href={`/admin/disenos/${design.id}`}>
        Volver a versiones
      </Link>
      <div
        className="admin-design-steps"
        role="tablist"
        aria-label="Estado de la propuesta"
      >
        {[
          ["SENT_TO_CLUB", "send", "Enviado al club"],
          ["CHANGES_REQUESTED", "info", "Cambios solicitados"],
          ["APPROVED", "check", "Aprobado"],
        ].map(([status, icon, label]) => (
          <button
            type="button"
            key={status}
            className={
              selectedStatus === status
                ? `active is-${status.toLowerCase()}`
                : ""
            }
            role="tab"
            aria-selected={selectedStatus === status}
            onClick={() => setActiveStatus(status ?? null)}
          >
            <DesignDetailIcon kind={icon as "send" | "info" | "check"} />
            {label}
          </button>
        ))}
      </div>
      <div className="admin-design-grid">
        <section className="admin-design-main">
          <div className="admin-design-title">
            <div>
              <span>
                DIS-{design.id.slice(-4).toUpperCase()} · {design.clubName}
              </span>
              <h2>{design.title}</h2>
            </div>
            <small>
              Versión{" "}
              {selectedVersion?.versionNumber ?? design.latestVersionNumber}
            </small>
          </div>
          {activeStatusContent ? (
            <div
              className={`admin-design-status-view is-${selectedStatus.toLowerCase()}${
                selectedStatus === "APPROVED"
                  ? ` is-approval-${approvalStatus.toLowerCase()}`
                  : ""
              }`}
              role="tabpanel"
              aria-live="polite"
            >
              <span className="admin-design-status-view__icon">
                <DesignDetailIcon kind={activeStatusContent.icon} />
              </span>
              <div>
                <strong>
                  {selectedStatus === "APPROVED"
                    ? "Estado de aprobación"
                    : DESIGN_STATUS_LABELS[selectedStatus]}
                </strong>
                <p>{activeStatusContent.description}</p>
                {selectedStatus === "CHANGES_REQUESTED" &&
                counterpartyComments.length ? (
                  <ul className="admin-design-status-messages">
                    {counterpartyComments.map((item) => (
                      <li key={item.id}>
                        <strong>{item.authorName}</strong>
                        <span>{item.message}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          ) : null}
          {selectedStatus === "CHANGES_REQUESTED" && selectedVersion ? (
            <div className="admin-design-actions">
              <button
                type="button"
                className="admin-btn admin-design-action"
                onClick={() => {
                  setEditedVersionUrl("");
                  setEditVersionComment("");
                  setVersionToEdit({
                    id: selectedVersion.id,
                    versionNumber: selectedVersion.versionNumber,
                    imageUrl: selectedVersion.imageUrl,
                  });
                }}
              >
                <DesignActionIcon kind="add" />
                Cargar mejoras de esta versión
              </button>
            </div>
          ) : null}
          {(isPendingSend || selectedStatus === "SENT_TO_CLUB") && displayVersion ? (
            <div className="admin-design-image">
              <Image
                key={displayVersion.id}
                src={displayVersion.imageUrl}
                alt={`${design.title}, versión ${displayVersion.versionNumber}`}
                fill
                sizes="700px"
              />
            </div>
          ) : null}
          {isPendingSend ? (
            <div className="admin-design-actions">
              {design.clubId ? (
                <>
                  <p className="admin-design-send-notice">
                    Revisá la versión antes de continuar. Al confirmar, esta
                    propuesta se enviará al club para su revisión.
                  </p>
                  <button
                    type="button"
                    className="admin-btn admin-design-action"
                    disabled={sendToClub.isPending}
                    onClick={() => {
                      if (
                        !window.confirm(
                          "¿Confirmás que querés enviar esta versión al club para su revisión?",
                        )
                      ) {
                        return;
                      }
                      sendToClub.mutate({ designId });
                    }}
                  >
                    <DesignActionIcon kind="send" />
                    {sendToClub.isPending ? "Enviando…" : "Enviar al club"}
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
          {feedback ? (
            <p className="admin-design-feedback" role="status">
              {feedback}
            </p>
          ) : null}
        </section>
        <aside className="admin-design-side">
          <section className="admin-design-versions-card">
            <h3>Versiones enviadas</h3>
            <div className="admin-design-version-list">
              {reversedVersions.map((version, index) => {
                const isOpen =
                  showAllVersionDetails || openVersionId === version.id;
                const versionStatus = version.status;
                return (
                  <article
                    className={`admin-design-version-item ${isOpen ? "is-open" : ""}`}
                    key={version.id}
                  >
                    <button
                      type="button"
                      className="admin-design-version-summary"
                      aria-expanded={isOpen}
                      onClick={() => {
                        setShowAllVersionDetails(false);
                        setExpandedVersionId(isOpen ? "" : version.id);
                      }}
                    >
                      {isPendingSend || selectedStatus === "SENT_TO_CLUB" ? (
                        <Image
                          src={version.imageUrl}
                          alt=""
                          width={96}
                          height={64}
                        />
                      ) : (
                        <span aria-hidden="true" className="admin-design-version-placeholder" />
                      )}
                      <span className="admin-design-version-copy">
                        <strong>v{version.versionNumber}</strong>
                        <span>{design.clubName}</span>
                        <small>
                          {new Date(version.createdAt).toLocaleDateString(
                            "es-AR",
                          )}
                        </small>
                      </span>
                      <span
                        className={`admin-design-version-status is-${versionStatus.toLowerCase()}`}
                      >
                        {DESIGN_STATUS_LABELS[versionStatus]}
                      </span>
                      <span
                        className="admin-design-version-chevron"
                        aria-hidden="true"
                      >
                        <DesignDetailIcon kind="chevron" />
                      </span>
                    </button>
                    {isOpen ? (
                      <div className="admin-design-version-details">
                        <span>
                          <DesignDetailIcon kind="person" /> Enviado por{" "}
                          <b>Administración</b>
                        </span>
                        <span>
                          <DesignDetailIcon kind="calendar" /> Fecha de envío{" "}
                          <b>
                            {new Date(version.createdAt).toLocaleString(
                              "es-AR",
                              { dateStyle: "short", timeStyle: "short" },
                            )}
                          </b>
                        </span>
                        <span>
                          <DesignDetailIcon kind="note" /> Notas{" "}
                          <b>
                            {version.description ?? version.changeNote ??
                              (index === 0
                                ? "Última propuesta enviada para revisión."
                                : "Versión anterior de la propuesta.")}
                          </b>
                        </span>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
            <button
              type="button"
              className="admin-design-all-versions"
              onClick={() => setShowAllVersionDetails((visible) => !visible)}
            >
              <DesignDetailIcon kind="external" /> Ver todas las versiones
            </button>
          </section>
          {selectedStatus === "CHANGES_REQUESTED" ? (
            <section className="admin-design-comments-card">
            <h3>Mensajes {design.clubId ? "del club" : "del cliente"}</h3>
            {counterpartyComments.length ? (
              counterpartyComments.map((comment) => (
                <article className="admin-comment" key={comment.id}>
                  <strong>
                    {comment.authorName} ·{" "}
                    {new Date(comment.createdAt).toLocaleDateString("es-AR")}
                  </strong>
                  <p>{comment.message}</p>
                </article>
              ))
            ) : (
              <article className="admin-comment">
                <strong>
                  {design.clubId ? "Club" : "Cliente"} · pendiente
                </strong>
                <p>Sin observaciones todavía.</p>
              </article>
            )}
            </section>
          ) : null}
        </aside>
      </div>
      {showVersionModal
        ? createPortal(
            <div className="admin-agreement-modal-backdrop">
              <section
                className="admin-agreement-modal admin-design-version-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-design-version-title"
              >
                <header>
                  <div>
                    <span>Módulo de Diseños</span>
                    <h2 id="admin-design-version-title">
                      Cargar nueva versión
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowVersionModal(false)}
                    aria-label="Cerrar"
                  >
                    ×
                  </button>
                </header>
                <div className="admin-design-version-form">
                  <p>Subí una nueva imagen para actualizar esta propuesta.</p>
                  {latest ? (
                    <div className="admin-design-current-version">
                      <Image
                        src={latest.imageUrl}
                        alt=""
                        width={82}
                        height={64}
                      />
                      <span>
                        Diseño: <strong>{design.title}</strong> · Versión
                        actual: <b>v{latest.versionNumber}</b>
                      </span>
                    </div>
                  ) : null}
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
                      onClick={() => setShowVersionModal(false)}
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
                      {addVersion.isPending
                        ? "Subiendo…"
                        : "Subir nueva versión"}
                    </button>
                  </footer>
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}
      {versionToEdit
        ? createPortal(
            <div className="admin-agreement-modal-backdrop">
              <section
                className="admin-agreement-modal admin-design-version-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-design-edit-version-title"
              >
                <header>
                  <div>
                    <span>Módulo de Diseños</span>
                    <h2 id="admin-design-edit-version-title">
                      Realizar cambios sobre v{versionToEdit.versionNumber}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVersionToEdit(null)}
                    aria-label="Cerrar"
                  >
                    ×
                  </button>
                </header>
                <div className="admin-design-version-form">
                  <p>
                    Reemplazá la imagen manteniendo esta misma versión. Después
                    podrás volver a enviarla para revisión.
                  </p>
                  <div className="admin-design-current-version">
                    <Image
                      src={versionToEdit.imageUrl}
                      alt=""
                      width={82}
                      height={64}
                    />
                    <span>
                      Diseño: <strong>{design.title}</strong> · Editando:
                      <b> v{versionToEdit.versionNumber}</b>
                    </span>
                  </div>
                  <ImageUploadField
                    label=""
                    value={editedVersionUrl}
                    onChange={setEditedVersionUrl}
                    showUrlInput={false}
                    uploadLabel="Seleccioná la imagen corregida"
                  />
                  <label className="admin-design-change-comment">
                    <span>Comentario sobre los cambios realizados</span>
                    <textarea
                      placeholder="Ej. Actualizamos el escudo y corregimos la ubicación del sponsor."
                      value={editVersionComment}
                      onChange={(event) =>
                        setEditVersionComment(event.target.value)
                      }
                      maxLength={500}
                    />
                    <small>{editVersionComment.length}/500</small>
                  </label>
                  <footer>
                    <button
                      type="button"
                      className="admin-btn"
                      onClick={() => setVersionToEdit(null)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn--primary"
                      disabled={
                        !editedVersionUrl ||
                        editVersionComment.trim().length < 3 ||
                        updateVersion.isPending
                      }
                      onClick={() =>
                        updateVersion.mutate({
                          designId,
                          versionId: versionToEdit.id,
                          imageUrl: editedVersionUrl,
                          changeNote: editVersionComment,
                        })
                      }
                    >
                      {updateVersion.isPending
                        ? "Guardando…"
                        : "Guardar cambios"}
                    </button>
                  </footer>
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}
    </AdminPage>
  );
}

export function AdminDesignProductsView({ designId }: { designId: string }) {
  const utils = api.useUtils();
  const designQuery = api.designs.byId.useQuery({ id: designId });
  const design = designQuery.data;
  const agreementsQuery = api.agreements.listByClub.useQuery(
    { clubId: design?.clubId ?? "" },
    { enabled: !!design?.clubId },
  );
  const activeAgreement = agreementsQuery.data?.find(
    (agreement) => agreement.status === "ACTIVE",
  );
  const agreementDetailQuery = api.agreements.byId.useQuery(
    { id: activeAgreement?.id ?? "" },
    { enabled: !!activeAgreement },
  );
  const productsQuery = api.catalog.list.useQuery(
    { ...(design?.clubSlug ? { clubSlug: design.clubSlug } : {}) },
    { enabled: !!design },
  );
  const link = api.designs.linkProduct.useMutation({
    onSuccess: () => utils.designs.byId.invalidate({ id: designId }),
  });
  const unlink = api.designs.unlinkProduct.useMutation({
    onSuccess: () => utils.designs.byId.invalidate({ id: designId }),
  });
  if (!design) return <div className="admin-empty">Cargando...</div>;
  const latest = design.versions.at(-1);
  const linked = new Set(design.linkedProducts.map((item) => item.productId));
  return (
    <AdminPage
      module="Módulo de Diseños"
      title="Diseño vinculado a productos"
      description="Un diseño aprobado puede vincularse a varios productos; sus ventas se asocian al convenio."
    >
      <AdminPanel className="admin-panel-pad">
        <div className="admin-toolbar admin-linked-heading">
          <div>
            <span>
                DIS-{design.id.slice(-4).toUpperCase()} · {design.clubName}
                {latest?.status === "APPROVED" ? " · Aprobado" : " · En revisión"}
            </span>
            <h2 className="admin-panel-title">{design.title}</h2>
          </div>
          <Link
            className="admin-btn admin-btn--primary"
            href="/admin/productos"
          >
            Publicar como producto
          </Link>
        </div>
        <div className="admin-linked-grid">
          <aside>
            <h3>
              Diseño {latest?.status === "APPROVED" ? "aprobado" : "en revisión"} ·
              v{design.latestVersionNumber}
            </h3>
            {latest ? (
              <div className="admin-linked-image">
                <Image src={latest.imageUrl} alt="" fill sizes="320px" />
              </div>
            ) : null}
            <div className="admin-linked-convention">
              <strong>Convenio relacionado</strong>
              {activeAgreement ? (
                <span>
                  {activeAgreement.code} · {activeAgreement.title}
                </span>
              ) : (
                <span>Sin convenio activo configurado</span>
              )}
            </div>
          </aside>
          <section>
            <div className="admin-toolbar">
              <h3>Productos vinculados</h3>
              <span className="admin-link">Agregar producto</span>
            </div>
            <input
              className="admin-input"
              placeholder="Buscar producto por nombre o código"
            />{" "}
            <div className="admin-linked-list">
              {productsQuery.data?.map((product) => {
                const isLinked = linked.has(product.id);
                return (
                  <article
                    key={product.id}
                    className={isLinked ? "linked" : ""}
                  >
                    <span className="admin-product-thumb">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt=""
                          fill
                          sizes="40px"
                        />
                      ) : null}
                    </span>
                    <div>
                      <strong>{product.name}</strong>
                      <small>
                        {product.code} · {agreementDetailQuery.data?.productRates.find(
                          (rate) => rate.productId === product.id,
                        )?.percentage ?? agreementDetailQuery.data?.basePercentage ?? 0}% de participación
                      </small>
                    </div>
                    <button
                      onClick={() =>
                        isLinked
                          ? unlink.mutate({ designId, productId: product.id })
                          : link.mutate({ designId, productId: product.id })
                      }
                    >
                      {isLinked ? "Quitar" : "Vincular"}
                    </button>
                  </article>
                );
              })}
            </div>
            <div className="admin-linked-note">
              <strong>Desde el vínculo</strong>
              <span>
                Cada venta de estos productos queda asociada al convenio y suma
                participación al club automáticamente.
              </span>
            </div>
          </section>
        </div>
      </AdminPanel>
    </AdminPage>
  );
}
