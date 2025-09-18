"use client";

import { useMemo } from "react";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { Sidebar } from "@/components/admin/sidebar";
import { Header } from "@/components/admin/header";
import { AdminFooter } from "@/components/admin/admin-footer";
import { ScrollToTop } from "@/components/admin/scroll-to-top";
import { CavadiaProvider, type CavadiaConfig } from "@/components/admin/media";
import { useLanguage } from "@/context/LanguageContext";
import { SessionProvider, type MyHotelEntry } from "@/context/SessionContext";
import { cn } from "@/lib/utils";
import type { Session } from "@/lib/auth/session";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { isCollapsed, sidebarWidth, isResizing } = useSidebar();
  const currentLeftMargin = isCollapsed ? 72 : sidebarWidth;

  return (
    <div
      className="flex min-h-screen w-full max-w-full overflow-x-clip bg-app-gradient"
      style={{ "--admin-sidebar-width": `${currentLeftMargin}px` } as React.CSSProperties}
    >
      <Sidebar />
      <div
        className={cn(
          "flex min-h-screen min-w-0 max-w-full flex-1 flex-col transition-[margin]",
          "ml-0 lg:ml-[var(--admin-sidebar-width)]",
          isResizing ? "transition-none select-none" : "duration-300"
        )}
      >
        <Header />
        <main className="flex-1 min-w-0 max-w-full space-y-6 p-3 sm:p-4 md:p-6 w-full">{children}</main>
        <AdminFooter />
        <ScrollToTop />
      </div>
    </div>
  );
}

/**
 * AdminShell — shell client yang menerima sesi dari layout server (RSC).
 * Semua data pribadi masuk lewat props; token tidak pernah ke bundle browser
 * (disuntikkan server-side via serverApiFetch).
 */
export function AdminShell({
  session,
  hotels,
  children,
}: {
  session: Session | null;
  hotels: MyHotelEntry[];
  children: React.ReactNode;
}) {
  const { language } = useLanguage();

  const cavadiaConfig: CavadiaConfig = useMemo(
    () => ({
      api: {
        baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1",
        headers: (): Record<string, string> => {
          // Media terautentikasi di-wire saat Phase 9c (CAPA evidence, presigned ARD-005).
          return {};
        },
        endpoints: {
          list: "/gallery/items",
          upload: "/gallery/upload",
          usage: "/gallery/items/:id/usage",
        },
      },
      locale: language,
    }),
    [language]
  );

  return (
    <SessionProvider session={session} hotels={hotels}>
      <SidebarProvider>
        <CavadiaProvider config={cavadiaConfig}>
          <AdminLayoutInner>{children}</AdminLayoutInner>
        </CavadiaProvider>
      </SidebarProvider>
    </SessionProvider>
  );
}