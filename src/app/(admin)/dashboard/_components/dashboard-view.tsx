"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  ClipboardCheck,
  ShieldAlert,
  Building2,
  AlertTriangle,
  Flame,
  ArrowRight,
  PlusCircle,
  FolderTree,
  UserCheck,
  Hotel,
  FileSpreadsheet,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/context/SessionContext";
import { isCorporate } from "@/lib/auth/session";
import { ApiError } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi";
import { useState } from "react";
import { RiskMap } from "./risk-map";
import { RiskIndexPanel } from "./risk-index-panel";
import { OperationPanels } from "./operation-panels";
import {
  DashboardAuditSummaryCards,
  type DashboardBreakdownsData,
} from "./dashboard-audit-summary-cards";

type Overview = components["schemas"]["DashboardOverview"];
type HeatmapPoint = components["schemas"]["HeatmapPoint"];

export interface DashboardPayload {
  overview: Overview | null;
  heatmap: HeatmapPoint[];
  riskIndex: HeatmapPoint[];
  breakdowns?: DashboardBreakdownsData | null;
  error: ApiError | null;
}

function DashboardError({ error }: { error: ApiError }) {
  const t = useTranslations();
  return (
    <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-8 text-center backdrop-blur-xl shadow-2xl">
      <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
      <p className="mt-4 font-semibold text-lg">{t("dashboard.errorTitle")}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        {error.status === 0 ? t("dashboard.errorNetwork") : t("dashboard.errorServer", { status: error.status })}
      </p>
      <Link
        href="/dashboard"
        className="mt-5 inline-block rounded-xl bg-brand-gradient px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:opacity-90 cursor-pointer"
      >
        {t("dashboard.retry")}
      </Link>
    </div>
  );
}

