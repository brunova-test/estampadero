"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  AdminAddButton,
  AdminPage,
  AdminPanel,
  ImageUploadField,
} from "elestampadero/shared/ui/admin";
import { ModernSpinner } from "elestampadero/shared/ui/motion";
import { api } from "elestampadero/trpc/react";

const TABS = [
  ["HERO", "Hero principal", "✦"],
  ["CAMPAIGN", "Carrusel campaña", "▣"],
  ["ACCESS", "Accesos", "↗"],
  ["PROMOTION", "Promociones", "%"],
] as const;

const STATUS_LABEL: Record<string, string> = {
  VISIBLE: "Visible",
  SCHEDULED: "Programada",
  HIDDEN: "Oculta",
};

const SECTION_LABEL: Record<(typeof TABS)[number][0], string> = {
  HERO: "Hero principal",
  CAMPAIGN: "Carrusel de campaña",
  ACCESS: "Accesos directos",
  PROMOTION: "Promociones",
};

type EditorState = {
  id: string;
  code: string;
  title: string;
  eyebrow: string;
  description: string;
  desktopImageUrl: string;
  mobileImageUrl: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  tags: string;
  status: "VISIBLE" | "SCHEDULED" | "HIDDEN";
  startsAt: string;
  endsAt: string;
};

function toEditor(piece: {
  id: string;
  code: string;
  title: string;
  eyebrow: string;
  description: string;
  desktopImageUrl: string;
  mobileImageUrl: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel: string | null;
  secondaryCtaHref: string | null;
  tags: string[];
  status: string;
  startsAt: Date | null;
  endsAt: Date | null;
}): EditorState {
  return {
    ...piece,
    status: piece.status as EditorState["status"],
    secondaryCtaLabel: piece.secondaryCtaLabel ?? "",
    secondaryCtaHref: piece.secondaryCtaHref ?? "",
    tags: piece.tags.join(", "),
    startsAt: piece.startsAt?.toISOString().slice(0, 16) ?? "",
    endsAt: piece.endsAt?.toISOString().slice(0, 16) ?? "",
  };
}

