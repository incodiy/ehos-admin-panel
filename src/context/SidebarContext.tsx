"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface SidebarContextValue {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  sidebarWidth: number;
  isResizing: boolean;
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

const SIDEBAR_STORAGE_KEY = "ehos-sidebar-collapsed";
const COLLAPSED_WIDTH = 72;
const EXPANDED_WIDTH = 260;

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [width, setWidth] = useState(EXPANDED_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored === "true") setIsCollapsed(true);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    if (!isCollapsed) return;
    const onMouseMove = (e: MouseEvent) => {
      setIsResizing(true);
      const w = Math.min(Math.max(e.clientX, COLLAPSED_WIDTH), 400);
      setWidth(w);
    };
    const onMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    if (isResizing) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isResizing, isCollapsed]);

  const value = useMemo<SidebarContextValue>(
    () => ({
      isCollapsed,
      toggleCollapse: () => setIsCollapsed((c) => !c),
      sidebarWidth: isCollapsed ? COLLAPSED_WIDTH : width,
      isResizing,
      isMobileOpen: isMobileOpen,
      setMobileOpen: (open: boolean) => setIsMobileOpen(open),
    }),
    [isCollapsed, width, isResizing, isMobileOpen]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}

export { COLLAPSED_WIDTH, EXPANDED_WIDTH };