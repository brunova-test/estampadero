import { detectImageMime } from "./image-upload";

export const MAX_DOCUMENT_UPLOAD_BYTES = 5 * 1024 * 1024;

const MIME_EXTENSIONS: Record<string, Set<string>> = {
  "application/pdf": new Set(["pdf"]),
  "image/jpeg": new Set(["jpg", "jpeg"]),
  "image/png": new Set(["png"]),
  "image/webp": new Set(["webp"]),
};

function detectDocumentMime(bytes: Uint8Array): string | null {
  if (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  ) {
    return "application/pdf";
  }
  const imageMime = detectImageMime(bytes);
  return imageMime === "image/gif" ? null : imageMime;
}

export function validateDocumentUpload(input: {
  name: string;
  declaredMime: string;
  size: number;
  bytes: Uint8Array;
}): { ok: true; mimeType: string } | { ok: false; message: string } {
  if (input.size <= 0 || input.bytes.length <= 0) {
    return { ok: false, message: "El comprobante está vacío." };
  }
  if (
    input.size > MAX_DOCUMENT_UPLOAD_BYTES ||
    input.bytes.length > MAX_DOCUMENT_UPLOAD_BYTES
  ) {
    return { ok: false, message: "El comprobante no puede superar los 5 MB." };
  }

  const detectedMime = detectDocumentMime(input.bytes);
  const extension = input.name.split(".").at(-1)?.toLocaleLowerCase() ?? "";
  if (
    !detectedMime ||
    detectedMime !== input.declaredMime ||
    !MIME_EXTENSIONS[detectedMime]?.has(extension)
  ) {
    return {
      ok: false,
      message: "Solo se permiten comprobantes PDF, JPG, PNG o WebP válidos.",
    };
  }
  return { ok: true, mimeType: detectedMime };
}

export function safeDocumentFilename(filename: string) {
  const normalized = filename
    .normalize("NFKC")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
  return normalized || "comprobante";
}
