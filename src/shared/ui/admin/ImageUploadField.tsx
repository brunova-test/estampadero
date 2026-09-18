"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { ModernSpinner } from "elestampadero/shared/ui/motion";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGES =
  ".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif";

type UploadResponse = { url?: string; error?: string };

export function ImageUploadField({
  value,
  onChange,
  required = false,
  multiple = false,
  onMultipleChange,
  label = "Imagen",
  placeholder = "/images/imagen.png o https://...",
  uploadLabel = "Subir desde mi PC",
  labelIcon,
  showUrlInput = true,
  showPreviews = true,
}: {
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  multiple?: boolean;
  onMultipleChange?: (urls: string[]) => void;
  label?: string;
  placeholder?: string;
  uploadLabel?: string;
  labelIcon?: ReactNode;
  showUrlInput?: boolean;
  showPreviews?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>(
    value ? [value] : [],
  );

  useEffect(() => {
    if (!value) setPreviewUrls([]);
  }, [value]);

  async function uploadImage(file: File): Promise<string | null> {
    setError(null);

    if (!file.type.startsWith("image/") || file.size > MAX_IMAGE_BYTES) {
      setError("Elegí una imagen JPG, PNG, WebP o GIF de hasta 5 MB.");
      return null;
    }

    const formData = new FormData();
    formData.append("image", file);
    setIsUploading(true);

    try {
      const response = await fetch("/api/admin/images", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as UploadResponse;
      if (!response.ok || !result.url) {
        throw new Error(result.error ?? "No se pudo subir la imagen.");
      }
      onChange(result.url);
      setPreviewUrls((current) =>
        multiple ? [...current, result.url!] : [result.url!],
      );
      return result.url;
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "No se pudo subir la imagen.",
      );
      return null;
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function uploadImages(files: FileList) {
    setError(null);
    setIsUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadImage(file);
        if (url) urls.push(url);
      }
      onMultipleChange?.(urls);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="admin-image-upload-field">
      <span className="admin-image-upload-field__label">
        {labelIcon}
        {label}
      </span>
      <div className="admin-image-upload-field__controls">
        {showUrlInput ? (
          <input
            className="admin-input"
            type="text"
            inputMode="url"
            aria-label={label}
            required={required}
            placeholder={placeholder}
            value={value}
            onChange={(event) => {
              const url = event.target.value;
              onChange(url);
              setPreviewUrls(url ? [url] : []);
            }}
          />
        ) : null}
        <button
          type="button"
          className="admin-image-upload-button"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <>
              <ModernSpinner label="Cargando..." /> Cargando...
            </>
          ) : (
            <>
              <svg
                aria-hidden="true"
                className="admin-image-upload-button__icon"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path d="M12 16V4m0 0L7 9m5-5 5 5M5 15v4h14v-4" />
              </svg>
              {uploadLabel}
            </>
          )}
        </button>
        <input
          ref={inputRef}
          className="admin-image-upload-field__file"
          type="file"
          accept={ACCEPTED_IMAGES}
          multiple={multiple}
          disabled={isUploading}
          onChange={(event) => {
            const files = event.target.files;
            if (!files?.length) return;
            if (multiple) void uploadImages(files);
            else void uploadImage(files[0]!);
          }}
        />
      </div>
      {showPreviews && previewUrls.length ? (
        <div
          className="admin-image-upload-field__previews"
          aria-label="Vista previa de imágenes"
        >
          {previewUrls.map((url, index) => (
            <div
              className="admin-image-upload-field__preview"
              key={`${url}-${index}`}
            >
              <Image
                src={url}
                alt={`Vista previa ${index + 1}`}
                width={76}
                height={58}
              />
            </div>
          ))}
        </div>
      ) : null}
      {error ? (
        <span className="admin-image-upload-field__error" role="alert">
          {error}
        </span>
      ) : (
        <small>JPG, PNG, WebP o GIF · máximo 5 MB</small>
      )}
    </div>
  );
}
