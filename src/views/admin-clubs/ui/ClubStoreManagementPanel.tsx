"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { routes } from "elestampadero/shared/config/routes";
import { createClubQrPdf } from "elestampadero/shared/lib/qr-pdf";
import { ModernSpinner } from "elestampadero/shared/ui/motion";

interface ClubStoreManagementPanelProps {
  club: {
    id: string;
    slug: string;
    name: string;
    productCount: number;
    hasActiveAgreement: boolean;
  };
}

function downloadFile(href: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
}

export function ClubStoreManagementPanel({
  club,
}: ClubStoreManagementPanelProps) {
  const [storeUrl, setStoreUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(routes.clubStore(club.slug), window.location.origin)
      .href;
    setStoreUrl(url);
    setError(null);
    void QRCode.toDataURL(url, {
      errorCorrectionLevel: "H",
      margin: 4,
      width: 720,
      color: { dark: "#0e0a1aff", light: "#ffffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => setError("No se pudo generar el código QR."));
  }, [club.slug]);

  const filename = `tienda-${club.slug}`;

  function downloadPdf() {
    if (!storeUrl) return;
    const blobUrl = URL.createObjectURL(createClubQrPdf(storeUrl, club.name));
    downloadFile(blobUrl, `${filename}.pdf`);
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1_000);
  }

  async function copyStoreUrl() {
    await navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_800);
  }

  return (
    <section className="admin-club-store-panel">
      <div className="admin-club-store-panel__intro">
        <span>TIENDA INDIVIDUAL</span>
        <h2>Tienda y código QR</h2>
        <p>
          Administrá el acceso directo al catálogo de {club.name}. Todo producto
          creado desde aquí quedará asociado automáticamente al club.
        </p>
      </div>

      <div className="admin-club-store-panel__grid">
        <article className="admin-club-store-card">
          <span className="admin-club-store-card__eyebrow">Tienda activa</span>
          <h3>{club.name}</h3>
          <p>
            {club.productCount} producto{club.productCount === 1 ? "" : "s"}{" "}
            asociados
          </p>
          <code>{storeUrl || routes.clubStore(club.slug)}</code>
          <div className="admin-club-store-card__actions">
            <Link href={routes.clubStore(club.slug)} target="_blank">
              Abrir tienda
            </Link>
            {club.hasActiveAgreement ? (
              <Link
                className="is-primary"
                href={`/admin/productos?crear=1&clubId=${encodeURIComponent(club.id)}`}
              >
                + Agregar producto
              </Link>
            ) : (
              <button
                type="button"
                disabled
                title="Primero cargá un convenio activo para este club."
              >
                + Agregar producto
              </button>
            )}
          </div>
          {!club.hasActiveAgreement ? (
            <small className="admin-club-store-card__notice">
              Para publicar productos, primero cargá un convenio activo.
            </small>
          ) : null}
        </article>

        <article className="admin-club-qr-card">
          <div className="admin-club-qr-card__preview">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt={`Código QR de la tienda de ${club.name}`}
              />
            ) : error ? (
              <p>{error}</p>
            ) : (
              <ModernSpinner label="Generando QR…" />
            )}
          </div>
          <div className="admin-club-qr-card__copy">
            <span>CÓDIGO QR ÚNICO</span>
            <h3>Listo para imprimir</h3>
            <p>
              Al escanearlo se abre directamente la tienda específica de este
              club.
            </p>
            <div className="admin-club-qr-card__actions">
              <button
                type="button"
                disabled={!qrDataUrl}
                onClick={() => downloadFile(qrDataUrl, `${filename}.png`)}
              >
                Descargar PNG
              </button>
              <button type="button" disabled={!storeUrl} onClick={downloadPdf}>
                Descargar PDF
              </button>
              <button type="button" disabled={!storeUrl} onClick={copyStoreUrl}>
                {copied ? "Enlace copiado" : "Copiar enlace"}
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
