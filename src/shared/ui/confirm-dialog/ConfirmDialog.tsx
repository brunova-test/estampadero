"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Admin-styled replacement for window.confirm(). Native confirm() dialogs
 * are ugly, block the whole tab, and don't match the app's design — use
 * this for any destructive/irreversible admin action instead.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  isConfirming = false,
  confirmingLabel = "Procesando…",
  danger = true,
  className = "",
  icon,
  cancelIcon,
  confirmIcon,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  confirmingLabel?: string;
  danger?: boolean;
  className?: string;
  icon?: ReactNode;
  cancelIcon?: ReactNode;
  confirmIcon?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="admin-confirm-dialog-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-dialog-title"
        aria-describedby="admin-confirm-dialog-message"
        className={`admin-confirm-dialog ${className}`.trim()}
      >
        <div className="admin-confirm-dialog__heading">
          {icon ? (
            <span className="admin-confirm-dialog__icon" aria-hidden="true">
              {icon}
            </span>
          ) : null}
          <h2
            id="admin-confirm-dialog-title"
            className="admin-confirm-dialog__title"
          >
            {title}
          </h2>
        </div>
        <p
          id="admin-confirm-dialog-message"
          className="admin-confirm-dialog__message"
        >
          {message}
        </p>
        <div className="admin-confirm-dialog__actions">
          <button
            type="button"
            className="admin-btn"
            disabled={isConfirming}
            onClick={onCancel}
          >
            {cancelIcon ? (
              <span
                className="admin-confirm-dialog__button-icon"
                aria-hidden="true"
              >
                {cancelIcon}
              </span>
            ) : null}
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            className={`admin-btn ${danger ? "admin-btn--danger" : "admin-btn--primary"}`}
            disabled={isConfirming}
            onClick={onConfirm}
          >
            {!isConfirming && confirmIcon ? (
              <span
                className="admin-confirm-dialog__button-icon"
                aria-hidden="true"
              >
                {confirmIcon}
              </span>
            ) : null}
            {isConfirming ? confirmingLabel : confirmLabel}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