export function DashboardView({ payload }: { payload: DashboardPayload }) {
  const t = useTranslations();
  const { overview, heatmap, riskIndex, breakdowns, error } = payload;
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);

  if (error) return <DashboardError error={error} />;

  const sla = overview?.sla ?? {};
  const capaActive = overview?.capa_active ?? 0;
  const overdueCount = sla.overdue ?? 0;
  const hotelsTotal = overview?.hotels_total ?? heatmap.length;
  const hotelsWithRisk = overview?.hotels_with_risk ?? 0;
  const auditsYtd = overview?.audits_ytd ?? 0;
  const auditsToday = overview?.audits_today ?? 0;
  const lifeSafetyOpen = overview?.life_safety_open ?? 0;
  const findingsTotal = overview?.findings_total ?? 0;

  return (
    <div className="space-y-7 pb-10">
      {/* 1. LUXURY HERO BANNER & KPI METRICS */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 dark:from-slate-900/90 dark:via-slate-950/90 dark:to-emerald-950/40 p-6 md:p-8 shadow-2xl backdrop-blur-2xl transition-colors">
        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />

        {/* Top Header Row */}
        <div className="relative flex flex-wrap items-center justify-between gap-5 border-b border-border/40 pb-6">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-primary-foreground shadow-[0_0_25px_rgba(16,185,129,0.35)]">
              <LayoutDashboard className="h-7 w-7" />
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-display text-3xl font-bold tracking-wide md:text-4xl text-foreground">
                  {t("dashboard.title")}
                </h1>
                <Badge variant="gold" className="text-[10px] tracking-wider uppercase font-mono">
                  Live 2026
                </Badge>
              </div>
              <p className="mt-1 text-xs md:text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/dashboard/audits/create">
              <Button className="h-9.5 cursor-pointer rounded-xl bg-brand-gradient px-4 text-xs font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 hover:scale-[1.02]">
                <PlusCircle className="h-4 w-4 mr-1.5" />
                {t("dashboard.newAudit")}
              </Button>
            </Link>
            <Link href="/dashboard/capa">
              <Button
                variant="outline"
                className="h-9.5 cursor-pointer rounded-xl border-border/60 bg-card/80 dark:bg-slate-900/80 px-4 text-xs font-semibold hover:bg-muted hover:text-foreground"
              >
                <ClipboardCheck className="h-4 w-4 mr-1.5 text-primary" />
                {t("dashboard.startAudit")}
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Rich KPI Metric Cards */}
        <div className="relative mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Hotels in Scope */}
          <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/90 dark:bg-slate-900/60 p-4.5 transition-all duration-300 hover:border-emerald-500/40 hover:bg-card dark:hover:bg-slate-900/90 shadow-xs hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("dashboard.statHotels")}
              </span>
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <Building2 className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-foreground">{hotelsTotal}</span>
              <span className="text-xs text-muted-foreground">Properti</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border/30 pt-2 text-xs">
              <span className="text-muted-foreground">{t("dashboard.statHotelsHint", { count: hotelsWithRisk })}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>

          {/* 2. Audits YTD */}
          <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/90 dark:bg-slate-900/60 p-4.5 transition-all duration-300 hover:border-blue-500/40 hover:bg-card dark:hover:bg-slate-900/90 shadow-xs hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("dashboard.statAudits")}
              </span>
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                <ClipboardCheck className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-foreground">{auditsYtd}</span>
              <span className="text-xs text-muted-foreground">Sesi Selesai</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border/30 pt-2 text-xs">
              <span className="text-muted-foreground">{t("dashboard.statAuditsHint", { count: auditsToday })}</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-500/30 text-blue-600 dark:text-blue-400">
                Live
              </Badge>
            </div>
          </div>

          {/* 3. Active CAPA */}
          <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/90 dark:bg-slate-900/60 p-4.5 transition-all duration-300 hover:border-amber-500/40 hover:bg-card dark:hover:bg-slate-900/90 shadow-xs hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("dashboard.statCapaActive")}
              </span>
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <AlertTriangle className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-foreground">{capaActive}</span>
              <span className="text-xs text-muted-foreground">Tiket Terbuka</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border/30 pt-2 text-xs">
              <span className="text-rose-600 dark:text-rose-400 font-medium">
                {t("dashboard.statCapaActiveHint", { count: overdueCount })}
              </span>
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            </div>
          </div>

          {/* 4. Life-Safety Open */}
          <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/90 dark:bg-slate-900/60 p-4.5 transition-all duration-300 hover:border-rose-500/40 hover:bg-card dark:hover:bg-slate-900/90 shadow-xs hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("dashboard.statLifeSafety")}
              </span>
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
                <Flame className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-rose-600 dark:text-rose-400">{lifeSafetyOpen}</span>
              <span className="text-xs text-muted-foreground">Hotel Kritis</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border/30 pt-2 text-xs">
              <span className="text-muted-foreground">{t("dashboard.statLifeSafetyHint", { count: findingsTotal })}</span>
              <span className="font-mono text-[11px] text-rose-600 dark:text-rose-400 font-bold">URGENT</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PETA RISIKO (COMMAND CENTER) + INDEKS RISIKO PROPERTI */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card variant="glass" className="lg:col-span-2 overflow-hidden border-border/60 shadow-2xl">
          <CardHeader className="pb-3 pt-5 px-5 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary border border-primary/30">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <CardTitle className="text-xl">{t("dashboard.riskMapTitle")}</CardTitle>
                  <CardDescription className="text-xs">{t("dashboard.riskMapSubtitle")}</CardDescription>
                </div>
              </div>
              <Link
                href="/dashboard/hotels"
                className="hidden sm:flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                {t("dashboard.viewHotels")} <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <RiskMap
              points={heatmap}
              selectedHotelId={selectedHotelId}
              onSelectHotel={(hId) => setSelectedHotelId(hId)}
            />
          </CardContent>
        </Card>

        {/* Ranked Risk Index List */}
        <div className="h-full">
          <RiskIndexPanel items={riskIndex} />
        </div>
      </div>

      {/* 2.5 4 CARDS: AUDIT SUMMARY & SCORE BREAKDOWNS SYNCHRONIZED WITH MAP */}
      <DashboardAuditSummaryCards
        selectedHotelId={selectedHotelId}
        onResetSelection={() => setSelectedHotelId(null)}
        initialBreakdowns={breakdowns}
      />

      {/* 3. KESEHATAN SLA + PIPELINE SIKLUS CAPA + INSIGHT CERDAS */}
      <OperationPanels overview={overview ?? {}} />

      {/* 4. OPERATOR CONTEXT & COMMAND CENTER HUB */}
      <ScopeAndQuick />
    </div>
  );
}

