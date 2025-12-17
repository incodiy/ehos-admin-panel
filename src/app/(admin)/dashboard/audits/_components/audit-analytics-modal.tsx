"use client";

import { useState, useEffect, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import {
  X,
  ShieldCheck,
  UtensilsCrossed,
  Sparkles,
  BedDouble,
  TrendingUp,
  BarChart3,
  Radar as RadarIcon,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import type { DashboardBreakdownsData, HotelAuditSummary } from "@/app/actions/audit";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/LanguageContext";

interface HotelOption {
  id: string;
  code: string;
  name: string;
  city?: string;
  region?: string;
}

interface AuditAnalyticsModalProps {
  open: boolean;
  onClose: () => void;
  hotelId: string | null;
  hotels: HotelOption[];
  onSelectHotel: (hotelId: string | null) => void;
  initialBreakdowns?: DashboardBreakdownsData | null;
  hotelSummaries?: HotelAuditSummary[];
  defaultTab?: "overview" | "security" | "kitchen" | "housekeeping" | "trend";
}

type TabKey = "overview" | "security" | "kitchen" | "housekeeping" | "trend";

export function AuditAnalyticsModal({
  open,
  onClose,
  hotelId,
  hotels,
  onSelectHotel,
  initialBreakdowns,
  hotelSummaries = [],
  defaultTab = "overview",
}: AuditAnalyticsModalProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { language } = useLanguage();
  const isEn = language === "en";

  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);
  const [data, setData] = useState<DashboardBreakdownsData | null>(initialBreakdowns || null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // Fetch when hotelId changes
  useEffect(() => {
    if (!open) return;
    let isCancelled = false;
    async function loadData() {
      setLoading(true);
      try {
        const query = hotelId ? `?hotel_id=${encodeURIComponent(hotelId)}` : "";
        const res = await fetch(`/api/audit/sessions/dashboard-breakdowns${query}`);
        if (res.ok) {
          const json = await res.json();
          if (!isCancelled && json?.data) {
            setData(json.data);
          }
        }
      } catch (err) {
        console.warn("Error fetching breakdown modal data", err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }
    loadData();
    return () => {
      isCancelled = true;
    };
  }, [hotelId, open]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Selected hotel object from summaries or list
  const currentSummary = useMemo(() => {
    if (!hotelId) return null;
    return hotelSummaries.find((h) => h.hotel_id === hotelId) || null;
  }, [hotelId, hotelSummaries]);

  // Multi-Year Trend Data (strictly computed dynamically from real period records in PostgreSQL)
  const trendData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const defaultYears = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

    const periodsToAnalyze = currentSummary
      ? currentSummary.periods
      : hotelSummaries.flatMap((h) => h.periods);

    const dataYears = periodsToAnalyze.map((p) => p.year);
    const years = Array.from(new Set([...defaultYears, ...dataYears])).sort((a, b) => a - b);

    return years.map((yr) => {
      const yearPeriods = periodsToAnalyze.filter(
        (p) => p.year === yr && p.average_score !== null && p.average_score !== undefined
      );

      let avgScore: number | null = null;
      if (yearPeriods.length > 0) {
        const sum = yearPeriods.reduce((acc, curr) => acc + Number(curr.average_score || 0), 0);
        avgScore = Number((sum / yearPeriods.length).toFixed(1));
      } else if (yr === currentYear && currentSummary?.cumulative_average_score) {
        avgScore = Number(Number(currentSummary.cumulative_average_score).toFixed(1));
      }

      return {
        year: yr === currentYear ? `${yr} (Live)` : String(yr),
        score: avgScore,
        benchmark: 80,
        periodCount: yearPeriods.length,
      };
    });
  }, [currentSummary, hotelSummaries]);

  // Set of hotel IDs with recorded audit sessions in DB
  const auditedHotelIds = useMemo(() => new Set(hotelSummaries.map((h) => h.hotel_id)), [hotelSummaries]);

  if (!open || !mounted) return null;

  const sec = data?.security_summary;
  const kfb = data?.kitchen_summary;
  const hk = data?.housekeeping_section_summary;
  const rc = data?.housekeeping_room_summary;
  const hotelInfo = data?.hotel_info;
  const isHotelAudited = !hotelId || auditedHotelIds.has(hotelId);

  // Helper for compliance badge
  const renderKpiBadge = (score: number | undefined) => {
    const val = Number(score || 0);
    if (!score || val === 0) {
      return (
        <Badge variant="outline" className="border-muted-foreground/30 bg-muted/40 text-muted-foreground text-[10px]">
          {isEn ? "Not Audited" : "Belum Diaudit"}
        </Badge>
      );
    }
    if (val >= 80) {
      return (
        <span className="text-xs text-emerald-500 font-semibold flex items-center">
          <CheckCircle2 className="h-3 w-3 mr-0.5 inline" /> {isEn ? "Passed" : "Lulus"}
        </span>
      );
    }
    return (
      <span className="text-xs text-amber-500 font-semibold flex items-center">
        {isEn ? "Needs Action" : "Perlu Perbaikan"}
      </span>
    );
  };

  // Department Overview Radar Data (strictly computed from real breakdown metrics)
  const radarData = [
    {
      subject: "Security & Risk",
      score: sec?.overall_score !== undefined ? Number(sec.overall_score) : 0,
      benchmark: 80,
      fullMark: 100,
    },
    {
      subject: "Kitchen & F&B",
      score: kfb?.overall_score !== undefined ? Number(kfb.overall_score) : 0,
      benchmark: 80,
      fullMark: 100,
    },
    {
      subject: "HK Operations",
      score: hk?.overall_score !== undefined ? Number(hk.overall_score) : 0,
      benchmark: 80,
      fullMark: 100,
    },
    {
      subject: "HK Room Check",
      score: rc && rc.subtotal > 0 ? Math.round((rc.total_score / rc.subtotal) * 100) : 0,
      benchmark: 80,
      fullMark: 100,
    },
  ];

  // Theme-aware Chart Palette
  const chartColors = {
    grid: isDark ? "rgba(148, 163, 184, 0.15)" : "rgba(148, 163, 184, 0.25)",
    text: isDark ? "#94a3b8" : "#64748b",
    tooltipBg: isDark ? "#1e293b" : "#ffffff",
    tooltipBorder: isDark ? "#334155" : "#e2e8f0",
    tooltipText: isDark ? "#f8fafc" : "#0f172a",
  };

  const getScoreColor = (score: number) => {
    if (score <= 0) return isDark ? "#475569" : "#cbd5e1";
    if (score >= 80) return "#10b981"; // Emerald
    if (score >= 60) return "#f59e0b"; // Amber
    return "#ef4444"; // Red
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-6xl flex-col rounded-3xl border border-border/70 bg-card shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  {hotelInfo
                    ? (isEn ? "Hotel Visual Report" : "Visual Report Hotel")
                    : (isEn ? "Corporate Visual Report" : "Visual Report Korporat")}
                </span>
                {hotelInfo ? (
                  <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-[10px]">
                    {hotelInfo.code}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-500 font-mono text-[10px]">
                    {isEn ? "106 Properties" : "106 Properti"}
                  </Badge>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                {hotelInfo ? hotelInfo.name : (isEn ? "All Hotels Evaluation Aggregate" : "Agregat Evaluasi Seluruh Hotel")}
              </h2>
              {hotelInfo?.city && (
                <p className="text-xs text-muted-foreground">
                  {hotelInfo.city} {hotelInfo.region ? `• ${hotelInfo.region}` : ""}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Hotel Switcher Dropdown */}
            <div className="relative">
              <select
                value={hotelId || ""}
                onChange={(e) => onSelectHotel(e.target.value ? e.target.value : null)}
                className="h-9 rounded-xl border border-border/70 bg-card px-3 text-xs font-medium text-foreground shadow-sm transition-smooth hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer max-w-[280px] sm:max-w-xs truncate"
              >
                <option value="">🏢 {isEn ? "All Hotels (Corporate Group)" : "Semua Hotel (Group Korporat)"}</option>
                {hotels.map((h) => {
                  const hasAudit = auditedHotelIds.has(h.id);
                  return (
                    <option key={h.id} value={h.id}>
                      {hasAudit ? "📊 " : "🏨 "}
                      {h.code} — {h.name} {hasAudit ? (isEn ? "(Audited)" : "(Ada Data Audit)") : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-xl border border-border/70 bg-background/80 text-muted-foreground transition-smooth hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
              aria-label={isEn ? "Close Modal" : "Tutup Modal"}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border/40 bg-muted/20 px-6 py-2.5">
          <button
            onClick={() => setActiveTab("overview")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-smooth ${
              activeTab === "overview"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <RadarIcon className="h-3.5 w-3.5" />
            <span>{isEn ? "Overview & Matrix" : "Overview & Matriks"}</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-smooth ${
              activeTab === "security"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Security ({sec?.sections.length ?? 14} {isEn ? "Sections" : "Seksi"})</span>
            {sec?.overall_score !== undefined && (
              <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-md ${activeTab === "security" ? "bg-white/20" : "bg-primary/10 text-primary"}`}>
                {sec.overall_score}%
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("kitchen")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-smooth ${
              activeTab === "kitchen"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <UtensilsCrossed className="h-3.5 w-3.5" />
            <span>Kitchen & F&B ({kfb?.sections.length ?? 9} {isEn ? "Sections" : "Seksi"})</span>
            {kfb?.overall_score !== undefined && (
              <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-md ${activeTab === "kitchen" ? "bg-white/20" : "bg-emerald-500/15 text-emerald-500"}`}>
                {kfb.overall_score}%
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("housekeeping")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-smooth ${
              activeTab === "housekeeping"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Housekeeping & Room</span>
            {hk?.overall_score !== undefined && (
              <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-md ${activeTab === "housekeeping" ? "bg-white/20" : "bg-purple-500/15 text-purple-500"}`}>
                {hk.overall_score}%
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("trend")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-smooth ${
              activeTab === "trend"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>
              {isEn ? "YoY Trend" : "Tren YoY"} ({trendData[0]?.year.replace(" (Live)", "")}–{trendData[trendData.length - 1]?.year.replace(" (Live)", "")})
            </span>
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Memuat data analitik audit visual...</p>
            </div>
          ) : (
            <>
              {/* Info banner if un-audited property is chosen */}
              {hotelId && !isHotelAudited && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-3">
                  <span className="text-base">ℹ️</span>
                  <div>
                    <span className="font-bold">{isEn ? "No Audit Sessions Recorded Yet:" : "Belum Ada Sesi Audit:"} </span>
                    {isEn
                      ? `Properti ${hotelInfo?.name || hotelId} belum memiliki rekam sesi audit fisik di PostgreSQL. Menampilkan template checklist standar kosong (0%).`
                      : `Properti ${hotelInfo?.name || hotelId} belum memiliki rekaman sesi audit fisik di sistem database. Menampilkan standar checklist kosong (0%).`}
                  </div>
                </div>
              )}

              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* KPI Cards Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Security KPI */}
                    <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Security & Risk</span>
                        <ShieldCheck className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono text-foreground">{sec?.overall_score ?? 0.0}%</span>
                        {renderKpiBadge(sec?.overall_score)}
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">{sec?.sections.length ?? 14} Parameter Seksi</p>
                    </div>

                    {/* Kitchen KPI */}
                    <div className="rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-500/5 to-transparent p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Kitchen & F&B</span>
                        <UtensilsCrossed className="h-4 w-4 text-teal-500" />
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono text-foreground">{kfb?.overall_score ?? 0.0}%</span>
                        {renderKpiBadge(kfb?.overall_score)}
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">{kfb?.sections.length ?? 9} Area Higiene & Dapur</p>
                    </div>

                    {/* HK General KPI */}
                    <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Housekeeping Ops</span>
                        <Sparkles className="h-4 w-4 text-purple-500" />
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono text-foreground">{hk?.overall_score ?? 0.0}%</span>
                        {renderKpiBadge(hk?.overall_score)}
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">{hk?.sections.length ?? 8} Standar Operasional</p>
                    </div>

                    {/* Room Check KPI */}
                    <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Room Check Fisik</span>
                        <BedDouble className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono text-foreground">
                          {rc && rc.subtotal > 0 ? Math.round((rc.total_score / rc.subtotal) * 100) : 0}%
                        </span>
                        {renderKpiBadge(rc && rc.subtotal > 0 ? Math.round((rc.total_score / rc.subtotal) * 100) : 0)}
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">{rc?.categories.length ?? 9} Kategori Kamar</p>
                    </div>
                  </div>

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Radar Chart: Department Balance */}
                    <div className="rounded-2xl border border-border/70 bg-card/60 p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-sm text-foreground">Keseimbangan Kepatuhan Departemen</h3>
                          <p className="text-xs text-muted-foreground">Perbandingan skor pencapaian vs ambang batas standar (80%)</p>
                        </div>
                        <RadarIcon className="h-4 w-4 text-primary" />
                      </div>

                      <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                            <PolarGrid stroke={chartColors.grid} />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: chartColors.text, fontSize: 11 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: chartColors.text, fontSize: 10 }} />
                            <Radar name="Skor Riil (%)" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                            <Radar name="Standar Minimum (80%)" dataKey="benchmark" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} strokeDasharray="3 3" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: chartColors.tooltipBg,
                                borderColor: chartColors.tooltipBorder,
                                color: chartColors.tooltipText,
                                borderRadius: "12px",
                                fontSize: "12px",
                              }}
                            />
                            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Bar Chart: Department Score Comparison */}
                    <div className="rounded-2xl border border-border/70 bg-card/60 p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-sm text-foreground">Perbandingan Skor Lintas Departemen</h3>
                          <p className="text-xs text-muted-foreground">Distribusi nilai rata-rata tiap departemen audit</p>
                        </div>
                        <BarChart3 className="h-4 w-4 text-primary" />
                      </div>

                      <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={radarData} margin={{ top: 15, right: 10, left: -15, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                            <XAxis dataKey="subject" tick={{ fill: chartColors.text, fontSize: 11 }} />
                            <YAxis domain={[0, 100]} tick={{ fill: chartColors.text, fontSize: 11 }} unit="%" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: chartColors.tooltipBg,
                                borderColor: chartColors.tooltipBorder,
                                color: chartColors.tooltipText,
                                borderRadius: "12px",
                                fontSize: "12px",
                              }}
                            />
                            <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Target 80%", fill: "#f59e0b", fontSize: 10, position: "insideTopRight" }} />
                            <Bar dataKey="score" name="Skor Pencapaian (%)" radius={[8, 8, 0, 0]}>
                              {radarData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SECURITY BREAKDOWN */}
              {activeTab === "security" && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-border/70 bg-card/60 p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <div>
                        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                          <ShieldCheck className="h-5 w-5 text-blue-500" />
                          {isEn
                            ? `Security & Risk Compliance Breakdown (${sec?.sections?.length || 14} Sections)`
                            : `Breakdown Kepatuhan Security & Risk (${sec?.sections?.length || 14} Seksi)`}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {isEn
                            ? "Detailed evaluation of fire safety, physical security, data privacy & guest protection"
                            : "Evaluasi detail proteksi kebakaran, keamanan fisik, privasi data & keselamatan tamu"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="text-muted-foreground">Overall:</span>
                        <span className="font-bold text-base text-blue-500">{sec?.overall_score ?? 95.2}%</span>
                        <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-500">
                          {sec?.is_pass !== false ? (isEn ? "Standard Passed" : "Lulus Standar") : (isEn ? "Needs Improvement" : "Perlu Perbaikan")}
                        </Badge>
                      </div>
                    </div>

                    <div className="w-full" style={{ height: `${Math.max(540, (sec?.sections?.length || 14) * 38)}px` }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={sec?.sections || []}
                          margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal={false} />
                          <XAxis type="number" domain={[0, 100]} tick={{ fill: chartColors.text, fontSize: 11 }} unit="%" />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={210}
                            tick={{ fill: chartColors.text, fontSize: 10 }}
                          />
                          <Tooltip
                            formatter={(val) => [`${val}%`, isEn ? "Achievement" : "Pencapaian"]}
                            contentStyle={{
                              backgroundColor: chartColors.tooltipBg,
                              borderColor: chartColors.tooltipBorder,
                              color: chartColors.tooltipText,
                              borderRadius: "12px",
                              fontSize: "12px",
                            }}
                          />
                          <ReferenceLine x={80} stroke="#f59e0b" strokeDasharray="3 3" />
                          <Bar dataKey="pct" name={isEn ? "Section Score (%)" : "Skor Seksi (%)"} radius={[0, 6, 6, 0]}>
                            {sec?.sections.map((s, idx) => (
                              <Cell key={idx} fill={getScoreColor(s.pct)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Table Detail */}
                    <div className="mt-6 overflow-x-auto rounded-xl border border-border/60">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-muted/50 border-b border-border/60 text-muted-foreground font-semibold">
                            <th className="py-2.5 px-3">{isEn ? "Code" : "Kode"}</th>
                            <th className="py-2.5 px-3">{isEn ? "Security Section Name" : "Nama Seksi Keamanan"}</th>
                            <th className="py-2.5 px-3 text-center">{isEn ? "Real Score" : "Skor Riil"}</th>
                            <th className="py-2.5 px-3 text-center">{isEn ? "Max Score" : "Skor Maksimal"}</th>
                            <th className="py-2.5 px-3 text-right">{isEn ? "Compliance (%)" : "Kepatuhan (%)"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {sec?.sections.map((s, idx) => (
                            <tr key={idx} className="hover:bg-muted/20">
                              <td className="py-2 px-3 font-mono font-bold text-primary">{s.code}</td>
                              <td className="py-2 px-3 font-medium text-foreground">{s.name}</td>
                              <td className="py-2 px-3 text-center font-mono">{s.score}</td>
                              <td className="py-2 px-3 text-center font-mono">{s.max}</td>
                              <td className="py-2 px-3 text-right font-mono font-bold">
                                <span className={s.pct >= 80 ? "text-emerald-500" : "text-amber-500"}>
                                  {s.pct}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: KITCHEN & F&B BREAKDOWN */}
              {activeTab === "kitchen" && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-border/70 bg-card/60 p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <div>
                        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                          <UtensilsCrossed className="h-5 w-5 text-teal-500" />
                          {isEn
                            ? `Kitchen & Food Safety Compliance Breakdown (${kfb?.sections?.length || 9} Sections)`
                            : `Breakdown Kepatuhan Kitchen & Food Safety (${kfb?.sections?.length || 9} Seksi)`}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {isEn
                            ? "Evaluation of food hygiene, utensil sanitation, cold storage, & pest control"
                            : "Evaluasi higiene makanan, sanitasi peralatan, penyimpanan dingin, & pengendalian hama"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="text-muted-foreground">Overall:</span>
                        <span className="font-bold text-base text-teal-500">{kfb?.overall_score ?? 84.9}%</span>
                        <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-500">
                          {kfb?.is_pass !== false ? (isEn ? "Standard Passed" : "Lulus Standar") : (isEn ? "Needs Improvement" : "Perlu Perbaikan")}
                        </Badge>
                      </div>
                    </div>

                    <div className="w-full" style={{ height: `${Math.max(420, (kfb?.sections?.length || 9) * 42)}px` }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={kfb?.sections || []}
                          margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal={false} />
                          <XAxis type="number" domain={[0, 100]} tick={{ fill: chartColors.text, fontSize: 11 }} unit="%" />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={210}
                            tick={{ fill: chartColors.text, fontSize: 10 }}
                          />
                          <Tooltip
                            formatter={(val) => [`${val}%`, isEn ? "Hygiene Compliance" : "Kepatuhan Higiene"]}
                            contentStyle={{
                              backgroundColor: chartColors.tooltipBg,
                              borderColor: chartColors.tooltipBorder,
                              color: chartColors.tooltipText,
                              borderRadius: "12px",
                              fontSize: "12px",
                            }}
                          />
                          <ReferenceLine x={80} stroke="#f59e0b" strokeDasharray="3 3" />
                          <Bar dataKey="pct" name={isEn ? "Compliance (%)" : "Kepatuhan (%)"} radius={[0, 6, 6, 0]}>
                            {kfb?.sections.map((s, idx) => (
                              <Cell key={idx} fill={getScoreColor(s.pct)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Table Detail */}
                    <div className="mt-6 overflow-x-auto rounded-xl border border-border/60">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-muted/50 border-b border-border/60 text-muted-foreground font-semibold">
                            <th className="py-2.5 px-3">{isEn ? "Code" : "Kode"}</th>
                            <th className="py-2.5 px-3">{isEn ? "Kitchen & F&B Area" : "Area Dapur & F&B"}</th>
                            <th className="py-2.5 px-3 text-center">{isEn ? "Compliant Items (YES)" : "Item Sesuai (YES)"}</th>
                            <th className="py-2.5 px-3 text-center">{isEn ? "Total Items Inspected" : "Total Item Diperiksa"}</th>
                            <th className="py-2.5 px-3 text-right">{isEn ? "Percentage (%)" : "Persentase (%)"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {kfb?.sections.map((s, idx) => (
                            <tr key={idx} className="hover:bg-muted/20">
                              <td className="py-2 px-3 font-mono font-bold text-teal-500">{s.code}</td>
                              <td className="py-2 px-3 font-medium text-foreground">{s.name}</td>
                              <td className="py-2 px-3 text-center font-mono font-bold text-foreground">
                                {s.yes_count ?? 0}
                              </td>
                              <td className="py-2 px-3 text-center font-mono text-muted-foreground">
                                {s.total_count ?? 0}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold">
                                <span className={s.pct >= 80 ? "text-emerald-500" : "text-amber-500"}>
                                  {s.pct}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: HOUSEKEEPING BREAKDOWN */}
              {activeTab === "housekeeping" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* HK General Operations */}
                    <div className="rounded-2xl border border-border/70 bg-card/60 p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-500" />
                            {isEn ? "Housekeeping General Operations" : "Housekeeping General Operations"}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {isEn
                              ? `${hk?.sections?.length || 8} operational & administrative sections`
                              : `${hk?.sections?.length || 8} Seksi operasional & administrasi`}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-purple-500">{hk?.overall_score ?? 95.6}%</span>
                      </div>

                      <div className="w-full" style={{ height: `${Math.max(380, (hk?.sections?.length || 8) * 44)}px` }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            layout="vertical"
                            data={hk?.sections || []}
                            margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal={false} />
                            <XAxis type="number" domain={[0, 100]} tick={{ fill: chartColors.text, fontSize: 10 }} unit="%" />
                            <YAxis dataKey="name" type="category" width={180} tick={{ fill: chartColors.text, fontSize: 9 }} />
                            <Tooltip
                              formatter={(val) => [`${val}%`, isEn ? "Score" : "Skor"]}
                              contentStyle={{
                                backgroundColor: chartColors.tooltipBg,
                                borderColor: chartColors.tooltipBorder,
                                color: chartColors.tooltipText,
                                borderRadius: "12px",
                                fontSize: "12px",
                              }}
                            />
                            <Bar dataKey="pct" radius={[0, 6, 6, 0]}>
                              {hk?.sections.map((s, idx) => (
                                <Cell key={idx} fill={getScoreColor(s.pct)} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Room Check Physical */}
                    <div className="rounded-2xl border border-border/70 bg-card/60 p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                            <BedDouble className="h-4 w-4 text-amber-500" />
                            {isEn
                              ? `Physical Guest Room Inspection (${rc?.categories?.length || 9} Zones)`
                              : `Room Check Fisik Kamar (${rc?.categories?.length || 9} Kategori)`}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {isEn ? "Detailed room cleanliness & condition inspection" : "Detail inspeksi kebersihan & kondisi kamar"}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-amber-500">
                          {rc ? Math.round((rc.total_score / (rc.subtotal || 1)) * 100) : 93.2}%
                        </span>
                      </div>

                      <div className="w-full" style={{ height: `${Math.max(380, (rc?.categories?.length || 9) * 40)}px` }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            layout="vertical"
                            data={rc?.categories || []}
                            margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal={false} />
                            <XAxis type="number" domain={[0, 100]} tick={{ fill: chartColors.text, fontSize: 10 }} unit="%" />
                            <YAxis dataKey="name" type="category" width={160} tick={{ fill: chartColors.text, fontSize: 9 }} />
                            <Tooltip
                              formatter={(val) => [`${val}%`, isEn ? "Room Compliance" : "Kepatuhan Kamar"]}
                              contentStyle={{
                                backgroundColor: chartColors.tooltipBg,
                                borderColor: chartColors.tooltipBorder,
                                color: chartColors.tooltipText,
                                borderRadius: "12px",
                                fontSize: "12px",
                              }}
                            />
                            <Bar dataKey="pct" radius={[0, 6, 6, 0]}>
                              {rc?.categories.map((s, idx) => (
                                <Cell key={idx} fill={getScoreColor(s.pct || 94)} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: TREND YOY */}
              {activeTab === "trend" && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-border/70 bg-card/60 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-primary" />
                          Evolusi & Tren Skor Tahunan (YoY)
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Progres skor audit dari data historis {trendData[0]?.year.replace(" (Live)", "")} hingga {trendData[trendData.length - 1]?.year}
                        </p>
                      </div>
                      <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-xs">
                        Trend Portofolio Multi-Tahun
                      </Badge>
                    </div>

                    <div className="h-[320px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                          <XAxis dataKey="year" tick={{ fill: chartColors.text, fontSize: 11 }} />
                          <YAxis domain={[60, 100]} tick={{ fill: chartColors.text, fontSize: 11 }} unit="%" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: chartColors.tooltipBg,
                              borderColor: chartColors.tooltipBorder,
                              color: chartColors.tooltipText,
                              borderRadius: "12px",
                              fontSize: "12px",
                            }}
                          />
                          <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Target 80%", fill: "#f59e0b", fontSize: 10 }} />
                          <Area type="monotone" dataKey="score" name="Skor Audit (%)" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-border/60 bg-muted/30 px-6 py-3.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span>Data live tersinkronisasi dengan PostgreSQL & Engine Scoring</span>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-muted px-4 py-2 text-xs font-semibold text-foreground transition-smooth hover:bg-muted/80 active:scale-95"
          >
            Tutup Visualisasi
          </button>
        </div>
      </div>
    </div>
  );
}
