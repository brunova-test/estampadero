"use client";

import { createContext, useContext } from "react";

export interface AdminNavigationContextValue {
  pendingHref: string | null;
  pendingLabel: string | null;
  isNavigating: boolean;
  isSidebarCollapsed: boolean;
  isMobileMenuOpen: boolean;
  navigate: (href: string, label: string) => void;
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

export const AdminNavigationContext =
  createContext<AdminNavigationContextValue | null>(null);

export function useAdminNavigation() {
  const context = useContext(AdminNavigationContext);
  if (!context)
    throw new Error("useAdminNavigation debe usarse dentro de AdminShell");
  return context;
}
