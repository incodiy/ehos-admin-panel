"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme } from "@/context/ThemeContext";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell, ChevronRight, Globe, Menu, Moon, Search, Sun } from "lucide-react";
import type { Language } from "@/i18n/config";
import { setLocaleAction } from "@/app/actions/auth";

/* Slugs ke label navigasi (fallback dari common/nav). */
const slugLabelMap: Record<string, string> = {
  dashboard: "common.dashboard",
  audits: "nav.audits",
  capa: "nav.capaTickets",
  leads: "nav.leads",
  quotations: "nav.quotations",
  billing: "nav.billing",
  hotels: "nav.hotelCatalog",
  regions: "nav.regions",
  brands: "nav.brands",
  translations: "nav.translations",
  users: "nav.users",
  roles: "nav.roles",
  "audit-log": "nav.auditLog",
  create: "common.create",
  edit: "common.edit",
};

export function Header() {
  const t = useTranslations();
  const { language, setLanguage } = useLanguage();
  const { isCollapsed, toggleCollapse, setMobileOpen } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const crumbs = pathname.split("/").filter(Boolean);

  return (
    <header className="sticky top-0 z-30 border-b border-sidebar-border/60 bg-card/70 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-3 sm:px-4 md:px-6">
        {/* Left: toggles */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <Menu className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Breadcrumb */}
        <nav className="hidden min-w-0 items-center gap-1.5 text-sm text-muted-foreground md:flex" aria-label="Breadcrumb">
          {crumbs.map((segment, idx) => {
            const label = slugLabelMap[segment]
              ? t(slugLabelMap[segment])
              : segment.charAt(0).toUpperCase() + segment.slice(1);
            const isLast = idx === crumbs.length - 1;
            return (
              <span key={idx} className="flex items-center gap-1.5">
                {idx > 0 && <ChevronRight className="h-3.5 w-3.5" />}
                {isLast ? (
                  <span className="font-semibold text-foreground">{label}</span>
                ) : (
                  <Link href={"/" + crumbs.slice(0, idx + 1).join("/")} data-no-link-hover className="link-hover rounded px-1 hover:text-foreground">
                    {label}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Search (decorative untuk scaffold; wiring ke API/command-palette di G3) */}
          <div className="relative hidden w-56 lg:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-9 rounded-full bg-background/60 pl-9" placeholder={t("common.search")} />
          </div>

          {/* Language */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const next: Language = language === "id" ? "en" : "id";
              setLanguage(next);
              // Sinkron preferensi user (F-22); firewall tidak laknat bila backend 4xx.
              void setLocaleAction(next);
            }}
            className="gap-1.5"
            aria-label={t("common.language")}
          >
            <Globe className="h-4 w-4" />
            <span className="uppercase">{language}</span>
          </Button>

          {/* Theme */}
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          {/* Notif */}
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

export type { Language };