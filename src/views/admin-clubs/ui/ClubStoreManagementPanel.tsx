"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { getClubStoreBranding } from "elestampadero/shared/config/club-store-branding";
import { routes } from "elestampadero/shared/config/routes";
import { createClubQrPdf } from "elestampadero/shared/lib/qr-pdf";
import { AdminProductCreationModal } from "elestampadero/views/admin-products";
import { ModernSpinner } from "elestampadero/shared/ui/motion";

interface ClubStoreManagementPanelProps {
  club: {
    id: string;
    slug: string;
    name: string;
    logoUrl: string | null;
    productCount: number;
    hasActiveAgreement: boolean;
  };
  /** Oculta las acciones administrativas cuando se muestra en el portal del club. */
  mode?: "admin" | "portal";
}

function downloadFile(href: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function drawCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const imageRatio = image.width / image.height;
  const boxRatio = width / height;
  const sourceWidth = imageRatio > boxRatio ? image.height * boxRatio : image.width;
  const sourceHeight = imageRatio > boxRatio ? image.height : image.width / boxRatio;
  const sourceX = (image.width - sourceWidth) / 2;
  const sourceY = (image.height - sourceHeight) / 2;
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height,
  );
}

async function createBrandedQrPng({
  qrDataUrl,
  storeUrl,
  clubName,
  logoUrl,
  bannerUrl,
}: {
  qrDataUrl: string;
  storeUrl: string;
  clubName: string;
  logoUrl: string;
  bannerUrl?: string;
}) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1500;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No se pudo preparar la imagen del QR.");

  context.fillStyle = "#f7f6f9";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const bannerHeight = 290;
  if (bannerUrl) {
    const banner = await loadImage(bannerUrl);
    drawCover(context, banner, 0, 0, canvas.width, bannerHeight);
  } else {
    context.fillStyle = "#281a33";
    context.fillRect(0, 0, canvas.width, bannerHeight);
  }
  context.fillStyle = "rgba(14, 10, 26, .58)";
  context.fillRect(0, 0, canvas.width, bannerHeight);

  const logo = await loadImage(logoUrl);
  context.fillStyle = "#ffffff";
  context.fillRect(58, 68, 154, 154);
  context.drawImage(logo, 72, 82, 126, 126);
  context.fillStyle = "#ffffff";
  context.font = "700 44px Arial, sans-serif";
  context.fillText(clubName, 250, 160);
  context.font = "500 24px Arial, sans-serif";
  context.fillStyle = "#bafbed";
  context.fillText("TIENDA OFICIAL", 252, 202);

  context.fillStyle = "#ffffff";
  context.fillRect(58, 350, 1084, 1010);
  context.strokeStyle = "#ddd3e5";
  context.lineWidth = 3;
  context.strokeRect(58, 350, 1084, 1010);

  const qr = await loadImage(qrDataUrl);
  const qrSize = 720;
  const qrX = (canvas.width - qrSize) / 2;
  const qrY = 445;
  context.fillStyle = "#ffffff";
  context.fillRect(qrX - 28, qrY - 28, qrSize + 56, qrSize + 56);
  context.strokeStyle = "#2e0470";
  context.lineWidth = 4;
  context.strokeRect(qrX - 28, qrY - 28, qrSize + 56, qrSize + 56);
  context.drawImage(qr, qrX, qrY, qrSize, qrSize);

  context.fillStyle = "#2e0470";
  context.textAlign = "center";
  context.font = "700 30px Arial, sans-serif";
  context.fillText("Escaneá para abrir la tienda", canvas.width / 2, 1260);
  context.fillStyle = "#716779";
  context.font = "500 18px Arial, sans-serif";
  context.fillText(storeUrl, canvas.width / 2, 1300);
  context.textAlign = "left";

  return canvas.toDataURL("image/png");
}

export function ClubStoreManagementPanel({
  club,
  mode = "admin",
}: ClubStoreManagementPanelProps) {
  const [storeUrl, setStoreUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
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
  const branding = getClubStoreBranding(club.slug);

  function downloadPdf() {
    if (!storeUrl) return;
    const blobUrl = URL.createObjectURL(createClubQrPdf(storeUrl, club.name));
    downloadFile(blobUrl, `${filename}.pdf`);
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1_000);
  }

  async function downloadPng() {
    if (!qrDataUrl || !storeUrl) return;
    try {
      const logoUrl = branding.logoUrl ?? club.logoUrl ?? "/images/linea-club.png";
      const png = await createBrandedQrPng({
        qrDataUrl,
        storeUrl,
        clubName: club.name,
        logoUrl,
        bannerUrl: branding.bannerUrl,
      });
      downloadFile(png, `${filename}.png`);
    } catch {
      setError("No se pudo preparar la imagen del QR.");
    }
  }

  async function copyStoreUrl() {
    await navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 3_000);
  }

  return (
    <section
      className={`admin-club-store-panel ${mode === "portal" ? "admin-club-store-panel--portal" : ""}`}
    >
      <div className="admin-club-store-panel__intro">
        <span>TIENDA INDIVIDUAL</span>
        <h2>Tienda y código QR</h2>
        <p>
          {mode === "portal"
            ? `Compartí el acceso directo al catálogo de ${club.name} con tu comunidad.`
            : `Administrá el acceso directo al catálogo de ${club.name}. Todo producto creado desde aquí quedará asociado automáticamente al club.`}
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
          <div className="admin-club-store-card__url">
            <code>{storeUrl || routes.clubStore(club.slug)}</code>
            <button
              type="button"
              onClick={copyStoreUrl}
              disabled={!storeUrl}
              aria-label="Copiar enlace de la tienda"
            >
              {copied ? (
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="m5 12 4 4L19 6" />
                </svg>
              ) : (
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <rect x="8" y="8" width="11" height="11" rx="2" />
                  <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                </svg>
              )}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <div className="admin-club-store-card__actions">
            <Link href={routes.clubStore(club.slug)} target="_blank">
              Abrir tienda
            </Link>
            {mode === "admin"
              ? club.hasActiveAgreement ? (
                  <button
                    type="button"
                    className="is-primary"
                    onClick={() => setIsProductModalOpen(true)}
                  >
                    + Agregar producto
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    title="Primero cargá un convenio activo para este club."
                  >
                    + Agregar producto
                  </button>
                )
              : null}
          </div>
          {mode === "admin" && !club.hasActiveAgreement ? (
            <small className="admin-club-store-card__notice">
              Para publicar productos, primero cargá un convenio activo.
            </small>
          ) : null}
        </article>

        <article className="admin-club-qr-card">
          <div className="admin-club-qr-card__brand">
            <div className="admin-club-qr-card__banner">
              {branding.bannerUrl ? (
                <Image
                  src={branding.bannerUrl}
                  alt=""
                  fill
                  sizes="(min-width: 1040px) 560px, 100vw"
                  className="object-cover"
                />
              ) : null}
              <span aria-hidden="true" />
            </div>
            <div className="admin-club-qr-card__identity">
              <span className="admin-club-qr-card__logo">
                <Image
                  src={branding.logoUrl ?? club.logoUrl ?? "/images/linea-club.png"}
                  alt={`Logo de ${club.name}`}
                  fill
                  sizes="58px"
                  className="object-contain"
                />
              </span>
              <strong>{club.name}</strong>
            </div>
          </div>
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
                onClick={downloadPng}
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
      {isProductModalOpen ? (
        <AdminProductCreationModal
          clubId={club.id}
          onClose={() => setIsProductModalOpen(false)}
        />
      ) : null}
    </section>
  );
}
