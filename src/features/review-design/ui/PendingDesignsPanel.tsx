"use client";

import Image from "next/image";
import { useState } from "react";

import { Button } from "elestampadero/shared/ui";
import { api } from "elestampadero/trpc/react";

interface PendingDesignsPanelProps {
  clubId: string;
  canReview?: boolean;
}

function formatDate(value: string | Date | null | undefined) {
  return value ? new Date(value).toLocaleDateString("es-AR") : "—";
}

function PendingDesignCard({
  design,
  canReview,
  onOpen,
}: {
  design: { id: string; title: string };
  canReview: boolean;
  onOpen: (id: string) => void;
}) {
  const utils = api.useUtils();
  const detailQuery = api.designs.byId.useQuery({ id: design.id });
  const [message, setMessage] = useState("");
  const [showChangesForm, setShowChangesForm] = useState(false);

  const approve = api.designs.approve.useMutation({
    onSuccess: async () => {
      await utils.designs.listByClub.invalidate();
    },
  });
  const requestChanges = api.designs.requestChanges.useMutation({
    onSuccess: async () => {
      setMessage("");
      setShowChangesForm(false);
      await utils.designs.listByClub.invalidate();
    },
  });

  const detail = detailQuery.data;
  const latestVersion = detail?.versions[detail.versions.length - 1];

  return (
    <article className="group border-deep/10 overflow-hidden rounded-2xl border bg-white shadow-[0_18px_50px_-28px_rgba(46,4,112,.35)] transition-shadow hover:shadow-[0_22px_55px_-26px_rgba(46,4,112,.45)]">
      {latestVersion ? (
        <button
          type="button"
          onClick={() => onOpen(design.id)}
          aria-label={`Ver detalle de ${design.title}`}
          className="bg-paper group/media relative block aspect-[16/10] min-h-[220px] w-full overflow-hidden border-b border-black/5 sm:min-h-[270px]"
        >
          <Image
            src={latestVersion.imageUrl}
            alt={design.title}
            fill
            className="object-contain p-6 transition-transform duration-500 group-hover/media:scale-[1.02]"
          />
          <span className="text-deep absolute right-3 bottom-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold opacity-0 shadow-lg transition-opacity group-hover/media:opacity-100">
            Ver detalle
          </span>
        </button>
      ) : null}
      <div className="space-y-4 p-5 sm:p-6">
        <div>
          <p className="text-blue font-mono text-[10px] font-semibold tracking-[.16em] uppercase">
            Propuesta para revisar
          </p>
          <p className="font-display text-ink mt-1 text-lg font-black">
            {design.title} · v{detail?.latestVersionNumber ?? 1}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpen(design.id)}
          className="border-deep text-deep hover:bg-blue mt-2 inline-flex min-h-12 w-full items-center justify-center border px-3 py-2 text-center text-sm leading-tight font-extrabold uppercase transition-colors hover:text-white"
        >
          Ver versiones y observaciones
        </button>

        {!canReview ? (
          <p className="bg-paper text-muted px-3 py-2 text-sm font-semibold">
            Acceso de consulta · Solo administradores del club pueden responder.
          </p>
        ) : !showChangesForm ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="mint"
              disabled={approve.isPending}
              loading={approve.isPending}
              loadingLabel="Aprobando diseño"
              onClick={() =>
                latestVersion &&
                approve.mutate({
                  designId: design.id,
                  versionId: latestVersion.id,
                })
              }
              className="!border-mint hover:!bg-blue !min-h-12 !w-full !border !px-3 !py-2 !text-sm !leading-tight hover:!text-white"
            >
              Aprobar diseño
            </Button>
            <Button
              type="button"
              variant="outlineDark"
              onClick={() => setShowChangesForm(true)}
              className="!border-deep hover:!bg-deep !min-h-12 !w-full !border !px-3 !py-2 !text-sm !leading-tight hover:!text-white"
            >
              Solicitar cambios
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Contanos qué cambiar..."
              className="rounded border border-black/10 p-2 text-sm"
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                disabled={!message.trim() || requestChanges.isPending}
                loading={requestChanges.isPending}
                loadingLabel="Enviando cambios"
                onClick={() =>
                    latestVersion &&
                    requestChanges.mutate({
                      designId: design.id,
                      versionId: latestVersion.id,
                      message,
                    })
                }
                className="!min-h-10 !px-4 !py-2 !text-xs"
              >
                Enviar
              </Button>
              <Button
                type="button"
                variant="outlineDark"
                onClick={() => setShowChangesForm(false)}
                className="!min-h-10 !px-4 !py-2 !text-xs"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
        {approve.error || requestChanges.error ? (
          <p className="text-deep mt-3 text-sm font-semibold">
            {approve.error?.message ?? requestChanges.error?.message}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function PendingDesignDetailModal({
  designId,
  onClose,
}: {
  designId: string;
  onClose: () => void;
}) {
  const detailQuery = api.designs.byId.useQuery({ id: designId });
  const detail = detailQuery.data;
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);
  const selectedVersion =
    detail?.versions[selectedVersionIndex] ??
    detail?.versions[detail.versions.length - 1];

  return (
    <div
      className="bg-ink/75 fixed inset-0 z-[120] grid place-items-center overflow-y-auto p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="relative grid max-h-[min(900px,calc(100svh-24px))] w-full max-w-6xl overflow-y-auto rounded-2xl border border-white/60 bg-white shadow-2xl lg:h-[min(860px,calc(100svh-32px))] lg:max-h-none lg:grid-cols-[1.15fr_.85fr] lg:overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalle"
          className="text-deep hover:text-blue absolute top-4 right-4 z-20 grid h-9 w-9 place-items-center border-0 bg-transparent text-[0px] after:text-2xl after:content-['✕']"
        />
        {detailQuery.isLoading || !detail ? (
          <div className="grid min-h-[520px] place-items-center lg:col-span-2">
            <span
              className="global-loader__spinner"
              aria-label="Cargando..."
            />
          </div>
        ) : (
          <>
            <div className="bg-paper flex min-h-0 flex-col p-4 sm:p-7 lg:overflow-y-auto">
              <div className="relative min-h-[360px] flex-1 overflow-hidden rounded-xl border border-black/5 bg-white sm:min-h-[500px] lg:min-h-0">
                {selectedVersion ? (
                  <Image
                    src={selectedVersion.imageUrl}
                    alt={detail.title}
                    fill
                    className="object-contain p-5 sm:p-8"
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    priority
                  />
                ) : null}
              </div>
              <div className="modal-scrollbar-hidden mt-4 flex gap-3 overflow-x-auto px-1 py-2 pb-3">
                {detail.versions.map((version, index) => (
                  <button
                    key={version.id}
                    type="button"
                    onClick={() => setSelectedVersionIndex(index)}
                    className={`relative h-24 w-28 shrink-0 overflow-visible rounded-lg border-2 bg-white p-1 transition-colors ${selectedVersion?.id === version.id ? "border-deep shadow-md" : "border-deep/15 hover:border-blue"}`}
                  >
                    <Image
                      src={version.imageUrl}
                      alt={`Versión ${version.versionNumber}`}
                      fill
                      className="object-contain p-3"
                      sizes="96px"
                    />
                    <span className="bg-deep absolute right-1 bottom-1 rounded px-1.5 py-0.5 text-[10px] font-bold text-white">
                      v{version.versionNumber}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="product-detail-scrollbar min-h-0 overflow-y-auto p-6 sm:p-9">
              <span className="text-blue font-mono text-[11px] font-semibold tracking-[.16em] uppercase">
                {detail.status}
              </span>
              <h2 className="font-display text-ink mt-2 text-3xl leading-tight font-black">
                {detail.title}
              </h2>
              <p className="text-muted mt-3 text-base leading-relaxed">
                {detail.versions.length} versiones enviadas · última
                actualizada {formatDate(selectedVersion?.createdAt)}
              </p>
              <div className="mt-8 border-t border-black/10 pt-6">
                <h3 className="font-display text-ink text-xl font-black">
                  Observaciones
                </h3>
                <div className="mt-4 flex max-h-64 flex-col gap-3 overflow-y-auto">
                  {detail.comments
                    .filter((comment) => comment.versionId === selectedVersion?.id)
                    .map((comment) => (
                    <div key={comment.id} className="bg-paper rounded-lg p-3">
                      <div className="text-muted flex justify-between gap-3 text-sm">
                        <strong className="text-deep font-bold">
                          {comment.authorName}
                        </strong>
                        <span>{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-ink mt-2 text-base leading-relaxed">
                        {comment.message}
                      </p>
                    </div>
                    ))}
                  {detail.comments.filter(
                    (comment) => comment.versionId === selectedVersion?.id,
                  ).length === 0 ? (
                    <p className="text-muted text-base">
                      Todavía no hay observaciones.
                    </p>
                  ) : null}
                </div>
              </div>
              {detail.linkedProducts.length > 0 ? (
                <div className="mt-7 border-t border-black/10 pt-6">
                  <h3 className="font-display text-ink text-xl font-black">
                    Productos vinculados
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {detail.linkedProducts.map((product) => (
                      <span
                        key={product.productId}
                        className="bg-mint/30 text-deep rounded-full px-3 py-2 text-sm font-bold"
                      >
                        {product.productName}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export function PendingDesignsPanel({
  clubId,
  canReview = true,
}: PendingDesignsPanelProps) {
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const designsQuery = api.designs.listByClub.useQuery({ clubId });
  const pending = designsQuery.data?.filter(
    (design) => design.status !== "APPROVED",
  );

  if (!pending || pending.length === 0) return null;

  return (
    <div className="border-deep/10 mb-8 rounded-2xl border bg-white/60 p-4 sm:p-6">
      <h2 className="font-display text-ink mb-5 text-2xl font-black">
        Diseños para revisar
      </h2>
      <div className="grid gap-5 lg:grid-cols-2">
        {pending.map((design) => (
          <PendingDesignCard
            key={design.id}
            design={design}
            canReview={canReview}
            onOpen={setSelectedDesignId}
          />
        ))}
      </div>
      {selectedDesignId ? (
        <PendingDesignDetailModal
          designId={selectedDesignId}
          onClose={() => setSelectedDesignId(null)}
        />
      ) : null}
    </div>
  );
}
