export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

const MIME_EXTENSIONS: Record<string, Set<string>> = {
  "image/jpeg": new Set(["jpg", "jpeg"]),
  "image/png": new Set(["png"]),
  "image/webp": new Set(["webp"]),
  "image/gif": new Set(["gif"]),
};

function startsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((byte, index) => bytes[index] === byte);
}

export function detectImageMime(bytes: Uint8Array): string | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  if (
    startsWith(bytes, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
    startsWith(bytes, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
  ) {
    return "image/gif";
  }
  return null;
}

export function validateImageUpload(input: {
  name: string;
  declaredMime: string;
  size: number;
  bytes: Uint8Array;
}): { ok: true; mimeType: string } | { ok: false; message: string } {
  if (input.size <= 0 || input.bytes.length <= 0) {
    return { ok: false, message: "La imagen está vacía." };
  }
  if (
    input.size > MAX_IMAGE_UPLOAD_BYTES ||
    input.bytes.length > MAX_IMAGE_UPLOAD_BYTES
  ) {
    return { ok: false, message: "La imagen no puede superar los 5 MB." };
  }

  const detectedMime = detectImageMime(input.bytes);
  const allowedExtensions = MIME_EXTENSIONS[input.declaredMime];
  const extension = input.name.split(".").at(-1)?.toLocaleLowerCase() ?? "";

  if (
    !detectedMime ||
    detectedMime !== input.declaredMime ||
    !allowedExtensions?.has(extension)
  ) {
    return {
      ok: false,
      message: "Solo se permiten imágenes JPG, PNG, WEBP o GIF válidas.",
    };
  }

  return { ok: true, mimeType: detectedMime };
}

export function safeImageFilename(filename: string) {
  const normalized = filename
    .normalize("NFKC")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
  return normalized || "imagen";
}
