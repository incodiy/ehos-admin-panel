"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Lock,
  GitFork,
  ExternalLink,
  Sparkles,
  Shield,
  UtensilsCrossed,
  BedDouble,
  Award,
  FileSpreadsheet,
  History,
  Clock,
  X,
  AlertCircle,
  GitCompare,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import {
  configTemplateDetailAction,
  configNewVersionAction,
  type ChecklistTemplate,
  type TemplateDetail,
} from "@/app/actions/config";

export const DEPARTMENTS = ["SECURITY_RISK", "KITCHEN_FB", "HOUSEKEEPING"] as const;

interface DepartmentMeta {
  id: (typeof DEPARTMENTS)[number];
  title: string;
  subtitle: string;
  icon: typeof Shield;
  color: string;
  badgeBg: string;
  badgeText: string;
  gradient: string;
  border: string;
  desc: string;
}

const DEPT_CONFIG: Record<(typeof DEPARTMENTS)[number], DepartmentMeta> = {
  SECURITY_RISK: {
    id: "SECURITY_RISK",
    title: "1. Security & Risk Management Department",
    subtitle: "Standar Keamanan, Kesiapsiagaan Krisis & Mitigasi Risiko Properti",
    icon: Shield,
    color: "text-emerald-600 dark:text-emerald-400",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-700 dark:text-emerald-400",
    gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
    border: "border-emerald-500/30",
    desc: "Standar keamanan fisik, kesiapsiagaan kebakaran, evakuasi darurat, dan pos pengamanan dengan evaluasi Traffic Light (90/45/0).",
  },
  KITCHEN_FB: {
    id: "KITCHEN_FB",
    title: "2. Kitchen & Food and Beverage (F&B) Department",
    subtitle: "Standar Higienitas Makanan, Buffet Setup & Sanitasi Dapur",
    icon: UtensilsCrossed,
    color: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-700 dark:text-amber-400",
    gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
    border: "border-amber-500/30",
    desc: "Standar bilingual (EN/ID) untuk Food Safety, Chiller/Freezer temperature, Buffet setup, dan sanitasi peralatan dapur dengan evaluasi biner (YES/NO/NA).",
  },
  HOUSEKEEPING: {
    id: "HOUSEKEEPING",
    title: "3. Housekeeping & Guest Room Department",
    subtitle: "Tata Kelola Operasional HK & Inspeksi Fisik Kamar Tamu",
    icon: BedDouble,
    color: "text-indigo-600 dark:text-indigo-400",
    badgeBg: "bg-indigo-500/10",
    badgeText: "text-indigo-700 dark:text-indigo-400",
    gradient: "from-indigo-500/10 via-indigo-500/5 to-transparent",
    border: "border-indigo-500/30",
    desc: "Kombinasi komposit The Golden Formula: 50% Tata Kelola Operasional Umum + 50% Rata-rata Inspeksi Fisik Kamar Tamu (Multi-Room Sampling).",
  },
};

interface InstrumentFamily {
  department: string;
  name: string;
  activeTemplate: ChecklistTemplate;
  allVersions: ChecklistTemplate[];
}

interface Props {
  templates: ChecklistTemplate[];
  error: ApiError | null;
}