export default function AdminContentPage() {
  const utils = api.useUtils();
  const [section, setSection] = useState<(typeof TABS)[number][0]>("HERO");
  const query = api.content.adminList.useQuery(
    { section },
    { staleTime: 0, refetchOnMount: "always" },
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [message, setMessage] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const pieces = useMemo(() => query.data?.pieces ?? [], [query.data?.pieces]);

  useEffect(() => {
    const selected =
      pieces.find((piece) => piece.id === selectedId) ?? pieces[0];
    setSelectedId(selected?.id ?? null);
    setEditor(selected ? toEditor(selected) : null);
  }, [pieces, selectedId]);

  const refresh = async () => utils.content.adminList.invalidate();
  const create = api.content.create.useMutation({
    onSuccess: async (piece) => {
      setSelectedId(piece.id);
      setMessage(
        "Nueva pieza creada. Completá los datos y guardá los cambios.",
      );
      await refresh();
    },
    onError: (error) => setMessage(error.message),
  });
  const update = api.content.update.useMutation({
    onSuccess: async () => {
      setMessage(
        "Los cambios fueron guardados y ya se reflejan en la web principal.",
      );
      await refresh();
    },
    onError: (error) => setMessage(error.message),
  });
  const move = api.content.move.useMutation({
    onSuccess: refresh,
    onError: (error) => setMessage(error.message),
  });
  const updateSettings = api.content.updateSettings.useMutation({
    onSuccess: async () => {
      setMessage("La configuración del carrusel fue actualizada.");
      await refresh();
    },
    onError: (error) => setMessage(error.message),
  });

  function selectPiece(id: string) {
    const piece = pieces.find((item) => item.id === id);
    if (!piece) return;
    setSelectedId(id);
    setEditor(toEditor(piece));
  }

  function selectSection(value: (typeof TABS)[number][0]) {
    if (value === section || query.isFetching) return;
    setMessage("");
    setSelectedId(null);
    setEditor(null);
    setSection(value);
  }

  function change<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    setEditor((current) => (current ? { ...current, [key]: value } : current));
  }

  return (
    <AdminPage
      module="Módulo de Contenidos web"
      title={
        <>
          Editar home y<br />
          carrusel de campaña
        </>
      }
      className="admin-content-page"
    >
      <AdminPanel className="admin-panel-pad admin-content-panel">
        <div className="admin-content-tabs" role="tablist">
          {TABS.map(([value, label, icon]) => (
            <button
              type="button"
              role="tab"
              aria-selected={section === value}
              aria-controls="admin-content-tabpanel"
              key={value}
              className={section === value ? "active" : ""}
              disabled={query.isFetching}
              onClick={() => selectSection(value)}
            >
              <span aria-hidden="true">{icon}</span>
              {label}
            </button>
          ))}
        </div>
        {message ? (
          <p className="admin-content-message" role="status">
            {message}
          </p>
        ) : null}
        {query.isFetching ? (
          <div
            id="admin-content-tabpanel"
            className="admin-content-loading"
            role="tabpanel"
            aria-live="polite"
          >
            <ModernSpinner label="Cargando..." />
          </div>
        ) : query.isError ? (
          <div
            id="admin-content-tabpanel"
            className="admin-content-loading admin-content-load-error"
            role="tabpanel"
          >
            <p>No pudimos cargar esta sección.</p>
            <button
              type="button"
              className="admin-btn"
              onClick={() => void query.refetch()}
            >
              Intentar nuevamente
            </button>
          </div>
        ) : (
          <div
            id="admin-content-tabpanel"
            className="admin-content-grid admin-content-grid--stacked"
            role="tabpanel"
          >
            <section>
              <div className="admin-toolbar">
                <h2 className="admin-panel-title">{SECTION_LABEL[section]}</h2>
                <AdminAddButton
                  type="button"
                  disabled={create.isPending}
                  loading={create.isPending}
                  onClick={() => create.mutate({ section })}
                >
                  Nueva pieza
                </AdminAddButton>
              </div>
              <p className="admin-section-label">
                Usá las flechas para ordenar las piezas.
              </p>
              <div className="admin-piece-list">
                {pieces.map((piece, index) => (
                  <article
                    key={piece.id}
                    className={selectedId === piece.id ? "selected" : ""}
                  >
                    <div className="admin-piece-order">
                      <button
                        type="button"
                        aria-label="Subir pieza"
                        disabled={index === 0 || move.isPending}
                        onClick={() =>
                          move.mutate({ id: piece.id, direction: "UP" })
                        }
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label="Bajar pieza"
                        disabled={index === pieces.length - 1 || move.isPending}
                        onClick={() =>
                          move.mutate({ id: piece.id, direction: "DOWN" })
                        }
                      >
                        ↓
                      </button>
                    </div>
                    <span className="admin-piece-thumb">
                      <Image
                        src={piece.desktopImageUrl}
                        alt=""
                        fill
                        sizes="110px"
                      />
                    </span>
                    <div>
                      <strong>{piece.title}</strong>
                      <small>
                        Orden {index + 1} · botón “{piece.ctaLabel}”
                      </small>
                    </div>
                    <span
                      className={`admin-chip admin-chip--content-${piece.status.toLowerCase()}`}
                    >
                      {STATUS_LABEL[piece.status] ?? piece.status}
                    </span>
                    <button
                      type="button"
                      className="admin-piece-edit"
                      onClick={() => selectPiece(piece.id)}
                    >
                      Editar
                    </button>
                  </article>
                ))}
                {pieces.length === 0 ? (
                  <p className="admin-empty">No hay piezas en esta sección.</p>
                ) : null}
              </div>
              {section === "HERO" || section === "CAMPAIGN" ? (
                <div className="admin-rotation">
                  <div>
                    <strong>Rotación automática del carrusel</strong>
                    <small>
                      Cambia de pieza según el intervalo configurado
                    </small>
                  </div>
                  <select
                    className="admin-select"
                    value={query.data?.settings.carouselIntervalMs ?? 4000}
                    onChange={(event) =>
                      updateSettings.mutate({
                        carouselEnabled:
                          query.data?.settings.carouselEnabled ?? true,
                        carouselIntervalMs: Number(event.target.value),
                      })
                    }
                  >
                    <option value={4000}>4 s</option>
                    <option value={6000}>6 s</option>
                    <option value={8000}>8 s</option>
                  </select>
                  <button
                    type="button"
                    aria-label="Activar rotación"
                    aria-pressed={query.data?.settings.carouselEnabled ?? true}
                    className={
                      query.data?.settings.carouselEnabled === false
                        ? "inactive"
                        : ""
                    }
                    onClick={() =>
                      updateSettings.mutate({
                        carouselEnabled: !(
                          query.data?.settings.carouselEnabled ?? true
                        ),
                        carouselIntervalMs:
                          query.data?.settings.carouselIntervalMs ?? 4000,
                      })
                    }
                  />
                </div>
              ) : null}
            </section>
            {editor ? (
              <section className="admin-content-editor">
                <span className="admin-editor-code">{editor.code}</span>
                <h3>Editar pieza</h3>
                <div className="admin-editor-images">
                  <div>
                    <label>Imagen escritorio</label>
                    <span>
                      <Image
                        src={editor.desktopImageUrl}
                        alt=""
                        fill
                        sizes="300px"
                      />
                    </span>
                    <ImageUploadField
                      label="Editar imagen de escritorio"
                      value={editor.desktopImageUrl}
                      onChange={(value) => change("desktopImageUrl", value)}
                    />
                  </div>
                  <div>
                    <label>Imagen móvil</label>
                    <span>
                      <Image
                        src={editor.mobileImageUrl}
                        alt=""
                        fill
                        sizes="180px"
                      />
                    </span>
                    <ImageUploadField
                      label="Editar imagen móvil"
                      value={editor.mobileImageUrl}
                      onChange={(value) => change("mobileImageUrl", value)}
                    />
                  </div>
                </div>
                <label>
                  Antetítulo
                  <input
                    className="admin-input"
                    value={editor.eyebrow}
                    onChange={(event) => change("eyebrow", event.target.value)}
                  />
                </label>
                <label>
                  Título
                  <input
                    className="admin-input"
                    value={editor.title}
                    onChange={(event) => change("title", event.target.value)}
                  />
                </label>
                <label>
                  Descripción
                  <textarea
                    className="admin-input"
                    value={editor.description}
                    onChange={(event) =>
                      change("description", event.target.value)
                    }
                  />
                </label>
                <div className="admin-editor-fields">
                  <label>
                    Texto del botón
                    <input
                      className="admin-input"
                      value={editor.ctaLabel}
                      onChange={(event) =>
                        change("ctaLabel", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    Enlace
                    <input
                      className="admin-input"
                      value={editor.ctaHref}
                      onChange={(event) =>
                        change("ctaHref", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    Estado
                    <select
                      className="admin-select"
                      value={editor.status}
                      onChange={(event) =>
                        change(
                          "status",
                          event.target.value as EditorState["status"],
                        )
                      }
                    >
                      <option value="VISIBLE">Visible</option>
                      <option value="SCHEDULED">Programada</option>
                      <option value="HIDDEN">Oculta</option>
                    </select>
                  </label>
                  {section === "HERO" || section === "CAMPAIGN" ? (
                    <>
                      <label>
                        Botón secundario
                        <input
                          className="admin-input"
                          value={editor.secondaryCtaLabel}
                          onChange={(event) =>
                            change("secondaryCtaLabel", event.target.value)
                          }
                        />
                      </label>
                      <label>
                        Enlace secundario
                        <input
                          className="admin-input"
                          value={editor.secondaryCtaHref}
                          onChange={(event) =>
                            change("secondaryCtaHref", event.target.value)
                          }
                        />
                      </label>
                    </>
                  ) : null}
                  <label>
                    Desde
                    <input
                      className="admin-input"
                      type="datetime-local"
                      value={editor.startsAt}
                      onChange={(event) =>
                        change("startsAt", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    Hasta
                    <input
                      className="admin-input"
                      type="datetime-local"
                      value={editor.endsAt}
                      onChange={(event) => change("endsAt", event.target.value)}
                    />
                  </label>
                </div>
                {section === "HERO" || section === "CAMPAIGN" ? (
                  <label>
                    Etiquetas
                    <input
                      className="admin-input"
                      placeholder="Separadas por comas"
                      value={editor.tags}
                      onChange={(event) => change("tags", event.target.value)}
                    />
                  </label>
                ) : null}
                <div className="admin-editor-actions">
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => setIsPreviewOpen(true)}
                  >
                    Previsualizar
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--primary"
                    disabled={update.isPending}
                    onClick={() =>
                      update.mutate({
                        ...editor,
                        secondaryCtaLabel:
                          editor.secondaryCtaLabel || undefined,
                        secondaryCtaHref: editor.secondaryCtaHref || undefined,
                        tags: editor.tags
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean),
                        startsAt: editor.startsAt
                          ? new Date(editor.startsAt).toISOString()
                          : null,
                        endsAt: editor.endsAt
                          ? new Date(editor.endsAt).toISOString()
                          : null,
                      })
                    }
                  >
                    {update.isPending ? "Guardando…" : "Guardar cambios"}
                  </button>
                </div>
              </section>
            ) : null}
          </div>
        )}
      </AdminPanel>
      {isPreviewOpen && editor ? (
        <ContentPreviewModal
          editor={editor}
          section={section}
          onClose={() => setIsPreviewOpen(false)}
        />
      ) : null}
    </AdminPage>
  );
}

function ContentPreviewModal({
  editor,
  section,
  onClose,
}: {
  editor: EditorState;
  section: (typeof TABS)[number][0];
  onClose: () => void;
}) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const imageUrl =
    device === "desktop" ? editor.desktopImageUrl : editor.mobileImageUrl;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const tags = editor.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return createPortal(
    <div className="admin-content-preview-backdrop" onMouseDown={onClose}>
      <section
        className="admin-content-preview-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="content-preview-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span>Vista previa sin guardar</span>
            <h2 id="content-preview-title">Así se verá en el home principal</h2>
            <p>
              Esta simulación usa lo que escribiste y cargaste en el formulario.
            </p>
          </div>
          <div className="admin-content-preview-actions">
            <div role="group" aria-label="Tamaño de previsualización">
              <button
                type="button"
                className={device === "desktop" ? "active" : ""}
                aria-pressed={device === "desktop"}
                onClick={() => setDevice("desktop")}
              >
                Escritorio
              </button>
              <button
                type="button"
                className={device === "mobile" ? "active" : ""}
                aria-pressed={device === "mobile"}
                onClick={() => setDevice("mobile")}
              >
                Móvil
              </button>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              className="admin-content-preview-close"
              aria-label="Cerrar vista previa"
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </header>

        <div className="admin-content-preview-stage">
          <div
            className={`admin-content-preview-browser is-${device}`}
            aria-label={`Previsualización para ${device === "desktop" ? "escritorio" : "móvil"}`}
          >
            <div className="admin-content-preview-site-header">
              <span className="admin-content-preview-logo">EE</span>
              <strong>EL ESTAMPADERO</strong>
              <nav aria-hidden="true">
                <span>Catálogo</span>
                <span>Clubes</span>
                <span>Nosotros</span>
              </nav>
              <span className="admin-content-preview-cart">Bolsa (0)</span>
            </div>

            {section === "HERO" || section === "CAMPAIGN" ? (
              <div
                className={`admin-content-preview-hero is-${section.toLowerCase()}`}
              >
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt=""
                    fill
                    sizes={device === "desktop" ? "1000px" : "390px"}
                    className="admin-content-preview-image"
                  />
                ) : (
                  <div className="admin-content-preview-image-empty">
                    Cargá una imagen para verla acá
                  </div>
                )}
                <div className="admin-content-preview-shade" />
                <div className="admin-content-preview-copy">
                  {editor.eyebrow ? <span>{editor.eyebrow}</span> : null}
                  <h1>{editor.title || "Título de la pieza"}</h1>
                  <p>
                    {editor.description ||
                      "La descripción aparecerá en este espacio."}
                  </p>
                  <div>
                    <b>{editor.ctaLabel || "Botón principal"}</b>
                    {editor.secondaryCtaLabel ? (
                      <b className="is-secondary">{editor.secondaryCtaLabel}</b>
                    ) : null}
                  </div>
                </div>
                {tags.length ? (
                  <div className="admin-content-preview-tags">
                    {tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : section === "ACCESS" ? (
              <div className="admin-content-preview-access">
                <span>Accesos directos</span>
                <h2>Todo lo que necesitás</h2>
                <div>
                  <article className="is-muted" aria-hidden="true" />
                  <article className="is-previewed">
                    {imageUrl ? (
                      <Image src={imageUrl} alt="" fill sizes="420px" />
                    ) : null}
                    <div>
                      <small>{editor.eyebrow}</small>
                      <h3>{editor.title || "Título del acceso"}</h3>
                      <p>{editor.description}</p>
                      <b>{editor.ctaLabel || "Ver más"}</b>
                    </div>
                  </article>
                  <article className="is-muted" aria-hidden="true" />
                </div>
              </div>
            ) : (
              <div className="admin-content-preview-promotion">
                <span>Promoción destacada</span>
                <article>
                  <div className="admin-content-preview-promotion-image">
                    {imageUrl ? (
                      <Image src={imageUrl} alt="" fill sizes="520px" />
                    ) : null}
                  </div>
                  <div>
                    <small>{editor.eyebrow}</small>
                    <h2>{editor.title || "Título de la promoción"}</h2>
                    <p>{editor.description}</p>
                    <b>{editor.ctaLabel || "Conocer promoción"}</b>
                  </div>
                </article>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}
