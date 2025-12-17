"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { StatusPill, type ToneKey } from "@/components/admin/data-table";
import { ApiError } from "@/lib/api/client";
import { useLanguage } from "@/context/LanguageContext";
import {
  Building2,
  ChevronDown,
  ExternalLink,
  Plus,
  Search,
  SlidersHorizontal,
  Calendar,
  Layers,
  BarChart3,
  X,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react";
import type { HotelAuditSummary, AuditPeriodRow, DashboardBreakdownsData } from "@/app/actions/audit";
import { AuditHeroAnalytics } from "./_components/audit-hero-analytics";
import { AuditAnalyticsModal } from "./_components/audit-analytics-modal";

const STATUS_OPTIONS = [
  { key: "DRAFT", label_id: "Draft", label_en: "Draft", dotColor: "bg-slate-400" },
  { key: "IN_PROGRESS", label_id: "In Progress", label_en: "In Progress", dotColor: "bg-amber-500 animate-pulse" },
  { key: "SUBMITTED", label_id: "Submitted", label_en: "Submitted", dotColor: "bg-blue-500" },
  { key: "PUBLISHED", label_id: "Published", label_en: "Published", dotColor: "bg-emerald-500" },
] as const;

const DEPT_OPTIONS = [
  { key: "GM", label_id: "GM", label_en: "GM", icon: Building2 },
  { key: "HOUSEKEEPING", label_id: "Housekeeping", label_en: "Housekeeping", icon: Sparkles },
  { key: "KITCHEN_FB", label_id: "Kitchen & F&B", label_en: "Kitchen & F&B", icon: UtensilsCrossed },
  { key: "SECURITY_RISK", label_id: "Security & Risk", label_en: "Security & Risk", icon: ShieldCheck },
] as const;

function getDynamicYearOptions(): number[] {
  const currentYear = new Date().getFullYear();
  // Strictly 1 year forward (+1) to 2 years back (-2) -> 4 years in total
  return [currentYear + 1, currentYear, currentYear - 1, currentYear - 2];
}

const STATUS_TONE: Record<string, ToneKey> = {
  DRAFT: "off",
  IN_PROGRESS: "wait",
  SUBMITTED: "wait",
  PUBLISHED: "on",
};

interface HotelOption {
  id: string;
  code: string;
  name: string;
}

function getLocalizedMonthName(monthName: string, isEn: boolean): string {
  if (!isEn || !monthName) return monthName;
  const idToEn: Record<string, string> = {
    Januari: "January",
    Februari: "February",
    Maret: "March",
    April: "April",
    Mei: "May",
    Juni: "June",
    Juli: "July",
    Agustus: "August",
    September: "September",
    Oktober: "October",
    November: "November",
    Desember: "December",
  };
  return idToEn[monthName] || monthName;
}

export function AuditSessionsClient({
  hotelSummaries,
  initialBreakdowns,
  error,
  filters,
  hotels = [],
  canCreate = false,
}: {
  hotelSummaries: HotelAuditSummary[];
  initialBreakdowns?: DashboardBreakdownsData | null;
  error: ApiError | null;
  filters: { department?: string; status?: string; year?: number };
  hotels?: HotelOption[];
  canCreate?: boolean;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguage();
  const isEn = language === "en";

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalHotelId, setModalHotelId] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<"overview" | "security" | "kitchen" | "housekeeping" | "trend">("overview");

  const [expandedHotels, setExpandedHotels] = useState<Set<string>>(() => {
    if (hotelSummaries.length > 0) {
      return new Set([hotelSummaries[0].hotel_id]);
    }
    return new Set();
  });

  const [searchQuery, setSearchQuery] = useState("");

  const toggleExpand = (hotelId: string) => {
    setExpandedHotels((prev) => {
      const next = new Set(prev);
      if (next.has(hotelId)) {
        next.delete(hotelId);
      } else {
        next.add(hotelId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedHotels(new Set(hotelSummaries.map((h) => h.hotel_id)));
  };

  const collapseAll = () => {
    setExpandedHotels(new Set());
  };

  function buildHref(next: { department?: string; status?: string; year?: number }) {
    const merged = { ...filters, ...next };
    const sp = new URLSearchParams();
    if (merged.department) sp.set("department", merged.department);
    if (merged.status) sp.set("status", merged.status);
    if (merged.year) sp.set("year", String(merged.year));
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const hasActiveFilters = Boolean(filters.department || filters.status || filters.year || searchQuery);

  const resetFilters = () => {
    setSearchQuery("");
    router.push(pathname);
  };

  const openVisualModal = (
    tab: "overview" | "security" | "kitchen" | "housekeeping" | "trend" = "overview",
    hotelId: string | null = null
  ) => {
    setModalTab(tab);
    setModalHotelId(hotelId);
    setModalOpen(true);
  };

  // Filter hotels by client-side search query
  const filteredHotels = hotelSummaries.filter((h) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      h.hotel_code.toLowerCase().includes(q) ||
      h.hotel_name.toLowerCase().includes(q) ||
      h.city.toLowerCase().includes(q) ||
      h.brand_tier.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. HERO ANALYTICS BANNER (Above Filter Bar) */}
      <AuditHeroAnalytics
        breakdowns={initialBreakdowns || null}
        hotelSummaries={hotelSummaries}
        onOpenModal={openVisualModal}
        selectedYear={filters.year}
      />

      {/* 2. REDESIGNED MODERN FILTER & ACTION BAR */}
      <div className="rounded-3xl border border-border/70 bg-card/70 dark:bg-slate-900/60 p-4 sm:p-5 shadow-sm backdrop-blur-xl transition-all space-y-4">
        {/* Top Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative min-w-[280px] flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={isEn ? "Search hotel (name / code / city)..." : "Cari hotel (nama / kode / kota)..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-2xl border border-border/70 bg-background/80 pl-10 pr-9 text-xs shadow-inner transition-smooth placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Year Segment Pill Selector */}
            <div className="hidden lg:flex items-center rounded-2xl border border-border/60 bg-muted/40 p-1">
              <Link
                href={buildHref({ year: undefined })}
                className={`rounded-xl px-3 py-1 text-xs font-semibold transition-smooth ${
                  !filters.year
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isEn ? "All Years" : "Semua Tahun"}
              </Link>
              {getDynamicYearOptions().map((y) => {
                const active = filters.year === y;
                return (
                  <Link
                    key={y}
                    href={buildHref({ year: active ? undefined : y })}
                    className={`rounded-xl px-2.5 py-1 font-mono text-xs font-semibold transition-smooth ${
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {y}
                  </Link>
                );
              })}
            </div>

            {/* Expand / Collapse All */}
            <button
              onClick={expandedHotels.size === hotelSummaries.length ? collapseAll : expandAll}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-border/70 bg-background/70 px-3.5 py-2 text-xs font-medium text-foreground shadow-sm transition-smooth hover:border-primary/40 hover:bg-accent/50 cursor-pointer"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              <span>
                {expandedHotels.size === hotelSummaries.length
                  ? (isEn ? "Collapse All" : "Ciutkan Semua")
                  : (isEn ? "Expand All" : "Perluas Semua")}
              </span>
            </button>

            {/* Create Audit Session Button */}
            {canCreate && (
              <Link
                href="/dashboard/audits/create"
                className="inline-flex items-center gap-1.5 rounded-2xl bg-brand-gradient px-4 py-2 text-xs font-semibold text-white shadow-glow transition-all hover:opacity-95 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>{isEn ? "+ Create Audit Session" : "+ Buat Sesi Audit"}</span>
              </Link>
            )}
          </div>
        </div>

        {/* Bottom Filter Chips Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-3">
          {/* Left: Department Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
              {isEn ? "Department:" : "Departemen:"}
            </span>
            <Link
              href={buildHref({ department: undefined })}
              className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition-smooth ${
                !filters.department
                  ? "border border-primary/50 bg-primary/15 text-primary"
                  : "border border-border/60 bg-background/60 text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {isEn ? "All" : "Semua"}
            </Link>
            {DEPT_OPTIONS.map((dept) => {
              const active = filters.department === dept.key;
              const IconComponent = dept.icon;
              return (
                <Link
                  key={dept.key}
                  href={buildHref({ department: active ? undefined : dept.key })}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-smooth ${
                    active
                      ? "border border-primary/50 bg-primary/15 text-primary shadow-sm"
                      : "border border-border/60 bg-background/60 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  <IconComponent className="h-3.5 w-3.5" />
                  <span>{isEn ? dept.label_en : dept.label_id}</span>
                </Link>
              );
            })}
          </div>

          {/* Right: Status Filter Chips & Reset Button (Firmly aligned right) */}
          <div className="flex flex-wrap items-center gap-2.5 ml-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
                {isEn ? "Status:" : "Status:"}
              </span>
              {STATUS_OPTIONS.map((st) => {
                const active = filters.status === st.key;
                return (
                  <Link
                    key={st.key}
                    href={buildHref({ status: active ? undefined : st.key })}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-smooth ${
                      active
                        ? "border border-primary/50 bg-primary/15 text-primary shadow-sm"
                        : "border border-border/60 bg-background/60 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${st.dotColor}`}></span>
                    <span>{isEn ? st.label_en : st.label_id}</span>
                  </Link>
                );
              })}
            </div>

            {/* Reset Filters CTA */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary cursor-pointer border-l border-border/60 pl-2.5 ml-1"
              >
                <RotateCcw className="h-3 w-3" />
                <span>{isEn ? "Reset" : "Reset Filter"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-6 text-center text-sm text-destructive">
          <p className="font-semibold">{t("audit.errorTitle") || (isEn ? "Failed to Load Audit Sessions" : "Gagal Memuat Data Audit")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("audit.errorNetwork") || (isEn ? "Network error connecting to server." : "Terjadi kesalahan koneksi ke server.")}</p>
        </div>
      )}

      {/* 3. NESTED AUDIT TABLE */}
      {!error && (
        <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-4 pl-5 pr-3">{t("audit.cols.hotel") || (isEn ? "Hotel" : "Hotel")}</th>
                  <th className="px-3 py-4 w-24 text-center">{t("audit.cols.year") || (isEn ? "Year" : "Tahun")}</th>
                  <th className="px-3 py-4 w-28 text-center">{t("audit.cols.month") || (isEn ? "Month" : "Bulan")}</th>
                  <th className="px-3 py-4 w-40 text-center">{t("audit.cols.totalAvgScore") || (isEn ? "Total Average Score" : "Total Rata-rata Skor")}</th>
                  <th className="px-3 py-4 w-32 text-center">{t("audit.cols.status") || (isEn ? "Status" : "Status")}</th>
                  <th className="px-3 py-4 w-28 text-center">{t("audit.cols.auditCycles") || (isEn ? "Audit Cycles" : "Siklus Audit")}</th>
                  <th className="py-4 pl-3 pr-5 w-44 text-right">{isEn ? "Visual Analytics" : "Analisis Visual"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredHotels.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center text-sm text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Building2 className="h-9 w-9 text-muted-foreground/40" />
                        <span className="font-medium">{t("audit.empty") || (isEn ? "No hotel data matches the filters." : "Tidak ada data hotel yang sesuai filter.")}</span>
                        {hasActiveFilters && (
                          <button
                            onClick={resetFilters}
                            className="mt-2 text-xs font-semibold text-primary hover:underline"
                          >
                            {isEn ? "Clear all filters" : "Hapus semua filter"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredHotels.map((hotel) => {
                    const isExpanded = expandedHotels.has(hotel.hotel_id);
                    const lastPeriod = hotel.last_audit_period;

                    return (
                      <HotelRowGroup
                        key={hotel.hotel_id}
                        hotel={hotel}
                        isExpanded={isExpanded}
                        onToggle={() => toggleExpand(hotel.hotel_id)}
                        onOpenAnalytics={() => openVisualModal("overview", hotel.hotel_id)}
                        lastPeriod={lastPeriod}
                      />
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. INTERACTIVE AUDIT ANALYTICS MODAL */}
      <AuditAnalyticsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        hotelId={modalHotelId}
        hotels={hotels}
        onSelectHotel={(hId) => setModalHotelId(hId)}
        initialBreakdowns={initialBreakdowns}
        hotelSummaries={hotelSummaries}
        defaultTab={modalTab}
      />
    </div>
  );
}

function HotelRowGroup({
  hotel,
  isExpanded,
  onToggle,
  onOpenAnalytics,
  lastPeriod,
}: {
  hotel: HotelAuditSummary;
  isExpanded: boolean;
  onToggle: () => void;
  onOpenAnalytics: () => void;
  lastPeriod: HotelAuditSummary["last_audit_period"];
}) {
  const t = useTranslations();
  const { language } = useLanguage();
  const isEn = language === "en";
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <>
      {/* Primary Hotel Row (Level 1) */}
      <tr
        onClick={onToggle}
        className={`group cursor-pointer transition-colors duration-150 select-none ${
          isExpanded ? "bg-accent/40 hover:bg-accent/50" : "hover:bg-accent/25"
        }`}
      >
        {/* Kolom 1: Hotel (Kode, Nama, & Thumbnail Image) */}
        <td className="py-4 pl-5 pr-3">
          <div className="flex items-center gap-3.5">
            {/* Hotel Thumbnail Image */}
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-muted/50 shadow-sm">
              {hotel.hotel_image_url && !imgFailed ? (
                <img
                  src={hotel.hotel_image_url}
                  alt={hotel.hotel_name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={() => setImgFailed(true)}
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-primary/30 text-xs font-bold text-primary">
                  {hotel.hotel_code.slice(0, 3)}
                </div>
              )}
            </div>

            {/* Hotel Text Meta */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-lg border border-primary/20">
                  {hotel.hotel_code}
                </span>
                <span className="font-semibold text-foreground text-sm leading-tight group-hover:text-primary transition-colors">
                  {hotel.hotel_name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{hotel.brand_tier}</span>
                <span>•</span>
                <span>{hotel.city}</span>
              </div>
            </div>
          </div>
        </td>

        {/* Kolom 2: Tahun (Audit Terakhir) */}
        <td className="px-3 py-4 text-center font-mono font-medium text-foreground">
          {lastPeriod ? (
            <span className="inline-flex items-center justify-center rounded-xl bg-muted/70 px-2.5 py-1 text-xs font-semibold">
              {lastPeriod.year}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </td>

        {/* Kolom 3: Bulan (Audit Terakhir) */}
        <td className="px-3 py-4 text-center font-medium text-foreground">
          {lastPeriod ? (
            <span className="text-xs font-medium text-foreground/90">
              {getLocalizedMonthName(lastPeriod.month_name, isEn)}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </td>

        {/* Kolom 4: Total Average Score */}
        <td className="px-3 py-4 text-center">
          {hotel.cumulative_average_score !== null && hotel.cumulative_average_score !== undefined ? (
            <div className="inline-flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-foreground tabular-nums">
                {Number(hotel.cumulative_average_score).toFixed(1)}%
              </span>
              <ScoreGradeBadge score={hotel.cumulative_average_score} />
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic">{isEn ? "Awaiting audit" : "Menunggu audit"}</span>
          )}
        </td>

        {/* Kolom 5: Status Terakhir */}
        <td className="px-3 py-4 text-center">
          <StatusPill tone={STATUS_TONE[hotel.last_status] ?? "off"}>
            {t(`audit.status.${hotel.last_status}` as never) || hotel.last_status}
          </StatusPill>
        </td>

        {/* Kolom 6: Siklus Audit */}
        <td className="px-3 py-4 text-center">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-muted/50 border border-border/60 rounded-full px-2.5 py-0.5">
            <Layers className="h-3 w-3" />
            {hotel.total_periods} {isEn ? "Cycles" : "Siklus"}
          </span>
        </td>

        {/* Kolom 7: Action & Expand Toggle */}
        <td className="py-4 pl-3 pr-5 text-right">
          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onOpenAnalytics}
              title={isEn ? "View Visual Charts & Hotel Breakdown" : "Lihat Visual Chart & Breakdown Hotel"}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-[11px] font-semibold text-primary transition-smooth hover:bg-primary hover:text-primary-foreground shadow-sm active:scale-95 cursor-pointer"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Chart</span>
            </button>

            <button
              onClick={onToggle}
              className={`flex h-8 w-8 items-center justify-center rounded-xl border border-border/60 bg-background/80 text-muted-foreground transition-transform duration-200 cursor-pointer ${
                isExpanded ? "rotate-180 text-primary border-primary/40 bg-primary/10" : "group-hover:border-foreground/30"
              }`}
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>

      {/* Sub-Table Level 2 (Expanded Rows) */}
      {isExpanded && (
        <tr>
          <td colSpan={7} className="p-0 bg-muted/15 border-t border-b border-border/70">
            <div className="py-5 px-6 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    {isEn ? `Audit Cycle History — ${hotel.hotel_name}` : `Riwayat Siklus Audit — ${hotel.hotel_name}`}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isEn ? `(${hotel.periods.length} periods recorded)` : `(${hotel.periods.length} periode tercatat)`}
                  </span>
                </div>

                <button
                  onClick={onOpenAnalytics}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  <span>{isEn ? `Open Full Analysis ${hotel.hotel_name} →` : `Buka Analisis Lengkap ${hotel.hotel_name} →`}</span>
                </button>
              </div>

              {hotel.periods.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-3">
                  {isEn ? "No audit periods recorded yet." : "Belum ada rincian periode audit."}
                </p>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/70 bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <th className="py-3 pl-4 pr-2 w-16 text-center">{t("audit.cols.year") || (isEn ? "Year" : "Tahun")}</th>
                        <th className="px-2 py-3 w-24 text-center">{t("audit.cols.month") || (isEn ? "Month" : "Bulan")}</th>
                        <th className="px-3 py-3 w-40">{t("audit.cols.dateRange") || (isEn ? "Date Range" : "Rentang Tanggal")}</th>
                        <th className="px-3 py-3 w-28 text-center">{t("audit.cols.status") || (isEn ? "Status" : "Status")}</th>
                        <th className="px-3 py-3">{t("audit.cols.deptBreakdown") || (isEn ? "Department Breakdown" : "Breakdown Departemen")}</th>
                        <th className="px-3 py-3 w-28 text-center">{t("audit.cols.periodAvg") || (isEn ? "Period Average" : "Rata-rata")}</th>
                        <th className="px-3 py-3 w-36">{t("audit.cols.auditor") || (isEn ? "Auditor" : "Auditor")}</th>
                        <th className="py-3 pl-2 pr-4 w-36 text-right">{isEn ? "Action" : "Aksi"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {hotel.periods.map((period) => (
                        <PeriodRowItem key={period.period_id} period={period} isEn={isEn} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function PeriodRowItem({ period, isEn }: { period: AuditPeriodRow; isEn: boolean }) {
  const t = useTranslations();

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso + "T00:00:00");
      return d.toLocaleDateString(isEn ? "en-US" : "id-ID", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return iso;
    }
  };

  const deptEntries = Object.entries(period.department_scores);

  return (
    <tr className="hover:bg-muted/20 transition-colors">
      {/* Tahun */}
      <td className="py-3 pl-4 pr-2 text-center font-mono font-semibold text-foreground">
        {period.year}
      </td>

      {/* Bulan */}
      <td className="px-2 py-3 text-center font-medium text-foreground">
        {getLocalizedMonthName(period.month_name, isEn)}
      </td>

      {/* Rentang Tanggal */}
      <td className="px-3 py-3 text-muted-foreground text-[11px] font-mono whitespace-nowrap">
        {formatDate(period.date_start)}
        {period.date_end ? ` – ${formatDate(period.date_end)}` : ""}
      </td>

      {/* Status */}
      <td className="px-3 py-3 text-center">
        <StatusPill tone={STATUS_TONE[period.status] ?? "off"}>
          {t(`audit.status.${period.status}` as never) || period.status}
        </StatusPill>
      </td>

      {/* Breakdown Departemen */}
      <td className="px-3 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {deptEntries.length === 0 ? (
            <span className="text-muted-foreground italic text-[11px]">—</span>
          ) : (
            deptEntries.map(([deptKey, deptData]) => (
              <Link
                key={deptKey}
                href={`/dashboard/audits/${deptData.session_id}`}
                title={isEn ? `Click to open ${deptKey} evaluation` : `Klik untuk buka evaluasi departemen ${deptKey}`}
                className="group inline-flex items-center gap-1 rounded-lg border border-border/70 bg-background/80 px-2 py-0.5 text-[11px] font-medium transition-smooth hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
              >
                <span className="text-muted-foreground group-hover:text-primary">
                  {deptLabel(deptKey)}:
                </span>
                <span className="font-mono font-bold tabular-nums">
                  {deptData.score !== null && deptData.score !== undefined
                    ? `${Number(deptData.score).toFixed(1)}%`
                    : deptData.status}
                </span>
              </Link>
            ))
          )}
        </div>
      </td>

      {/* Rata-rata Skor Periode */}
      <td className="px-3 py-3 text-center font-mono font-bold tabular-nums">
        {period.average_score !== null && period.average_score !== undefined ? (
          <span className="text-foreground text-xs">{Number(period.average_score).toFixed(1)}%</span>
        ) : (
          <span className="text-muted-foreground font-normal italic">—</span>
        )}
      </td>

      {/* Auditor */}
      <td className="px-3 py-3 text-muted-foreground text-[11px] truncate max-w-[150px]">
        {period.auditor_name || "—"}
      </td>

      {/* Aksi: Buka Lembar Kerja */}
      <td className="py-3 pl-2 pr-4 text-right">
        <Link
          href={`/dashboard/audits/${period.primary_session_id}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-smooth hover:bg-primary hover:text-primary-foreground shadow-sm active:scale-95"
        >
          <span>{t("audit.cols.openWorksheet" as never) || (isEn ? "Open Worksheet" : "Buka Lembar Kerja")}</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </td>
    </tr>
  );
}

function deptLabel(dept: string): string {
  switch (dept) {
    case "GM":
      return "GM";
    case "HOUSEKEEPING":
      return "Housekeeping";
    case "KITCHEN_FB":
      return "Kitchen FB";
    case "SECURITY_RISK":
      return "Security";
    default:
      return dept;
  }
}

function ScoreGradeBadge({ score }: { score: number }) {
  if (score >= 90) {
    return (
      <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] px-1.5 py-0">
        Grade A
      </Badge>
    );
  }
  if (score >= 80) {
    return (
      <Badge variant="outline" className="border-sky-500/40 bg-sky-500/15 text-sky-600 dark:text-sky-400 font-mono text-[10px] px-1.5 py-0">
        Grade B
      </Badge>
    );
  }
  if (score >= 70) {
    return (
      <Badge variant="outline" className="border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono text-[10px] px-1.5 py-0">
        Grade C
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-rose-500/40 bg-rose-500/15 text-rose-600 dark:text-rose-400 font-mono text-[10px] px-1.5 py-0">
      Grade D
    </Badge>
  );
}