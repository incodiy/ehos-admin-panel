"use client";

import { useMemo } from "react";
import {
  ShieldCheck,
  UtensilsCrossed,
  Sparkles,
  BedDouble,
  BarChart3,
  TrendingUp,
  Award,
  ChevronRight,
  ArrowUpRight,
  PieChart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/LanguageContext";
import type { DashboardBreakdownsData, HotelAuditSummary } from "@/app/actions/audit";

interface AuditHeroAnalyticsProps {
  breakdowns: DashboardBreakdownsData | null;
  hotelSummaries: HotelAuditSummary[];
  onOpenModal: (tab?: "overview" | "security" | "kitchen" | "housekeeping" | "trend", hotelId?: string | null) => void;
  selectedYear?: number;
}

export function AuditHeroAnalytics({
  breakdowns,
  hotelSummaries,
  onOpenModal,
  selectedYear,
}: AuditHeroAnalyticsProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const sec = breakdowns?.security_summary;
  const kfb = breakdowns?.kitchen_summary;
  const hk = breakdowns?.housekeeping_section_summary;
  const rc = breakdowns?.housekeeping_room_summary;

  // Compute stats across hotelSummaries
  const stats = useMemo<{
    totalHotels: number;
    groupAvg: number | null;
    totalPeriods: number;
    publishedCount: number;
    inProgressCount: number;
    draftCount: number;
    bestHotel: HotelAuditSummary | null;
    worstHotel: HotelAuditSummary | null;
  }>(() => {
    const totalHotels = hotelSummaries.length;
    let totalScoreSum = 0;
    let scoredCount = 0;
    let totalPeriods = 0;
    let publishedCount = 0;
    let inProgressCount = 0;
    let draftCount = 0;

    let bestHotel: HotelAuditSummary | null = null;
    let worstHotel: HotelAuditSummary | null = null;

    hotelSummaries.forEach((h) => {
      totalPeriods += h.total_periods;
      if (h.cumulative_average_score !== null && h.cumulative_average_score !== undefined) {
        const sc = Number(h.cumulative_average_score);
        totalScoreSum += sc;
        scoredCount += 1;

        if (!bestHotel || sc > Number(bestHotel.cumulative_average_score || 0)) {
          bestHotel = h;
        }
        if (!worstHotel || sc < Number(worstHotel.cumulative_average_score || 100)) {
          worstHotel = h;
        }
      }

      if (h.last_status === "PUBLISHED") publishedCount++;
      else if (h.last_status === "IN_PROGRESS" || h.last_status === "SUBMITTED") inProgressCount++;
      else draftCount++;
    });

    const groupAvg = scoredCount > 0 ? totalScoreSum / scoredCount : null;

    return {
      totalHotels,
      groupAvg,
      totalPeriods,
      publishedCount,
      inProgressCount,
      draftCount,
      bestHotel,
      worstHotel,
    };
  }, [hotelSummaries]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-b from-card via-card/80 to-card/50 dark:from-slate-900/90 dark:via-slate-900/70 dark:to-slate-950/60 p-5 sm:p-6 shadow-md backdrop-blur-xl transition-all">
      {/* Background Decorative Blur */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* Header Row */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                {isEn ? "Compliance & Audit Intelligence Summary" : "Ringkasan Intelijen Kepatuhan & Audit"}
              </h2>
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-[10px] hidden sm:inline-flex">
                {selectedYear ? (isEn ? `Year ${selectedYear}` : `Tahun ${selectedYear}`) : (isEn ? "All Periods" : "Semua Periode")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {isEn
                ? `Monitoring quality, security & operational standards across all ${stats.totalHotels} hotel properties`
                : `Monitoring performa kualitas, keamanan & standar operasional seluruh ${stats.totalHotels} unit hotel`}
            </p>
          </div>
        </div>

        {/* Action Button: Open Visual Intelligence Modal */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenModal("overview", null)}
            className="group inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2 text-xs font-semibold text-white shadow-glow transition-all hover:opacity-95 hover:shadow-lg active:scale-95 cursor-pointer"
          >
            <PieChart className="h-4 w-4" />
            <span>{isEn ? "Open Visual Intelligence & Charts" : "Buka Visual Intelligence & Grafik"}</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>

      {/* KPI Grid (4 Departments + Overall Score) */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
        {/* Card 1: Security & Risk */}
        <div
          onClick={() => onOpenModal("security", null)}
          className="group cursor-pointer rounded-2xl border border-border/60 bg-background/60 dark:bg-slate-900/50 p-4 transition-all hover:border-blue-500/50 hover:bg-blue-500/5 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-blue-500 transition-colors">
              Security & Risk
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-bold text-foreground">
                {sec?.overall_score !== undefined ? `${Number(sec.overall_score).toFixed(1)}%` : "—"}
              </span>
            </div>
            {sec?.overall_score !== undefined && (
              <Badge variant="outline" className={`text-[10px] ${sec.is_pass ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500" : "border-rose-500/40 bg-rose-500/10 text-rose-500"}`}>
                {sec.is_pass ? (isEn ? "Pass" : "Lulus") : (isEn ? "Action Required" : "Perlu Aksi")}
              </Badge>
            )}
          </div>

          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${Math.min(100, sec?.overall_score ?? 0)}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{sec?.sections?.length ?? 0} {isEn ? "Parameter Sections" : "Seksi Parameter"}</span>
            <span className="font-medium text-blue-500 flex items-center gap-0.5 group-hover:underline">
              {isEn ? "Details" : "Detail"} <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </div>

        {/* Card 2: Kitchen & F&B */}
        <div
          onClick={() => onOpenModal("kitchen", null)}
          className="group cursor-pointer rounded-2xl border border-border/60 bg-background/60 dark:bg-slate-900/50 p-4 transition-all hover:border-teal-500/50 hover:bg-teal-500/5 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-teal-500 transition-colors">
              Kitchen & Food Safety
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-teal-500/10 text-teal-500 group-hover:scale-110 transition-transform">
              <UtensilsCrossed className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-bold text-foreground">
                {kfb?.overall_score !== undefined ? `${Number(kfb.overall_score).toFixed(1)}%` : "—"}
              </span>
            </div>
            {kfb?.overall_score !== undefined && (
              <Badge variant="outline" className={`text-[10px] ${kfb.is_pass ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500" : "border-rose-500/40 bg-rose-500/10 text-rose-500"}`}>
                {kfb.is_pass ? (isEn ? "Pass" : "Lulus") : (isEn ? "Action Required" : "Perlu Aksi")}
              </Badge>
            )}
          </div>

          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-teal-500 transition-all duration-500"
              style={{ width: `${Math.min(100, kfb?.overall_score ?? 0)}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{kfb?.sections?.length ?? 0} {isEn ? "Kitchen Hygiene Areas" : "Area Higiene Dapur"}</span>
            <span className="font-medium text-teal-500 flex items-center gap-0.5 group-hover:underline">
              {isEn ? "Details" : "Detail"} <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </div>

        {/* Card 3: Housekeeping General */}
        <div
          onClick={() => onOpenModal("housekeeping", null)}
          className="group cursor-pointer rounded-2xl border border-border/60 bg-background/60 dark:bg-slate-900/50 p-4 transition-all hover:border-purple-500/50 hover:bg-purple-500/5 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-purple-500 transition-colors">
              Housekeeping Ops
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-bold text-foreground">
                {hk?.overall_score !== undefined ? `${Number(hk.overall_score).toFixed(1)}%` : "—"}
              </span>
            </div>
            {hk?.overall_score !== undefined && (
              <Badge variant="outline" className={`text-[10px] ${hk.is_pass ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500" : "border-rose-500/40 bg-rose-500/10 text-rose-500"}`}>
                {hk.is_pass ? (isEn ? "Pass" : "Lulus") : (isEn ? "Action Required" : "Perlu Aksi")}
              </Badge>
            )}
          </div>

          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-purple-500 transition-all duration-500"
              style={{ width: `${Math.min(100, hk?.overall_score ?? 0)}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{hk?.sections?.length ?? 0} {isEn ? "Operational Standards" : "Standar Operasional"}</span>
            <span className="font-medium text-purple-500 flex items-center gap-0.5 group-hover:underline">
              {isEn ? "Details" : "Detail"} <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </div>

        {/* Card 4: Room Check Physical */}
        <div
          onClick={() => onOpenModal("housekeeping", null)}
          className="group cursor-pointer rounded-2xl border border-border/60 bg-background/60 dark:bg-slate-900/50 p-4 transition-all hover:border-amber-500/50 hover:bg-amber-500/5 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-amber-500 transition-colors">
              {isEn ? "Physical Room Check" : "Room Check Fisik"}
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
              <BedDouble className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-bold text-foreground">
                {rc && rc.subtotal > 0
                  ? `${Math.round((rc.total_score / rc.subtotal) * 100)}%`
                  : "—"}
              </span>
            </div>
            {rc && rc.subtotal > 0 && (
              <Badge variant="outline" className={`text-[10px] ${(rc.total_score / rc.subtotal * 100) >= 80 ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500" : "border-rose-500/40 bg-rose-500/10 text-rose-500"}`}>
                {(rc.total_score / rc.subtotal * 100) >= 80 ? (isEn ? "Pass" : "Lulus") : (isEn ? "Action Required" : "Perlu Aksi")}
              </Badge>
            )}
          </div>

          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${Math.min(100, rc && rc.subtotal > 0 ? (rc.total_score / rc.subtotal * 100) : 0)}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{rc?.categories?.length ?? 0} {isEn ? "Inspection Categories" : "Kategori Inspeksi"}</span>
            <span className="font-medium text-amber-500 flex items-center gap-0.5 group-hover:underline">
              {isEn ? "Details" : "Detail"} <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Highlights & Portfolio Bar */}
      <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/40 bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-emerald-500" />
            <span>
              {isEn ? "Top Performer: " : "Performa Tertinggi: "}
              {stats.bestHotel ? (
                <strong className="text-foreground">
                  {stats.bestHotel.hotel_name} ({Number(stats.bestHotel.cumulative_average_score).toFixed(1)}%)
                </strong>
              ) : (
                <span className="text-muted-foreground italic">—</span>
              )}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span>
              {isEn ? "Portfolio Average: " : "Rata-rata Portfolio: "}
              <strong className="text-foreground font-mono">
                {stats.groupAvg !== null ? `${stats.groupAvg.toFixed(1)}%` : "—"}
              </strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            {stats.publishedCount} {isEn ? "Published" : "Published"}
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            {stats.inProgressCount} {isEn ? "In Progress" : "In Progress"}
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-slate-400"></span>
            {stats.draftCount} {isEn ? "Draft" : "Draft"}
          </span>
        </div>
      </div>
    </div>
  );
}
