"use client";

import { domAnimation, LazyMotion } from "motion/react";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { LoadingOverlay } from "./LoadingOverlay";

const MIN_VISIBLE_MS = 480;
const MAX_VISIBLE_MS = 12_000;



const OVERLAY_DELAY_MS = 600;

interface LoadingContextValue {
  startLoading: (message?: string) => void;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextValue | null>(null);

function isModifiedClick(event: MouseEvent) {
  return (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

function getPageNavigationLink(event: MouseEvent) {
  if (
    !(event.target instanceof Element) ||
    event.defaultPrevented ||
    isModifiedClick(event)
  ) {
    return null;
  }

  const link = event.target.closest<HTMLAnchorElement>("a[href]");
  if (
    !link ||
    link.hasAttribute("download") ||
    link.dataset.loadingIgnore === "true" ||
    (link.target && link.target !== "_self")
  ) {
    return null;
  }

  const destination = new URL(link.href, window.location.href);
  const current = new URL(window.location.href);
  if (!["http:", "https:"].includes(destination.protocol)) return null;

  const staysOnCurrentPage =
    destination.origin === current.origin &&
    destination.pathname === current.pathname;

  return staysOnCurrentPage ? null : link;
}

function getNavigationMessage(_link: HTMLAnchorElement) {
  return "Cargando...";
}

export function GlobalLoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [manualMessage, setManualMessage] = useState<string | null>(null);
  const [activeLink, setActiveLink] = useState<HTMLAnchorElement | null>(null);
  const [visible, setVisible] = useState(false);
  const visibleSinceRef = useRef(0);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyRef = useRef(false);
  const previousPathnameRef = useRef(pathname);

  const clearTimers = useCallback(() => {
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    safetyTimerRef.current = null;
    hideTimerRef.current = null;
  }, []);

  const stopLoading = useCallback(() => {
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    safetyTimerRef.current = null;
    setManualMessage(null);
    setActiveLink(null);
  }, []);

  const startLoading = useCallback(
    (message = "Cargando...") => {
      clearTimers();
      busyRef.current = true;
      setManualMessage(message);
      safetyTimerRef.current = setTimeout(stopLoading, MAX_VISIBLE_MS);
    },
    [clearTimers, stopLoading],
  );

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const link = getPageNavigationLink(event);
      if (!link) return;

      if (busyRef.current) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      startLoading(getNavigationMessage(link));
      setActiveLink(link);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [startLoading]);

  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      previousPathnameRef.current = pathname;
      stopLoading();
    }
  }, [pathname, stopLoading]);

  useEffect(() => {
    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(
      window.history,
    );
    let deferredStopTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleStopLoading = () => {
      if (deferredStopTimer) clearTimeout(deferredStopTimer);
      deferredStopTimer = setTimeout(() => {
        deferredStopTimer = null;
        stopLoading();
      }, 0);
    };

    const trackedPushState: History["pushState"] = function (
      data,
      unused,
      url,
    ) {
      originalPushState(data, unused, url);
      scheduleStopLoading();
    };
    const trackedReplaceState: History["replaceState"] = function (
      data,
      unused,
      url,
    ) {
      originalReplaceState(data, unused, url);
      scheduleStopLoading();
    };

    window.history.pushState = trackedPushState;
    window.history.replaceState = trackedReplaceState;
    window.addEventListener("popstate", scheduleStopLoading);

    return () => {
      if (deferredStopTimer) clearTimeout(deferredStopTimer);
      if (window.history.pushState === trackedPushState) {
        window.history.pushState = originalPushState;
      }
      if (window.history.replaceState === trackedReplaceState) {
        window.history.replaceState = originalReplaceState;
      }
      window.removeEventListener("popstate", scheduleStopLoading);
    };
  }, [stopLoading]);



  useEffect(() => {
    if (!activeLink) return;

    activeLink.dataset.navLoading = "true";
    return () => {
      delete activeLink.dataset.navLoading;
    };
  }, [activeLink]);

  useEffect(() => {
    if (manualMessage) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (visible) return;


      const overlayTimer = setTimeout(() => {
        visibleSinceRef.current = Date.now();
        setVisible(true);
      }, OVERLAY_DELAY_MS);

      return () => clearTimeout(overlayTimer);
    }

    if (!visible) return;
    const remaining = Math.max(
      0,
      MIN_VISIBLE_MS - (Date.now() - visibleSinceRef.current),
    );
    hideTimerRef.current = setTimeout(() => {
      busyRef.current = false;
      setVisible(false);
    }, remaining);
  }, [manualMessage, visible]);

  useEffect(() => {
    busyRef.current = manualMessage !== null || visible;
    if (!visible) return;

    const previousOverflow = document.body.style.overflow;
    const previousAriaBusy = document.body.getAttribute("aria-busy");
    document.body.style.overflow = "hidden";
    document.body.setAttribute("aria-busy", "true");

    const blockInteraction = (event: Event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    document.addEventListener("pointerdown", blockInteraction, true);
    document.addEventListener("keydown", blockInteraction, true);

    return () => {
      document.removeEventListener("pointerdown", blockInteraction, true);
      document.removeEventListener("keydown", blockInteraction, true);
      document.body.style.overflow = previousOverflow;
      if (previousAriaBusy === null) document.body.removeAttribute("aria-busy");
      else document.body.setAttribute("aria-busy", previousAriaBusy);
    };
  }, [manualMessage, visible]);

  useEffect(() => clearTimers, [clearTimers]);

  const contextValue = useMemo(
    () => ({ startLoading, stopLoading }),
    [startLoading, stopLoading],
  );

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}




      <LazyMotion features={domAnimation} strict>
        <LoadingOverlay
          visible={visible}
          message="Cargando..."
        />
      </LazyMotion>
    </LoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error(
      "useGlobalLoading debe usarse dentro de GlobalLoadingProvider",
    );
  }
  return context;
}
