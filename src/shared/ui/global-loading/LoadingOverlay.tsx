"use client";

import { AnimatePresence, m } from "motion/react";

import { ModernSpinner } from "elestampadero/shared/ui/motion";

interface LoadingOverlayProps {
  visible?: boolean;
  message?: string;
}

export function LoadingOverlay({
  visible = true,
  message = "Cargando...",
}: LoadingOverlayProps) {
  const loadingMessage = "Cargando...";
  return (
    <AnimatePresence>
      {visible ? (
        <m.div
          data-global-loading
          role="status"
          aria-live="polite"
          aria-busy
          className="global-loader global-loader--visible"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <m.div
            className="global-loader__content"
            initial={{ opacity: 0, scale: 0.9, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
          >
            <ModernSpinner className="modern-spinner--large" label={loadingMessage} />
            {message !== undefined ? (
              <m.p
                className="global-loader__message"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.12 }}
              >
                {loadingMessage}
              </m.p>
            ) : null}
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