export function ChecklistConfigClient({ templates, error }: Props) {
  const router = useRouter();

  const [loadError] = useState<ApiError | null>(error);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ kind: "error" | "success"; message: string } | null>(null);

  // Template details cache loaded on demand from database
  const [templateDetails, setTemplateDetails] = useState<Record<string, TemplateDetail | null>>({});
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});

  // Version Log Modal State
  const [selectedFamily, setSelectedFamily] = useState<InstrumentFamily | null>(null);
  const [modalTab, setModalTab] = useState<"timeline" | "diff">("timeline");
  const [newVersionDraftInput, setNewVersionDraftInput] = useState<string>("");
  const [isForkingNewVersion, setIsForkingNewVersion] = useState<boolean>(false);

  const showToast = (kind: "error" | "success", message: string) => {
    setToast({ kind, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Group real DB templates by department and instrument name (Family)
  const groupedFamiliesByDept = useMemo(() => {
    const result: Record<string, InstrumentFamily[]> = {
      SECURITY_RISK: [],
      KITCHEN_FB: [],
      HOUSEKEEPING: [],
    };

    // Group templates by key (department + name)
    const map = new Map<string, ChecklistTemplate[]>();
    for (const tpl of templates) {
      const key = `${tpl.department}:::${tpl.name}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(tpl);
    }

    // For each family, pick the single active template (LOCKED with highest version, or latest DRAFT)
    map.forEach((familyTemplates, key) => {
      const [dept, name] = key.split(":::");
      if (!result[dept]) return;

      // Sort all versions descending (LOCKED first, then highest version string/date)
      const sorted = [...familyTemplates].sort((a, b) => {
        if (a.status === "LOCKED" && b.status !== "LOCKED") return -1;
        if (b.status === "LOCKED" && a.status !== "LOCKED") return 1;
        return b.version.localeCompare(a.version, undefined, { numeric: true });
      });

      // Active is the top sorted item
      const activeTemplate = sorted[0];

      result[dept].push({
        department: dept,
        name,
        activeTemplate,
        allVersions: sorted,
      });
    });

    return result;
  }, [templates]);

  // Load template detail from DB on demand
  const loadDetail = async (tplId: string) => {
    if (templateDetails[tplId] !== undefined) return;
    setTemplateDetails((prev) => ({ ...prev, [tplId]: null }));
    const res = await configTemplateDetailAction(tplId);
    if (res.ok && res.data) {
      setTemplateDetails((prev) => ({ ...prev, [tplId]: res.data as TemplateDetail }));
    } else {
      setTemplateDetails((prev) => {
        const copy = { ...prev };
        delete copy[tplId];
        return copy;
      });
    }
  };

  // Toggle item preview accordion
  const onToggleExpand = (tpl: ChecklistTemplate) => {
    const nextState = !expandedCardIds[tpl.id];
    setExpandedCardIds((prev) => ({ ...prev, [tpl.id]: nextState }));
    if (nextState) {
      loadDetail(tpl.id);
    }
  };

  // Open Version Log Modal
  const onOpenVersionModal = (family: InstrumentFamily) => {
    setSelectedFamily(family);
    setModalTab("timeline");
    setIsForkingNewVersion(false);

    // Pre-calculate next incremental version suggestion
    const currentVer = family.activeTemplate.version || "v2026.1";
    const parts = currentVer.replace("v", "").split(".");
    const major = parts[0] || "2026";
    const minor = Number(parts[1] || 1) + 1;
    setNewVersionDraftInput(`v${major}.${minor}`);

    // Pre-fetch details for all versions in this family from DB
    for (const v of family.allVersions) {
      loadDetail(v.id);
    }
  };

  const onConfirmCreateDraftVersion = async () => {
    if (!selectedFamily || !newVersionDraftInput.trim()) return;
    setBusy(true);
    const res = await configNewVersionAction(selectedFamily.activeTemplate.id, newVersionDraftInput.trim());
    setBusy(false);
    if (res.ok) {
      showToast("success", `Versi baru (${newVersionDraftInput.trim()}) berhasil dibuat sebagai DRAFT`);
      setSelectedFamily(null);
      const created = res.data as { id?: string } | undefined;
      if (created?.id) {
        router.push(`/dashboard/config/checklist/${created.id}/edit`);
      } else {
        router.refresh();
      }
    } else {
      showToast("error", res.message ?? "Gagal membuat versi revisi");
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={cn(
            "fixed right-6 top-6 z-50 rounded-2xl px-5 py-3.5 text-xs font-bold shadow-2xl transition-all animate-in fade-in slide-in-from-top-2 border",
            toast.kind === "error"
              ? "bg-destructive text-destructive-foreground border-destructive/30"
              : "bg-emerald-600 text-white border-emerald-500/30"
          )}
        >
          {toast.message}
        </div>
      )}

      {/* ─── Top Header Card ─── */}
      <div className="rounded-3xl border border-border/70 bg-gradient-to-r from-card via-card/95 to-card p-6 sm:p-7 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                Corporate Audit Standards
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                PostgreSQL Master Real-Data
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-primary" />
              Bank Checklist & Master Rubrik Sentral
            </h2>
            <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
              Pusat konfigurasi instrumen evaluasi operasional hotel Swiss-Belhotel International. Terstruktur dalam <strong>3 Section Departemen</strong> kanonikal dengan kartu aktif tunggal per instrumen dan sistem <strong>Riwayat Versi (Version Log & Diff)</strong> terintegrasi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href="/dashboard/config/checklist/create"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Template Baru</span>
            </Link>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-border/50 pt-4">
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Section Departemen
            </span>
            <span className="text-base sm:text-lg font-black text-foreground">3 Departemen</span>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Instrumen Aktif
            </span>
            <span className="text-base sm:text-lg font-black text-primary">4 Master Checklist</span>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Model Skoring
            </span>
            <span className="text-base sm:text-lg font-black text-foreground">3 Summary Model</span>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
              Sifat Integrasi
            </span>
            <span className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400">106+ Hotel Reusable</span>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-semibold text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>Gagal memuat template checklist dari database. Periksa koneksi backend API.</span>
        </div>
      )}

      {/* ─── 3 Canonical Section Departments ─── */}
      <div className="space-y-10">
        {DEPARTMENTS.map((deptKey) => {
          const cfg = DEPT_CONFIG[deptKey];
          const DeptIcon = cfg.icon;
          const families = groupedFamiliesByDept[deptKey] || [];

          return (
            <section
              key={deptKey}
              className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-xl space-y-6 p-6 sm:p-7"
            >
              {/* Header Section Department */}
              <div className={`rounded-2xl border ${cfg.border} bg-gradient-to-r ${cfg.gradient} p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${cfg.badgeBg} ${cfg.color} shadow-sm mt-0.5`}>
                    <DeptIcon className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-background text-foreground border border-border/60 shadow-2xs">
                        {deptKey}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-background/80 text-foreground border border-border/60">
                        {families.length} Instrumen Aktif
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-foreground">
                      {cfg.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                      {cfg.desc}
                    </p>
                  </div>
                </div>
              </div>

              {/* ─── Single Active Checklist Cards ─── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                    <span>Lembar Kerja Checklist Aktif</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground italic">
                    Digunakan otomatis pada seluruh jadwal audit hotel
                  </span>
                </div>

                {families.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground bg-muted/20">
                    Tidak ada instrumen aktif yang ditemukan untuk departemen ini.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-1">
                    {families.map((fam) => {
                      const tp = fam.activeTemplate;
                      const detail = templateDetails[tp.id];
                      const isOpen = Boolean(expandedCardIds[tp.id]);
                      const versionCount = fam.allVersions.length;

                      // Dynamic telemetry from detail if loaded, else fallback
                      const sectionsCount = detail ? detail.sections.length : null;
                      const itemsCount = detail
                        ? detail.sections.reduce((acc, s) => acc + (s.items?.length || 0), 0)
                        : null;
                      const lifeSafetyCount = detail
                        ? detail.sections.reduce(
                            (acc, s) => acc + (s.items?.filter((it) => it.is_life_safety)?.length || 0),
                            0
                          )
                        : null;

                      return (
                        <div
                          key={tp.id}
                          className="rounded-2xl border border-border/80 bg-card shadow-sm hover:border-primary/40 hover:shadow-md transition-all overflow-hidden"
                        >
                          {/* Card Main Row */}
                          <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex items-start gap-3.5 min-w-0">
                              <button
                                type="button"
                                onClick={() => onToggleExpand(tp)}
                                className="mt-1 p-1.5 rounded-xl bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                                title="Buka / Tutup Pratinjau Butir"
                              >
                                {isOpen ? (
                                  <ChevronDown className="w-4 h-4 text-primary" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>

                              <div className="space-y-2 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-base font-black text-foreground truncate">
                                    {tp.name}
                                  </h4>
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-primary/10 text-primary border border-primary/20">
                                    {tp.version}
                                  </span>
                                  <span
                                    className={cn(
                                      "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1",
                                      tp.status === "LOCKED"
                                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                    )}
                                  >
                                    <Lock className="w-3 h-3" />
                                    <span>{tp.status === "LOCKED" ? "AKTIF (LOCKED)" : "DRAFT"}</span>
                                  </span>

                                  {versionCount > 1 && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border/60">
                                      {versionCount} Riwayat Versi
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                  {sectionsCount !== null ? (
                                    <span className="font-semibold text-foreground">
                                      {sectionsCount} Seksi · {itemsCount} Butir Evaluasi
                                      {lifeSafetyCount ? ` · ${lifeSafetyCount} Life-Safety Kritis` : ""}
                                    </span>
                                  ) : (
                                    <span className="font-semibold text-muted-foreground">
                                      Klik Pratinjau Butir untuk memuat struktur
                                    </span>
                                  )}
                                  {tp.locked_at && (
                                    <>
                                      <span>·</span>
                                      <span>
                                        Terkunci:{" "}
                                        <strong className="text-foreground">
                                          {new Date(tp.locked_at).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                          })}
                                        </strong>
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions Toolbar */}
                            <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center shrink-0">
                              {/* Action 1: Open Builder */}
                              <Link
                                href={`/dashboard/config/checklist/${tp.id}/edit`}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm shadow-primary/20"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Buka Builder / Edit</span>
                              </Link>

                              {/* Action 2: Version Log & Diff Modal Trigger */}
                              <button
                                type="button"
                                onClick={() => onOpenVersionModal(fam)}
                                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-card border border-border/80 hover:bg-muted text-foreground transition-colors flex items-center gap-1.5 shadow-2xs"
                                title="Lihat Riwayat Versi & Diff"
                              >
                                <History className="w-3.5 h-3.5 text-primary" />
                                <span>Riwayat Versi</span>
                              </button>

                              {/* Action 3: Expand Toggle */}
                              <button
                                type="button"
                                onClick={() => onToggleExpand(tp)}
                                className="px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                              >
                                {isOpen ? "Tutup Pratinjau" : "Pratinjau Butir"}
                              </button>
                            </div>
                          </div>

                          {/* Collapsible Section Preview */}
                          {isOpen && (
                            <div className="border-t border-border/60 bg-muted/20 p-5 space-y-4 animate-in fade-in duration-200">
                              {detail === null ? (
                                <p className="text-xs text-muted-foreground italic py-2">
                                  Memuat detail seksi dan butir pertanyaan dari database...
                                </p>
                              ) : detail.sections.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic py-2">
                                  Belum ada section yang dibuat pada template ini.
                                </p>
                              ) : (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                                    <span>
                                      Struktur Database:{" "}
                                      <strong className="text-foreground">{detail.sections.length} Section</strong> ·{" "}
                                      <strong className="text-foreground">
                                        {detail.sections.reduce((acc, s) => acc + (s.items?.length || 0), 0)} Butir Evaluasi
                                      </strong>
                                    </span>
                                    <Link
                                      href={`/dashboard/config/checklist/${tp.id}/edit`}
                                      className="text-primary hover:underline font-bold text-xs"
                                    >
                                      Edit Lengkap di Builder ↗
                                    </Link>
                                  </div>

                                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {detail.sections.map((sec) => (
                                      <div
                                        key={sec.id}
                                        className="rounded-xl border border-border/70 bg-card p-3.5 space-y-2 shadow-2xs hover:border-primary/30 transition-colors"
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary">
                                            {sec.code}
                                          </span>
                                          <span className="text-[10px] text-muted-foreground font-semibold">
                                            {sec.items?.length || 0} Butir
                                          </span>
                                        </div>
                                        <h5 className="text-xs font-bold text-foreground line-clamp-1">
                                          {sec.name}
                                        </h5>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ─── Connected Scoring Model & Summary Rekapitulasi ─── */}
              <div className="border-t border-border/60 pt-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span>Model Skoring & Rekapitulasi Terhubung</span>
                </div>

                {deptKey === "SECURITY_RISK" && (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-background border border-border/60">
                          Summary Model
                        </span>
                        <strong className="text-foreground">Risk Management Audit Scoring & Summary Model</strong>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        Formula Agregasi: Total Poin Tercapai dibagi Total Poin Maksimal (90 pts per butir). Target Kelulusan Standar: <strong className="text-foreground">PASS (≥ 80.0%)</strong>.
                      </p>
                    </div>
                    <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/30 shrink-0">
                      Standard Scale 90/45/0
                    </span>
                  </div>
                )}

                {deptKey === "KITCHEN_FB" && (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-background border border-border/60">
                          Summary Model
                        </span>
                        <strong className="text-foreground">Kitchen & F&B Food Safety Scoring Model</strong>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        Formula Kepatuhan: (Jumlah Jawaban YES / Total Butir) × 100%. Ambang Kelulusan Standar: <strong className="text-foreground">PASS (≥ 80.0%)</strong>.
                      </p>
                    </div>
                    <span className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/30 shrink-0">
                      Traffic Light System
                    </span>
                  </div>
                )}

                {deptKey === "HOUSEKEEPING" && (
                  <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-background border border-border/60">
                          Summary Model
                        </span>
                        <strong className="text-foreground">Housekeeping & Guest Room Composite Scoring Model</strong>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        Kombinasi Komposit Terbobot: <strong className="text-primary">(50% Tata Kelola HK Umum + 50% Rata-rata Room Check Fisik)</strong>. Target Kelulusan: <strong className="text-foreground">PASS (≥ 80.0%)</strong>.
                      </p>
                    </div>
                    <span className="px-3.5 py-1.5 rounded-xl bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-500/30 shrink-0">
                      The Golden Formula (50:50)
                    </span>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* ─── Version Log & Diff Modal ─── */}
      {selectedFamily && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-border/60 flex items-start justify-between gap-4 bg-muted/30">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-primary/10 text-primary">
                    {selectedFamily.department}
                  </span>
                  <span className="text-xs text-muted-foreground font-bold">
                    Silsilah & Riwayat Versi Instrumen
                  </span>
                </div>
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  {selectedFamily.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFamily(null)}
                className="p-1.5 rounded-xl bg-muted/80 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Subtabs */}
            <div className="px-6 pt-4 border-b border-border/50 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setModalTab("timeline")}
                className={cn(
                  "pb-3 text-xs font-black transition-all flex items-center gap-1.5 border-b-2",
                  modalTab === "timeline"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Garis Waktu Versi ({selectedFamily.allVersions.length} Versi di Database)</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab("diff")}
                className={cn(
                  "pb-3 text-xs font-black transition-all flex items-center gap-1.5 border-b-2",
                  modalTab === "diff"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Ringkasan Perubahan (Changelog & Diff)</span>
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {modalTab === "timeline" ? (
                <div className="space-y-6">
                  <div className="relative border-l-2 border-border/70 ml-3.5 pl-6 space-y-8">
                    {selectedFamily.allVersions.map((v) => {
                      const isCurrentActive = v.id === selectedFamily.activeTemplate.id;
                      const detail = templateDetails[v.id];
                      const sectionsCount = detail ? detail.sections.length : null;
                      const itemsCount = detail
                        ? detail.sections.reduce((acc, s) => acc + (s.items?.length || 0), 0)
                        : null;

                      return (
                        <div key={v.id} className="relative space-y-2">
                          {/* Timeline Dot */}
                          <div
                            className={cn(
                              "absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 bg-background flex items-center justify-center",
                              isCurrentActive
                                ? "border-primary ring-4 ring-primary/20"
                                : "border-muted-foreground/40"
                            )}
                          >
                            {isCurrentActive && (
                              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            )}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-black text-foreground">
                                {v.version}
                              </span>
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                  isCurrentActive
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                    : v.status === "ARCHIVED"
                                    ? "bg-muted text-muted-foreground border border-border/60"
                                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                )}
                              >
                                {isCurrentActive ? "AKTIF SAAT INI" : v.status}
                              </span>
                            </div>

                            <span className="text-[11px] text-muted-foreground">
                              {v.locked_at ? (
                                <>
                                  Terkunci:{" "}
                                  <strong className="text-foreground">
                                    {new Date(v.locked_at).toLocaleDateString("id-ID", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </strong>
                                </>
                              ) : (
                                <span className="text-amber-600 dark:text-amber-400 font-bold">
                                  Draft Sedang Disunting
                                </span>
                              )}
                            </span>
                          </div>

                          <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                Data Real Database:
                              </span>
                              <Link
                                href={`/dashboard/config/checklist/${v.id}/edit`}
                                className="text-primary hover:underline font-bold text-[11px] flex items-center gap-1"
                              >
                                <span>Buka di Builder</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </div>
                            <p className="text-foreground font-medium">
                              {sectionsCount !== null
                                ? `Tercatat ${sectionsCount} Section dan ${itemsCount} Butir Evaluasi di PostgreSQL.`
                                : "Memuat jumlah section & butir..."}
                            </p>
                            <p className="text-muted-foreground text-[11px]">
                              Status: <strong>{v.status}</strong> · Brand Tier:{" "}
                              <strong>{v.brand_tier || "Universal"}</strong> · ID:{" "}
                              <span className="font-mono">{v.id}</span>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Diff / Changelog Tab */
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-foreground">
                        <GitCompare className="w-4 h-4 text-primary" />
                        <span>Komparasi Lineage Versi</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary">
                        {selectedFamily.activeTemplate.version} (Aktif)
                      </span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Pembaruan pada standar <strong>{selectedFamily.name}</strong> otomatis tersinkronisasi ke seluruh jadwal audit 106+ hotel saat berstatus LOCKED.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-bold text-foreground text-xs uppercase tracking-wider">
                      Daftar Penyesuaian Standar & Integrasi:
                    </h5>
                    <div className="rounded-xl border border-border/60 divide-y divide-border/60 bg-card overflow-hidden">
                      <div className="p-3 bg-emerald-500/5 flex items-start gap-2.5 text-emerald-700 dark:text-emerald-400 font-medium">
                        <span className="font-mono font-bold shrink-0 text-emerald-600">[+] PERSISTED</span>
                        <span>Struktur checklist tersimpan permanen di tabel `checklist_sections` & `checklist_items`.</span>
                      </div>
                      <div className="p-3 bg-blue-500/5 flex items-start gap-2.5 text-blue-700 dark:text-blue-400 font-medium">
                        <span className="font-mono font-bold shrink-0 text-blue-600">[*] VERSIONING</span>
                        <span>Auto-archive versi lama saat versi revisi baru di-LOCK oleh Root Admin.</span>
                      </div>
                      <div className="p-3 bg-amber-500/5 flex items-start gap-2.5 text-amber-700 dark:text-amber-400 font-medium">
                        <span className="font-mono font-bold shrink-0 text-amber-600">[*] REUSABLE</span>
                        <span>Pengikatan langsung ke Summary Model Skoring dan Form Audit Hotel (/dashboard/audits/create).</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Fork / New Revision Drawer inside Modal */}
              {isForkingNewVersion ? (
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GitFork className="w-4 h-4 text-primary" />
                      <strong className="text-foreground">Formulir Pembuatan Revisi Standar Baru</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsForkingNewVersion(false)}
                      className="text-xs text-muted-foreground hover:text-foreground font-semibold"
                    >
                      Batal
                    </button>
                  </div>

                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Sistem akan menduplikasi struktur template <strong>{selectedFamily.name}</strong> ({selectedFamily.activeTemplate.version}) ke dalam versi <strong>DRAFT</strong> baru di PostgreSQL sehingga dapat disesuaikan tanpa mengganggu sesi audit aktif.
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Nomor Versi Baru</label>
                    <input
                      type="text"
                      placeholder="Misal: v2026.3 atau v2027.1"
                      value={newVersionDraftInput}
                      onChange={(e) => setNewVersionDraftInput(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      disabled={busy || !newVersionDraftInput.trim()}
                      onClick={onConfirmCreateDraftVersion}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
                    >
                      {busy ? "Memproses..." : "Konfirmasi Buat Draft Revisi"}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-border/60 bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-[11px] text-muted-foreground">
                Active ID: <strong className="font-mono text-foreground">{selectedFamily.activeTemplate.id}</strong>
              </span>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {!isForkingNewVersion && (
                  <button
                    type="button"
                    onClick={() => setIsForkingNewVersion(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm shadow-primary/20"
                  >
                    <GitFork className="w-3.5 h-3.5" />
                    <span>Buka Versi Baru (Draft Revisi)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedFamily(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}