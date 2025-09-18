"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useSidebar } from "@/context/SidebarContext";
import { useSession } from "@/context/SessionContext";
import { logoutAction, switchHotelAction } from "@/app/actions/auth";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  ClipboardCheck,
  ShieldAlert,
  Handshake,
  Building2,
  Users,
  Shield,
  Languages,
  ListChecks,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Hotel,
  MapPin,
  TrendingUp,
  FileText,
  CreditCard,
  Database,
  LogOut,
  Building,
} from "lucide-react";

/* ─── Sidebar Item/Group Types ─── */

interface SidebarItem {
  id: string;
  labelKey: string;
  icon: React.ReactNode;
  href?: string;
  permission?: string;
}

interface SidebarGroup {
  id: string;
  labelKey: string;
  icon: React.ReactNode;
  items: SidebarItem[];
  permission?: string;
}

const navCategories: Record<string, Omit<SidebarGroup, "id">> = {
  overview: { labelKey: "nav.overview", icon: <LayoutDashboard className="w-5 h-5 shrink-0" />, items: [] },
  audit: {
    labelKey: "nav.audit",
    icon: <ClipboardCheck className="w-5 h-5 shrink-0" />,
    items: [
      { id: "audits", labelKey: "nav.audits", icon: <ListChecks className="w-4 h-4" />, href: "/dashboard/audits", permission: "audits" },
      { id: "capa", labelKey: "nav.capaTickets", icon: <ShieldAlert className="w-4 h-4" />, href: "/dashboard/capa", permission: "capa" },
    ],
  },
  crm: {
    labelKey: "nav.crm",
    icon: <Handshake className="w-5 h-5 shrink-0" />,
    items: [
      { id: "leads", labelKey: "nav.leads", icon: <TrendingUp className="w-4 h-4" />, href: "/dashboard/crm/leads", permission: "leads" },
      { id: "quotations", labelKey: "nav.quotations", icon: <FileText className="w-4 h-4" />, href: "/dashboard/crm/quotations", permission: "leads" },
      { id: "billing", labelKey: "nav.billing", icon: <CreditCard className="w-4 h-4" />, href: "/dashboard/crm/billing", permission: "leads" },
    ],
  },
  hotels: {
    labelKey: "nav.hotels",
    icon: <Hotel className="w-5 h-5 shrink-0" />,
    items: [
      { id: "hotel-catalog", labelKey: "nav.hotelCatalog", icon: <Building2 className="w-4 h-4" />, href: "/dashboard/hotels", permission: "hotels" },
      { id: "regions", labelKey: "nav.regions", icon: <MapPin className="w-4 h-4" />, href: "/dashboard/hotels/regions", permission: "hotels" },
      { id: "brands", labelKey: "nav.brands", icon: <Hotel className="w-4 h-4" />, href: "/dashboard/hotels/brands", permission: "hotels" },
    ],
  },
  i18n: {
    labelKey: "nav.i18n",
    icon: <Languages className="w-5 h-5 shrink-0" />,
    items: [
      { id: "translations", labelKey: "nav.translations", icon: <Languages className="w-4 h-4" />, href: "/dashboard/translations", permission: "i18n" },
    ],
  },
  rbac: {
    labelKey: "nav.rbac",
    icon: <Shield className="w-5 h-5 shrink-0" />,
    items: [
      { id: "users", labelKey: "nav.users", icon: <Users className="w-4 h-4" />, href: "/dashboard/users", permission: "users" },
      { id: "roles", labelKey: "nav.roles", icon: <Shield className="w-4 h-4" />, href: "/dashboard/roles", permission: "roles" },
      { id: "audit-log", labelKey: "nav.auditLog", icon: <Database className="w-4 h-4" />, href: "/dashboard/audit-log", permission: "users" },
    ],
  },
};

/* ─── Active Item Helper ─── */

