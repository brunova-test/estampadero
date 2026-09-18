"use client";

import { AnimatePresence, m } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import { AdminNavigationContext } from "elestampadero/shared/ui/admin/AdminNavigationContext";
import { AdminSidebar } from "elestampadero/widgets/admin-sidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setIsSidebarCollapsed(
      window.localStorage.getItem("admin-sidebar-collapsed") === "true",
    );
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("admin-sidebar-collapsed", String(next));
      return next;
    });
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((current) => !current);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  const navigate = useCallback(
    (href: string, label: string) => {
      if (pendingHref || href === pathname) return;
      setPendingHref(href);
      setPendingLabel(label);
      startTransition(() => router.push(href));
    },
    [pathname, pendingHref, router],
  );

  useEffect(() => {
    if (!pendingHref) return;
    const destinationPath = pendingHref.split("?")[0];
    if (destinationPath === pathname) {
      setPendingHref(null);
      setPendingLabel(null);
    }
  }, [pathname, pendingHref]);

  useEffect(() => {
    if (!pendingHref) return;
    const safetyTimer = window.setTimeout(() => {
      setPendingHref(null);
      setPendingLabel(null);
    }, 12_000);
    return () => window.clearTimeout(safetyTimer);
  }, [pendingHref]);

  const isNavigating = pendingHref !== null || isPending;
  const contextValue = useMemo(
    () => ({
      pendingHref,
      pendingLabel,
      isNavigating,
      isSidebarCollapsed,
      isMobileMenuOpen,
      navigate,
      toggleSidebar,
      toggleMobileMenu,
      closeMobileMenu,
    }),
    [
      pendingHref,
      pendingLabel,
      isNavigating,
      isSidebarCollapsed,
      isMobileMenuOpen,
      navigate,
      toggleSidebar,
      toggleMobileMenu,
      closeMobileMenu,
    ],
  );

  return (
    <AdminNavigationContext.Provider value={contextValue}>
      <div
        className={`admin-shell ${isSidebarCollapsed ? "admin-shell--collapsed" : ""} ${isMobileMenuOpen ? "admin-shell--mobile-open" : ""}`}
      >
        <button
          type="button"
          className="admin-mobile-topbar-toggle"
          onClick={toggleMobileMenu}
          aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isMobileMenuOpen}
        >
          <span className="admin-mobile-topbar-toggle__bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
        <div
          className="admin-sidebar-backdrop"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
        <AdminSidebar />
        <main className="admin-main">
          <div
            className="admin-main-content"
            aria-busy={isNavigating || undefined}
          >
            {children}
          </div>
          <AnimatePresence>
            {isNavigating ? (
              <m.div
                className="admin-navigation-progress"
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 0.78 }}
                exit={{ opacity: 0, scaleX: 1 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                aria-hidden="true"
              />
            ) : null}
          </AnimatePresence>
        </main>
      </div>
    </AdminNavigationContext.Provider>
  );
}
