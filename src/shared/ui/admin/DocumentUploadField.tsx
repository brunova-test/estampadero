"use client";

import { useRef, useState } from "react";

import { ModernSpinner } from "elestampadero/shared/ui/motion";

const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
const ACCEPTED_DOCUMENTS =
  ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp";

type UploadResponse = { url?: string; error?: string };

export function DocumentUploadField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadDocument(file: File) {
    setError(null);
    const accepted = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ].includes(file.type);
    if (!accepted || file.size > MAX_DOCUMENT_BYTES) {
      setError("Elegí un PDF, JPG, PNG o WebP de hasta 5 MB.");
      return;
    }

    const formData = new FormData();
    formData.append("document", file);
    setIsUploading(true);
    try {
      const response = await fetch("/api/admin/documents", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as UploadResponse;
      if (!response.ok || !result.url) {
        throw new Error(result.error ?? "No se pudo subir el comprobante.");
      }
      onChange(result.url);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "No se pudo subir el comprobante.",
      );
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="admin-document-upload">
      <button
        type="button"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? (
          <>
            <ModernSpinner label="Cargando..." /> Cargando...
          </>
        ) : value ? (
          "Reemplazar comprobante"
        ) : (
          "+ Subir comprobante"
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_DOCUMENTS}
        disabled={isUploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void uploadDocument(file);
        }}
      />
      {value ? (
        <a href={value} target="_blank" rel="noreferrer">
          Ver comprobante cargado
        </a>
      ) : null}
      {error ? (
        <small role="alert">{error}</small>
      ) : (
        <small>PDF o imagen · máximo 5 MB</small>
      )}
    </div>
  );
}