function ScopeAndQuick() {
  const t = useTranslations();
  const { session, hotels, roleCodes: codes } = useSession();

  const quickModules = [
    {
      href: "/dashboard/audits",
      icon: ClipboardCheck,
      title: t("dashboard.quickAudit"),
      desc: t("dashboard.quickAuditDesc"),
      color: "from-emerald-500/15 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    },
    {
      href: "/dashboard/capa",
      icon: ShieldAlert,
      title: t("dashboard.quickCapa"),
      desc: t("dashboard.quickCapaDesc"),
      color: "from-amber-500/15 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    },
    {
      href: "/dashboard/hotels",
      icon: Hotel,
      title: t("dashboard.quickHotels"),
      desc: t("dashboard.quickHotelsDesc"),
      color: "from-blue-500/15 to-cyan-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    },
    {
      href: "/dashboard/config/checklist",
      icon: FileSpreadsheet,
      title: t("dashboard.quickChecklist"),
      desc: t("dashboard.quickChecklistDesc"),
      color: "from-purple-500/15 to-pink-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Profil Operator & Sesi Aktif */}
      <Card variant="glass" className="border-border/60 shadow-xl">
        <CardHeader className="pb-3 pt-5 px-5 border-b border-border/40">
          <CardTitle className="text-lg flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary border border-primary/30">
              <UserCheck className="h-4 w-4" />
            </span>
            {t("dashboard.operatorProfile")}
          </CardTitle>
          <CardDescription className="text-xs">Identitas & skop operasional sesi aktif</CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {session ? (
            <div className="space-y-3.5">
              {/* User Avatar + Identity */}
              <div className="flex items-center gap-3.5 rounded-2xl border border-border/50 bg-muted/40 dark:bg-slate-900/60 p-3.5">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-gradient font-display text-lg font-bold text-primary-foreground shadow-glow">
                  {session.user.name?.charAt(0) || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-foreground truncate">{session.user.name || "Operator"}</p>
                  <p className="text-xs text-muted-foreground truncate">{session.user.email || "—"}</p>
                </div>
                <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px]">
                  {t("dashboard.operatorActive")}
                </Badge>
              </div>

              {/* Roles & Scope details */}
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div className="rounded-xl border border-border/50 bg-muted/30 dark:bg-slate-900/40 p-3">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    {t("dashboard.operatorRole")}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {codes.length > 0 ? (
                      codes.map((code) => (
                        <Badge key={code} variant="secondary" className="font-mono text-[10px]">
                          {code}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">—</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border/50 bg-muted/30 dark:bg-slate-900/40 p-3">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    {t("dashboard.operatorScope")}
                  </p>
                  <p className="mt-1 font-semibold text-xs text-foreground truncate">
                    {session.activeHotel?.name ?? t("dashboard.scopeAllHotels")}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isCorporate(session)
                       ? t("dashboard.scopeCorporate")
                      : t("dashboard.scopeAssigned", { count: hotels.length })}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t("dashboard.noSession")}</p>
          )}
        </CardContent>
      </Card>

      {/* Pusat Akses Operasional (Command Hub Grid) */}
      <Card variant="glass" className="lg:col-span-2 border-border/60 shadow-xl">
        <CardHeader className="pb-3 pt-5 px-5 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary border border-primary/30">
                <FolderTree className="h-4 w-4" />
              </span>
              <div>
                <CardTitle className="text-lg">{t("dashboard.quickHubTitle")}</CardTitle>
                <CardDescription className="text-xs">{t("dashboard.quickHubSubtitle")}</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              4 Modul Inti
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid gap-3.5 sm:grid-cols-2">
            {quickModules.map((mod) => (
              <Link
                key={mod.href}
                href={mod.href}
                className="group relative flex items-start gap-3.5 rounded-2xl border border-border/60 bg-card/80 hover:bg-card dark:bg-slate-900/50 dark:hover:bg-slate-900/90 p-4 transition-all duration-300 hover:border-primary/40 hover:scale-[1.01] cursor-pointer shadow-xs hover:shadow-md"
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br border ${mod.color} shadow-sm`}
                >
                  <mod.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      {mod.title}
                    </p>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{mod.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}