function matchActive(pathname: string, href?: string): boolean {
  if (!href) return false;
  if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const t = useTranslations();
  const { language } = useLanguage();
  const { session, hotels } = useSession();
  const router = useRouter();
  const { isCollapsed, toggleCollapse, setMobileOpen, isMobileOpen } = useSidebar();
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    audit: true,
    crm: true,
  });

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  const isActiveGroup = (groupItems: SidebarItem[]) =>
    groupItems.some((it) => matchActive(pathname, it.href));

  const sidebarInner = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <Link
        href="/dashboard"
        data-no-link-hover
        className={cn(
          "flex items-center gap-3 border-b border-sidebar-border/70 px-4 py-4 transition-smooth hover:bg-sidebar-accent/40",
          isCollapsed ? "justify-center px-2" : ""
        )}
        onClick={() => setMobileOpen(false)}
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-gradient text-primary-foreground shadow-glow">
          <Hotel className="h-5 w-5" />
        </span>
        {!isCollapsed && (
          <span className="min-w-0">
            <span className="block font-display text-xl leading-none text-brand-gradient">{t("common.brand")}</span>
            <span className="block truncate text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground">
              {language === "id" ? "Suite Operasional Hotel" : "Hotel Operations Suite"}
            </span>
          </span>
        )}
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {/* Overview */}
        <Link
          href="/dashboard"
          data-no-link-hover
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-smooth",
            matchActive(pathname, "/dashboard")
              ? "bg-brand-gradient text-primary-foreground shadow-glow"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isCollapsed && "justify-center px-2"
          )}
          onClick={() => setMobileOpen(false)}
        >
          {navCategories.overview.icon}
          {!isCollapsed && <span>{t("nav.overview")}</span>}
        </Link>

        {/* Groups */}
        {Object.entries(navCategories)
          .filter(([key]) => key !== "overview")
          .map(([key, group]) => {
            const isOpen = isActiveGroup(group.items) || openGroups[key];
            return (
              <div key={key}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-smooth",
                    "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActiveGroup(group.items) && "text-sidebar-accent-foreground",
                    isCollapsed && "justify-center px-2"
                  )}
                  onClick={() => {
                    if (isCollapsed) {
                      toggleCollapse();
                      setOpenGroups((g) => ({ ...g, [key]: true }));
                    } else {
                      setOpenGroups((g) => ({ ...g, [key]: !g[key] }));
                    }
                  }}
                  aria-expanded={isOpen}
                >
                  {group.icon}
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{t(group.labelKey)}</span>
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </>
                  )}
                </button>

                {isOpen && !isCollapsed && (
                  <div className="ml-2 mt-1 space-y-0.5 pl-4 border-l border-sidebar-border/60">
                    {group.items.map((item) => {
                      const active = matchActive(pathname, item.href);
                      return (
                        <Link
                          key={item.id}
                          href={item.href || "#"}
                          data-no-link-hover
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-1.5 text-[0.82rem] transition-smooth",
                            active
                              ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                          )}
                          onClick={() => setMobileOpen(false)}
                        >
                          {item.icon}
                          <span>{t(item.labelKey)}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
      </nav>

      {/* Footer: sesi + logout (RBAC user chip) */}
      {session && (
        <div className="border-t border-sidebar-border/70 p-2">
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2",
              isCollapsed && "flex-col justify-center gap-1 text-center"
            )}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-gradient text-primary-foreground font-display text-sm font-bold shadow-glow">
              {(session.user.name ?? "?").slice(0, 2).toUpperCase()}
            </span>
            {!isCollapsed && (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{session.user.name}</span>
                <span className="block truncate text-[0.68rem] text-muted-foreground">
                  {session.roles.map((r) => r.code).filter(Boolean).join(", ") || t("auth.noScope")}
                </span>
              </span>
            )}
          </div>

          {!isCollapsed && (
            <div className="mb-1 mt-1 space-y-1 px-1">
              {session.activeHotel && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Building className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{session.activeHotel.name}</span>
                </div>
              )}
              {hotels.length > 1 && (
                <select
                  aria-label={t("auth.switchHotelTitle")}
                  defaultValue={session.activeHotel?.id ?? ""}
                  onChange={async (e) => {
                    const id = e.target.value;
                    if (!id) return;
                    await switchHotelAction(id);
                    router.refresh();
                  }}
                  className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="" disabled>
                    {t("auth.switchHotelTitle")}
                  </option>
                  {hotels.map((hotel) => (
                    <option key={hotel.hotel_id} value={hotel.hotel_id}>
                      {hotel.hotel_name} ({hotel.hotel_code})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={async () => {
              await logoutAction();
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-smooth hover:bg-destructive/10 hover:text-destructive",
              isCollapsed && "justify-center px-2"
            )}
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span>{t("common.logout")}</span>}
          </button>
        </div>
      )}

      {/* Collapse toggle */}
      <div className="border-t border-sidebar-border/70 p-2">
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-smooth hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isCollapsed && "justify-center px-2"
          )}
          onClick={toggleCollapse}
        >
          {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          {!isCollapsed && <span>{language === "id" ? "Ciutkan" : "Collapse"}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden lg:block border-r border-sidebar-border/70",
          "bg-card/80 backdrop-blur-xl transition-[width] duration-300"
        )}
        style={{ width: isCollapsed ? 72 : 260 }}
      >
        {sidebarInner}
      </aside>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[280px] border-r border-sidebar-border/70 bg-card shadow-2xl">
            {sidebarInner}
          </aside>
        </div>
      )}
    </>
  );
}