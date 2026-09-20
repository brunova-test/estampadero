"use client";

import { useEffect } from "react";

const PROTECTED_PATHS = ["/admin", "/club", "/cuenta"];
const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);
const CLUB_ROLES = new Set([
  "CLUB_ADMIN",
  "CLUB_VIEWER",
  "ADMIN",
  "SUPER_ADMIN",
]);
const SESSION_CHECK_TTL_MS = 45_000;

let lastSuccessfulCheckAt = 0;
let sessionCheckInFlight: Promise<void> | null = null;

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function redirectToLogin() {
  const callbackUrl = `${window.location.pathname}${window.location.search}`;
  window.location.replace(
    `/ingresar?callbackUrl=${encodeURIComponent(callbackUrl)}`,
  );
}

function hasValidAccess(
  value: unknown,
  pathname: string,
): value is { authenticated: true; role: string } {
  if (typeof value !== "object" || value === null) return false;
  if (!("authenticated" in value) || value.authenticated !== true) return false;
  if (!("role" in value) || typeof value.role !== "string") return false;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return ADMIN_ROLES.has(value.role);
  }
  if (pathname === "/club" || pathname.startsWith("/club/")) {
    return CLUB_ROLES.has(value.role);
  }
  return value.role === "CUSTOMER";
}

export function AuthSessionGuard() {
  useEffect(() => {
    async function checkSession() {
      if (!isProtectedPath(window.location.pathname)) return;
      if (Date.now() - lastSuccessfulCheckAt < SESSION_CHECK_TTL_MS) return;
      if (sessionCheckInFlight) return sessionCheckInFlight;

      sessionCheckInFlight = (async () => {
        try {
          const response = await fetch("/api/auth/session-status", {
            cache: "no-store",
            credentials: "same-origin",
          });
          const session: unknown = response.ok ? await response.json() : null;

          if (
            !response.ok ||
            !hasValidAccess(session, window.location.pathname)
          ) {
            redirectToLogin();
            return;
          }
          lastSuccessfulCheckAt = Date.now();
        } catch {

        } finally {
          sessionCheckInFlight = null;
        }
      })();

      return sessionCheckInFlight;
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") void checkSession();
    }

    function handleFocus() {
      void checkSession();
    }

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const initialCheck = window.setTimeout(() => void checkSession(), 0);
    const interval = window.setInterval(() => void checkSession(), 60_000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearTimeout(initialCheck);
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
