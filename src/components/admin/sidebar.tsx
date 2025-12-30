"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
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
  Globe,
  TrendingUp,
  FileText,
  CreditCard,
  Database,
  LogOut,
  Settings2,
  SlidersHorizontal,
  Contact,
} from "lucide-react";

/* ─── Role Formatting Helper ─── */
function formatRoleName(code?: string): string {
  if (!code) return "Staff";
  const map: Record<string, string> = {
    ROOT_ADMIN: "Super Administrator",
    CORP_EXEC: "Corporate Executive",
    CORP_AUDITOR: "Corporate Auditor",
    REGIONAL_ROM: "Regional Ops Manager",
    HOTEL_GM: "General Manager",
    HOTEL_HOD_TECH: "Head of Dept (Tech)",
    HOTEL_SALES: "Sales & Marketing",
    HOTEL_FINANCE: "Finance & Accounting",
    PUBLIC_CLIENT: "Client Representative",
  };
  return map[code.toUpperCase()] || code.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatUserName(rawName?: string, roleCode?: string): string {
  if (!rawName || rawName.trim().toLowerCase() === "root_admin" || rawName.trim().toLowerCase() === "admin") {
    if (roleCode?.toUpperCase() === "ROOT_ADMIN") return "Root Administrator";
    return "Operations Admin";
  }
  return rawName.trim();
}

function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/* ─── Sidebar Item/Group Types ─── */

interface SidebarItem {
  id: string;
  labelKey: string;
  icon: React.ReactNode;
  href?: string;
  permission?: string;
  badge?: number;
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
      { id: "contacts", labelKey: "nav.contacts", icon: <Contact className="w-4 h-4" />, href: "/dashboard/hotels/contacts", permission: "hotels" },
      { id: "cities", labelKey: "nav.cities", icon: <MapPin className="w-4 h-4" />, href: "/dashboard/hotels/cities", permission: "hotels" },
      { id: "regions", labelKey: "nav.regions", icon: <Globe className="w-4 h-4" />, href: "/dashboard/hotels/regions", permission: "hotels" },
      { id: "brands", labelKey: "nav.brands", icon: <Hotel className="w-4 h-4" />, href: "/dashboard/hotels/brands", permission: "hotels" },
    ],
  },
  config: {
    labelKey: "nav.config",
    icon: <Settings2 className="w-5 h-5 shrink-0" />,
    items: [
      { id: "checklist-config", labelKey: "nav.checklistConfig", icon: <ListChecks className="w-4 h-4" />, href: "/dashboard/config/checklist", permission: "checklist" },
      { id: "brand-tiers", labelKey: "nav.brandTiers", icon: <SlidersHorizontal className="w-4 h-4" />, href: "/dashboard/config/brand-tiers", permission: "hotels" },
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

  const primaryRoleCode = session?.roles?.[0]?.code || "ROOT_ADMIN";
  const naturalRole = formatRoleName(primaryRoleCode);
  const displayName = formatUserName(session?.user?.name, primaryRoleCode);
  const initials = getUserInitials(displayName);

  const sidebarInner = (
    <div className="flex h-full flex-col">
      {/* Brand Header — Exact h-16 (64px) aligning with main top navbar */}
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border/70 px-4">
        <Link
          href="/dashboard"
          data-no-link-hover
          className={cn(
            "flex items-center gap-3 w-full transition-smooth hover:opacity-90",
            isCollapsed ? "justify-center" : ""
          )}
          onClick={() => setMobileOpen(false)}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-gradient text-primary-foreground shadow-glow">
            <Hotel className="h-5 w-5" />
          </span>
          {!isCollapsed && (
            <span className="min-w-0">
              <span className="block font-display text-lg font-bold tracking-tight text-brand-gradient leading-tight">
                {t("common.brand")}
              </span>
              <span className="block truncate text-[0.62rem] font-medium uppercase tracking-[0.14em] text-muted-foreground/90">
                {t("common.brandTagline")}
              </span>
            </span>
          )}
        </Link>
      </div>

      {/* Nav Content */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2.5 scrollbar-thin">
        {/* Overview */}
        <Link
          href="/dashboard"
          data-no-link-hover
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-smooth",
            matchActive(pathname, "/dashboard")
              ? "bg-brand-gradient text-primary-foreground shadow-glow font-semibold"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isCollapsed && "justify-center px-2"
          )}
          onClick={() => setMobileOpen(false)}
        >
          <span className="shrink-0">{navCategories.overview.icon}</span>
          {!isCollapsed && <span className="truncate">{t("nav.overview")}</span>}
        </Link>

        {/* Groups */}
        {Object.entries(navCategories)
          .filter(([key]) => key !== "overview")
          .map(([key, group]) => {
            const isGroupActive = isActiveGroup(group.items);
            const isOpen = isGroupActive || !!openGroups[key];

            return (
              <div key={key} className="space-y-0.5">
                <button
                  type="button"
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-smooth",
                    isGroupActive
                      ? "text-primary font-semibold bg-sidebar-accent/40"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
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
                  <span
                    className={cn(
                      "shrink-0 transition-colors",
                      isGroupActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    {group.icon}
                  </span>
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{t(group.labelKey)}</span>
                      <span className="text-muted-foreground/80 transition-transform duration-200">
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </span>
                    </>
                  )}
                </button>

                {/* Submenu with aligned vertical connecting branch line */}
                {isOpen && !isCollapsed && (
                  <div className="relative ml-[22px] border-l-2 border-emerald-500/35 dark:border-emerald-400/30 pl-3.5 py-1 space-y-1">
                    {group.items.map((item) => {
                      const active = matchActive(pathname, item.href);
                      return (
                        <Link
                          key={item.id}
                          href={item.href || "#"}
                          data-no-link-hover
                          className={cn(
                            "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[0.82rem] transition-smooth",
                            active
                              ? "bg-brand-gradient text-primary-foreground font-semibold shadow-glow"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                          onClick={() => setMobileOpen(false)}
                        >
                          {/* Horizontal connecting branch connector */}
                          <span
                            className={cn(
                              "absolute -left-[16px] top-1/2 w-3 h-[2px] -translate-y-1/2 rounded-full transition-colors",
                              active
                                ? "bg-emerald-600 dark:bg-emerald-400"
                                : "bg-emerald-500/35 dark:bg-emerald-400/30 group-hover:bg-primary/60"
                            )}
                          />
                          <span
                            className={cn(
                              "shrink-0 transition-colors",
                              active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                            )}
                          >
                            {item.icon}
                          </span>
                          <span className="truncate">{t(item.labelKey)}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
      </nav>

      {/* Unified Professional Sidebar Footer */}
      <div className="shrink-0 border-t border-sidebar-border/70 bg-sidebar/50 p-2.5 space-y-2">
        {/* User Card */}
        {session && (
          <div
            className={cn(
              "flex items-center gap-2.5 rounded-xl bg-card/60 p-2 border border-sidebar-border/50 shadow-xs backdrop-blur-sm transition-smooth",
              isCollapsed ? "justify-center p-1.5" : ""
            )}
          >
            {/* Avatar with live status dot */}
            <div className="relative shrink-0">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white font-display text-xs font-bold shadow-xs">
                {initials}
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card shadow-xs" />
            </div>

            {/* User details */}
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs font-bold text-foreground leading-tight">{displayName}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-1">
                  <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[0.65rem] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    {naturalRole}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hotel Scope Selector if applicable */}
        {session && !isCollapsed && hotels.length > 1 && (
          <div className="px-0.5">
            <select
              aria-label={t("auth.switchHotelTitle")}
              defaultValue={session.activeHotel?.id ?? ""}
              onChange={async (e) => {
                const id = e.target.value;
                if (!id) return;
                await switchHotelAction(id);
                router.refresh();
              }}
              className="w-full rounded-lg border border-sidebar-border/80 bg-background/80 px-2 py-1.5 text-[0.72rem] text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
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
          </div>
        )}

        {/* Quick Action Buttons Row */}
        <div className={cn("flex items-center gap-1.5", isCollapsed ? "flex-col" : "")}>
          <button
            type="button"
            onClick={async () => {
              await logoutAction();
            }}
            title={t("common.logout")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg py-1.5 px-2.5 text-xs font-medium text-muted-foreground transition-smooth hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20",
              isCollapsed && "w-full justify-center p-2"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span className="truncate">{t("common.logout")}</span>}
          </button>

          <button
            type="button"
            title={isCollapsed ? t("common.expandSidebar") : t("common.collapseSidebar")}
            className={cn(
              "flex items-center justify-center rounded-lg py-1.5 px-2.5 text-xs font-medium text-muted-foreground transition-smooth hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border border-transparent hover:border-sidebar-border/60",
              isCollapsed ? "w-full p-2" : ""
            )}
            onClick={toggleCollapse}
          >
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4 shrink-0" /> : <PanelLeftClose className="h-4 w-4 shrink-0" />}
            {!isCollapsed && <span className="ml-1.5 hidden xl:inline">{t("common.collapse")}</span>}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden lg:block border-r border-sidebar-border/70",
          "bg-card/85 backdrop-blur-xl transition-[width] duration-300"
        )}
        style={{ width: isCollapsed ? 72 : 260 }}
      >
        {sidebarInner}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[280px] border-r border-sidebar-border/70 bg-card shadow-2xl">
            {sidebarInner}
          </aside>
        </div>
      )}
    </>
  );
}