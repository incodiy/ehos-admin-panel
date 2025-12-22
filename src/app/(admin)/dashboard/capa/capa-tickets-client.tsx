"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { DataTable, StatusPill, type Column, type ToneKey } from "@/components/admin/data-table";
import { ApiError } from "@/lib/api/client";
import { useLanguage } from "@/context/LanguageContext";
import {
  Plus,
  ShieldAlert,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  Building2,
  X,
  Users,
  AlertTriangle,
  ArrowRight,
  Eye,
  CheckCircle2,
  Loader2,
  Send,
  Sparkles,
  Info,
  Layers,
  Wrench,
  Camera,
  ShieldCheck,
  Lock,
} from "lucide-react";
import type { components } from "@/lib/api/openapi";
import {
  capaBulkAssignAction,
  capaBulkEscalateAction,
  capaGetResolversAction,
  capaAssignAction,
} from "@/app/actions/capa";

type CapaTicket = components["schemas"]["CapaTicket"];
export type CapaTicketListResult = {
  success?: boolean;
  data?: CapaTicket[];
  meta?: components["schemas"]["PaginationMeta"];
};

export type HotelSummary = {
  id: string;
  name: string;
  code: string;
  city?: string;
};

type ResolverUser = {
  id: string;
  name: string;
  email?: string;
  role_code?: string;
};

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "AWAITING_GM", "AWAITING_QA", "CLOSED"] as const;
const PRIORITY_OPTIONS = ["1", "2", "3"] as const;

const STATUS_TONE: Record<string, ToneKey> = {
  OPEN: "off",
  IN_PROGRESS: "wait",
  AWAITING_GM: "wait",
  AWAITING_QA: "wait",
  CLOSED: "on",
};

const SLA_TONE: Record<string, ToneKey> = {
  ON_TRACK: "on",
  AT_RISK: "wait",
  OVERDUE: "off",
};

const ESCAL_STEP: Record<string, string> = { "0": "GM", "1": "ROM", "2": "VP", "3": "VP+" };

export function CapaTicketsClient({
  result,
  error,
  filters,
  filteredHotel,
  initialResolvers = [],
}: {
  result: CapaTicketListResult | null;
  error: ApiError | null;
  filters: { status?: string; priority?: string; only_overdue?: boolean; hotel_id?: string };
  filteredHotel?: HotelSummary | null;
  initialResolvers?: ResolverUser[];
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();

  const [showPolicyGuide, setShowPolicyGuide] = useState(false);
  const [showWorkflowStepper, setShowWorkflowStepper] = useState(true);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Resolver users list for assignment
  const [resolvers, setResolvers] = useState<ResolverUser[]>(initialResolvers);
  const [loadingResolvers, setLoadingResolvers] = useState(false);

  // Bulk Modal state
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [bulkAssignee, setBulkAssignee] = useState("");
  const [bulkNote, setBulkNote] = useState("");
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Quick Drawer Preview state
  const [previewTicket, setPreviewTicket] = useState<CapaTicket | null>(null);

  // In-line assign modal state
  const [inlineTicket, setInlineTicket] = useState<CapaTicket | null>(null);
  const [inlineAssignee, setInlineAssignee] = useState("");
  const [inlineNote, setInlineNote] = useState("");
  const [inlineProcessing, setInlineProcessing] = useState(false);

  const tickets = result?.data ?? [];
  const meta = result?.meta;

  // Load resolvers on mount or hotel change
  useEffect(() => {
    let alive = true;
    setLoadingResolvers(true);
    capaGetResolversAction(filters.hotel_id).then((res) => {
      if (alive && res.ok && res.users.length > 0) {
        setResolvers(res.users);
      }
      if (alive) setLoadingResolvers(false);
    });
    return () => {
      alive = false;
    };
  }, [filters.hotel_id]);

  function buildHref(next: { status?: string; priority?: string; only_overdue?: boolean; hotel_id?: string }) {
    const merged = { ...filters, ...next };
    const sp = new URLSearchParams();
    if (merged.status) sp.set("status", merged.status);
    if (merged.priority) sp.set("priority", merged.priority);
    if (merged.only_overdue) sp.set("only_overdue", "1");
    if (merged.hotel_id) sp.set("hotel_id", merged.hotel_id);
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  // Handle Bulk Assign
  async function handleBulkAssign() {
    if (!bulkAssignee || selectedIds.size === 0) return;
    setBulkProcessing(true);
    setBulkMessage(null);

    const ids = Array.from(selectedIds);
    const res = await capaBulkAssignAction(ids, bulkAssignee, bulkNote);

    setBulkProcessing(false);
    if (res.ok) {
      setBulkMessage({ type: "success", text: res.message || "Berhasil menugaskan tiket terpilih." });
      setSelectedIds(new Set());
      setTimeout(() => {
        setShowBulkAssignModal(false);
        setBulkMessage(null);
        router.refresh();
      }, 1200);
    } else {
      setBulkMessage({ type: "error", text: res.message || "Gagal melakukan penugasan massal." });
    }
  }

  // Handle Bulk Escalate
  async function handleBulkEscalate(idsToEscalate?: string[]) {
    const targetIds = idsToEscalate || Array.from(selectedIds);
    if (targetIds.length === 0) return;
    if (!confirm(`Tingkatkan eskalasi untuk ${targetIds.length} tiket terpilih?`)) return;

    const res = await capaBulkEscalateAction(targetIds);
    if (res.ok) {
      setSelectedIds(new Set());
      router.refresh();
    }
  }

  // Handle Single In-line Assign
  async function handleInlineAssign() {
    if (!inlineTicket?.id || !inlineAssignee) return;
    setInlineProcessing(true);
    const res = await capaAssignAction(inlineTicket.id, inlineAssignee, inlineNote);
    setInlineProcessing(false);
    if (res.ok) {
      setInlineTicket(null);
      setInlineAssignee("");
      setInlineNote("");
      router.refresh();
    }
  }

  const { language } = useLanguage();
  const isEn = language === "en";

  const columns: Column<CapaTicket>[] = [
    { key: "receipt_id", label_id: t("capa.cols.id"), label_en: t("capa.cols.id"), width: 110 },
    { key: "title", label_id: t("capa.cols.title"), label_en: t("capa.cols.title"), minWidth: 260 },
    {
      key: "priority",
      label_id: t("capa.cols.priority"),
      label_en: t("capa.cols.priority"),
      width: 90,
      render: (_, row) =>
        row.priority === 1 ? (
          <Badge variant="destructive">P1</Badge>
        ) : row.priority === 2 ? (
          <Badge variant="warning">P2</Badge>
        ) : (
          <Badge variant="secondary">P3</Badge>
        ),
    },
    {
      key: "sla_status",
      label_id: t("capa.cols.sla"),
      label_en: t("capa.cols.sla"),
      width: 120,
      render: (_, row) => {
        const tone = SLA_TONE[row.sla_status ?? ""] ?? (row.overdue ? "off" : "on");
        const label = row.sla_status ?? (row.overdue ? "OVERDUE" : "ON_TRACK");
        return (
          <div className="flex flex-col gap-1">
            <StatusPill tone={tone}>{t(`capa.sla.${label}` as never)}</StatusPill>
            {row.overdue && (
              <span className="text-xs font-semibold text-destructive">{t("capa.overdueTag")}</span>
            )}
          </div>
        );
      },
    },
    {
      key: "escalation_level",
      label_id: t("capa.cols.escalation"),
      label_en: t("capa.cols.escalation"),
      width: 110,
      render: (_, row) =>
        row.escalation_level > 0 ? (
          <Badge variant="destructive" className="font-mono">
            ↑ {ESCAL_STEP[String(row.escalation_level)] ?? row.escalation_level}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "due_at",
      label_id: t("capa.cols.dueAt"),
      label_en: t("capa.cols.dueAt"),
      width: 150,
      render: (_, row) => {
        if (!row.due_at) return "—";
        const date = new Date(row.due_at);
        return (
          <span className={row.overdue ? "font-semibold text-destructive" : undefined}>
            {date.toLocaleString(isEn ? "en-US" : "id-ID")}
          </span>
        );
      },
    },
    {
      key: "status",
      label_id: t("capa.cols.status"),
      label_en: t("capa.cols.status"),
      width: 130,
      render: (_, row) => (
        <StatusPill tone={STATUS_TONE[row.status || ""] ?? "off"}>
          {t(`capa.status.${row.status}` as never)}
        </StatusPill>
      ),
    },
    {
      key: "actions",
      label_id: "Aksi Cepat",
      label_en: "Quick Actions",
      width: 150,
      render: (_, row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            title={isEn ? "Quick Preview Drawer" : "Pratinjau Cepat Laci Samping"}
            onClick={() => setPreviewTicket(row)}
            className="grid h-7 w-7 place-items-center rounded-lg border border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title={isEn ? "Assign to PIC" : "Tugaskan ke PIC"}
            onClick={() => {
              setInlineTicket(row);
              setInlineAssignee(row.assigned_to || "");
              setInlineNote("");
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-all cursor-pointer"
          >
            <Users className="h-3 w-3" />
            <span>{row.assigned_to ? (isEn ? "Reassign" : "Ganti PIC") : (isEn ? "Assign" : "Tugaskan")}</span>
          </button>
          <Link
            href={`/dashboard/capa/${row.id}`}
            title={isEn ? "Open Full Detail Page" : "Buka Halaman Detail Penuh"}
            className="grid h-7 w-7 place-items-center rounded-lg border border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
        <p className="mt-3 font-semibold">{t("capa.errorTitle")}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {error.status === 0 ? t("capa.errorNetwork") : t("capa.errorServer", { status: error.status })}
        </p>
        <Link
          href={pathname}
          className="mt-4 inline-block rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:opacity-90"
        >
          {t("capa.retry")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* ─── Interactive Workflow & Origin Stepper Card ─── */}
      <div className="rounded-3xl border border-border/70 bg-gradient-to-r from-card via-card/95 to-card p-5 shadow-lg backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3.5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
              <Layers className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-foreground tracking-tight">
                  {isEn ? "CAPA Workflow & Verification (Four-Eyes Principle)" : "Alur Kerja & Verifikasi CAPA (Four-Eyes Principle)"}
                </h3>
                <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">
                  {isEn ? "Standard SOP" : "SOP Standar"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEn
                  ? "Resolution center for periodic audit findings & hotel corrective incident tracking."
                  : "Pusat resolusi temuan audit berkala & pencatatan insiden perbaikan hotel."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowWorkflowStepper((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-background/80 px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition-all cursor-pointer shadow-xs"
            >
              <Info className="h-3.5 w-3.5 text-primary" />
              <span>
                {showWorkflowStepper
                  ? (isEn ? "Hide Workflow" : "Sembunyikan Alur")
                  : (isEn ? "View Workflow" : "Lihat Alur Kerja")}
              </span>
              {showWorkflowStepper ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            <button
              type="button"
              onClick={() => setShowPolicyGuide((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-background/80 px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition-all cursor-pointer shadow-xs"
            >
              <BookOpen className="h-3.5 w-3.5 text-amber-500" />
              <span>
                {showPolicyGuide
                  ? (isEn ? "Close SLA" : "Tutup SLA")
                  : (isEn ? "SLA Policy" : "Kebijakan SLA")}
              </span>
              {showPolicyGuide ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </div>

        {/* 5-Step Visual Stepper */}
        {showWorkflowStepper && (
          <div className="space-y-3 pt-1 animate-in fade-in duration-200">
            {/* Origin Callout Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-muted/30 border border-border/60 rounded-2xl p-3">
              <div className="flex items-start gap-2.5">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 font-black text-[11px]">
                  1
                </span>
                <div>
                  <span className="font-bold text-foreground">
                    {isEn ? "Automated from Audits (Majority)" : "Otomatis dari Audit (Mayoritas)"}
                  </span>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {isEn
                      ? "Every assessment item marked NO / CRITICAL is automatically published as a CAPA ticket upon audit report release."
                      : "Setiap butir penilaian berstatus NO / CRITICAL otomatis diterbitkan menjadi tiket CAPA saat laporan audit dipublikasikan."}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-blue-500/10 text-blue-600 font-black text-[11px]">
                  2
                </span>
                <div>
                  <span className="font-bold text-foreground">
                    {isEn ? "Manual via \"+ Create CAPA Ticket\"" : "Manual via \"+ Buat Tiket CAPA\""}
                  </span>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {isEn
                      ? "Specifically for sudden non-scheduled incidents (facility defect, critical guest complaint, GM inspection)."
                      : "Khusus temuan insiden mendadak di luar jadwal audit (seperti kerusakan fasilitas mendadak, komplain tamu kritis, atau inspeksi GM)."}
                  </p>
                </div>
              </div>
            </div>

            {/* Stepper Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs pt-1">
              <div className="rounded-2xl border border-border/70 bg-card p-3 space-y-1 relative">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-black border-border">
                    {isEn ? "Step 1" : "Tahap 1"}
                  </Badge>
                  <StatusPill tone="off">OPEN</StatusPill>
                </div>
                <h5 className="font-bold text-foreground flex items-center gap-1.5 pt-0.5">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  {isEn ? "PIC Assignment" : "Penugasan PIC"}
                </h5>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {isEn
                    ? "Admin/Auditor assigns ticket to unit HOD/technician (supports bulk assignment)."
                    : "Admin/Auditor menugaskan tiket ke HOD/Teknisi unit (dapat dilakukan massal)."}
                </p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card p-3 space-y-1 relative">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-black border-border">
                    {isEn ? "Step 2" : "Tahap 2"}
                  </Badge>
                  <StatusPill tone="wait">IN_PROGRESS</StatusPill>
                </div>
                <h5 className="font-bold text-foreground flex items-center gap-1.5 pt-0.5">
                  <Wrench className="h-3.5 w-3.5 text-amber-500" />
                  {isEn ? "Physical Repair" : "Perbaikan Fisik"}
                </h5>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {isEn
                    ? "Unit technician performs corrective action on site within the designated SLA deadline."
                    : "Teknisi unit melakukan tindakan korektif di lapangan sesuai batas waktu SLA."}
                </p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card p-3 space-y-1 relative">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-black border-border">
                    {isEn ? "Step 3" : "Tahap 3"}
                  </Badge>
                  <StatusPill tone="wait">RESOLVED</StatusPill>
                </div>
                <h5 className="font-bold text-foreground flex items-center gap-1.5 pt-0.5">
                  <Camera className="h-3.5 w-3.5 text-blue-500" />
                  {isEn ? "Upload AFTER Photo" : "Unggah Foto AFTER"}
                </h5>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {isEn
                    ? "PIC uploads photographic evidence of completed repair and submits resolution notes."
                    : "PIC mengunggah foto bukti hasil perbaikan dan mengirimkan catatan resolusi."}
                </p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card p-3 space-y-1 relative">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-black border-border">
                    {isEn ? "Step 4" : "Tahap 4"}
                  </Badge>
                  <StatusPill tone="wait">AWAITING_GM</StatusPill>
                </div>
                <h5 className="font-bold text-foreground flex items-center gap-1.5 pt-0.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
                  {isEn ? "GM Verification" : "Verifikasi GM"}
                </h5>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {isEn
                    ? "Unit General Manager validates on-site physical evidence authenticity."
                    : "General Manager unit memvalidasi keabsahan bukti fisik di properti."}
                </p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card p-3 space-y-1 relative">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-black border-border">
                    {isEn ? "Step 5" : "Tahap 5"}
                  </Badge>
                  <StatusPill tone="on">CLOSED</StatusPill>
                </div>
                <h5 className="font-bold text-foreground flex items-center gap-1.5 pt-0.5">
                  <Lock className="h-3.5 w-3.5 text-emerald-500" />
                  {isEn ? "QA Closure" : "Penutupan QA"}
                </h5>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {isEn
                    ? "Corporate QA approves corporate standards and permanently closes the ticket."
                    : "Corporate QA menyetujui standar korporat & menutup tiket secara permanen."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SLA & Workflow Policy Cards */}
        {showPolicyGuide && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1 animate-in fade-in zoom-in-95 duration-200">
            {/* P1 SLA */}
            <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge variant="destructive" className="text-[10px] font-black">P1 · CRITICAL</Badge>
                <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {isEn ? "48 Hours" : "48 Jam"}
                </span>
              </div>
              <h4 className="font-bold text-foreground text-xs">
                {isEn ? "Life Safety & Critical Compliance" : "Life Safety & Kepatuhan Kritis"}
              </h4>
              <p className="text-[11px] text-muted-foreground leading-snug">
                {isEn
                  ? "Fire hazards, critical hygiene, or life safety risk. Must be resolved & verified within 2x24 hours."
                  : "Isu kebakaran, higienitas kritis, atau keselamatan nyawa. Wajib diselesaikan dan diverifikasi dalam 2x24 jam."}
              </p>
            </div>

            {/* P2 SLA */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge variant="warning" className="text-[10px] font-black">P2 · MAJOR</Badge>
                <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {isEn ? "14 Days" : "14 Hari"}
                </span>
              </div>
              <h4 className="font-bold text-foreground text-xs">
                {isEn ? "Operational Standard Findings" : "Temuan Standar Operasional"}
              </h4>
              <p className="text-[11px] text-muted-foreground leading-snug">
                {isEn
                  ? "Facility defects or department SOP non-conformance. Target resolution within 14 calendar days."
                  : "Ketidaksesuaian fasilitas atau SOP departemen. Target perbaikan tuntas dalam rentang 14 hari kalender."}
              </p>
            </div>

            {/* P3 SLA */}
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-[10px] font-bold">P3 · MINOR</Badge>
                <span className="font-mono text-xs font-bold text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {isEn ? "30 Days" : "30 Hari"}
                </span>
              </div>
              <h4 className="font-bold text-foreground text-xs">
                {isEn ? "Minor Admin & Maintenance" : "Administrasi & Perawatan Minor"}
              </h4>
              <p className="text-[11px] text-muted-foreground leading-snug">
                {isEn
                  ? "Light touch-ups and logbook/documentation updates. Target resolution within 30 calendar days."
                  : "Perbaikan ringan dan pembaruan logbook/dokumen. Target perbaikan dalam rentang 30 hari kalender."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ─── Active Hotel Filter Context Banner ─── */}
      {filters.hotel_id && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Building2 className="h-4.5 w-4.5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-medium">
                  {isEn ? "Showing Specific Hotel Tickets:" : "Menampilkan Tiket Khusus:"}
                </span>
                <span className="font-extrabold text-foreground text-sm">
                  {filteredHotel?.name || (isEn ? "Selected Hotel" : "Hotel Terpilih")}
                </span>
                {filteredHotel?.code && (
                  <Badge variant="outline" className="font-mono text-[10px] font-bold text-primary border-primary/30">
                    {filteredHotel.code}
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {isEn
                  ? "List of audit findings & operational corrective tickets for this specific property."
                  : "Daftar perbaikan temuan audit & ketidaksesuaian operasional khusus unit properti ini."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={buildHref({ hotel_id: undefined })}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3.5 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer shadow-xs"
            >
              <X className="h-3.5 w-3.5" />
              <span>{isEn ? "Show All Hotels" : "Tampilkan Semua Hotel"}</span>
            </Link>
          </div>
        </div>
      )}

      {/* Action Header & Filter chips */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("capa.filterStatus")}
          </span>
          {STATUS_OPTIONS.map((s) => {
            const active = filters.status === s;
            return (
              <Link
                key={s}
                href={buildHref({ status: active ? undefined : s })}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-smooth ${
                  active
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "border-border bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {t(`capa.status.${s}` as never)}
              </Link>
            );
          })}
          <Link
            href={buildHref({ only_overdue: filters.only_overdue ? undefined : true })}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-smooth ${
              filters.only_overdue
                ? "border-destructive/60 bg-destructive/15 text-destructive"
                : "border-border bg-background/50 text-muted-foreground hover:border-destructive/40 hover:text-foreground"
            }`}
          >
            {t("capa.filterOverdue")}
          </Link>
          <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("capa.filterPriority")}
          </span>
          {PRIORITY_OPTIONS.map((p) => {
            const active = filters.priority === p;
            return (
              <Link
                key={p}
                href={buildHref({ priority: active ? undefined : p })}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-smooth ${
                  active
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "border-border bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                P{p}
              </Link>
            );
          })}
        </div>

        {/* Enhanced + Buat Tiket CAPA Button */}
        <div className="flex items-center gap-2">
          <Link
            href={filters.hotel_id ? `/dashboard/capa/create?hotel_id=${filters.hotel_id}` : "/dashboard/capa/create"}
            className="group relative inline-flex items-center gap-2.5 rounded-2xl bg-brand-gradient px-4.5 py-2.5 text-xs font-bold text-primary-foreground shadow-glow transition-all hover:opacity-95 cursor-pointer"
          >
            <Plus className="h-4 w-4 shrink-0 transition-transform group-hover:rotate-90" />
            <div className="flex flex-col text-left">
              <span>{isEn ? "+ Create CAPA Ticket" : "+ Buat Tiket CAPA"}</span>
              <span className="text-[10px] font-normal text-white/80">
                {isEn ? "Incident / Ad-hoc Non-Audit" : "Insiden / Ad-hoc Non-Audit"}
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* ─── DataTable with Cavable Native Bulk Selection ─── */}
      <div className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-elegant backdrop-blur-xl">
        <DataTable<CapaTicket>
          columns={columns}
          data={tickets}
          rowKey={(row) => row.id ?? ""}
          isLoading={false}
          emptyMessage={t("capa.empty")}
          enableBulkSelect
          bulkActionsSlot={(cavableSelectedIds) => (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedIds(new Set(cavableSelectedIds));
                  setBulkAssignee("");
                  setBulkNote("");
                  setBulkMessage(null);
                  setShowBulkAssignModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 transition-all cursor-pointer"
              >
                <Users className="h-3.5 w-3.5" />
                <span>Tugaskan Massal ke PIC ({cavableSelectedIds.length})</span>
              </button>
              <button
                type="button"
                onClick={() => handleBulkEscalate(cavableSelectedIds)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer shadow-xs"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Eskalasi Massal ({cavableSelectedIds.length})</span>
              </button>
            </div>
          )}
          enableExport
          enableColumnToggle
          enableColumnResizing
          enableFullscreen
          onRowClick={(row) => {
            if (row.id) router.push(`/dashboard/capa/${row.id}`);
          }}
        />
        {meta && meta.total !== undefined && (
          <p className="mt-2 px-2 text-xs text-muted-foreground">
            {t("capa.total", { total: meta.total })}
          </p>
        )}
      </div>

      {/* ─── Bulk Assign Modal Dialog ─── */}
      {showBulkAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Users className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h4 className="font-extrabold text-foreground text-sm">Penugasan Massal CAPA</h4>
                  <p className="text-xs text-muted-foreground">Menugaskan {selectedIds.size} tiket sekaligus</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkAssignModal(false)}
                className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-foreground mb-1.5">
                  Pilih Penanggung Jawab (Resolver / PIC) <span className="text-destructive">*</span>
                </label>
                <select
                  value={bulkAssignee}
                  onChange={(e) => setBulkAssignee(e.target.value)}
                  disabled={loadingResolvers || bulkProcessing}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Pilih PIC Departemen / Teknisi --</option>
                  {resolvers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} {u.role_code ? `(${u.role_code})` : ""} - {u.email || ""}
                    </option>
                  ))}
                </select>
                {resolvers.length === 0 && !loadingResolvers && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Memuat daftar staf hotel... (Pastikan akun staf telah terdaftar di hotel ini)
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1.5">
                  Catatan / Instruksi Tugas (Opsional)
                </label>
                <textarea
                  value={bulkNote}
                  onChange={(e) => setBulkNote(e.target.value)}
                  placeholder="Contoh: Harap selesaikan perbaikan fasilitas ini sebelum batas SLA berakhir..."
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              {bulkMessage && (
                <div
                  className={`rounded-xl p-3 text-xs font-semibold ${
                    bulkMessage.type === "success"
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600"
                      : "bg-destructive/10 border border-destructive/30 text-destructive"
                  }`}
                >
                  {bulkMessage.text}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border/50 pt-3">
              <button
                type="button"
                onClick={() => setShowBulkAssignModal(false)}
                disabled={bulkProcessing}
                className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBulkAssign}
                disabled={!bulkAssignee || bulkProcessing}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-black text-primary-foreground shadow-md hover:opacity-95 disabled:opacity-50"
              >
                {bulkProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Menugaskan...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Tugaskan {selectedIds.size} Tiket</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── In-Line Single Assign Modal Dialog ─── */}
      {inlineTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Users className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h4 className="font-extrabold text-foreground text-sm">Tugaskan Tiket CAPA</h4>
                  <p className="text-xs text-muted-foreground">{inlineTicket.receipt_id || inlineTicket.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInlineTicket(null)}
                className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-muted/30 rounded-xl border border-border/60">
                <span className="font-bold text-foreground block">{inlineTicket.title}</span>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant={inlineTicket.priority === 1 ? "destructive" : inlineTicket.priority === 2 ? "warning" : "secondary"}>
                    P{inlineTicket.priority}
                  </Badge>
                  <StatusPill tone={STATUS_TONE[inlineTicket.status || ""] ?? "off"}>
                    {inlineTicket.status}
                  </StatusPill>
                </div>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1.5">
                  Pilih Penanggung Jawab (Resolver / PIC) <span className="text-destructive">*</span>
                </label>
                <select
                  value={inlineAssignee}
                  onChange={(e) => setInlineAssignee(e.target.value)}
                  disabled={loadingResolvers || inlineProcessing}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Pilih PIC Departemen / Teknisi --</option>
                  {resolvers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} {u.role_code ? `(${u.role_code})` : ""} - {u.email || ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1.5">
                  Catatan Tugas (Opsional)
                </label>
                <textarea
                  value={inlineNote}
                  onChange={(e) => setInlineNote(e.target.value)}
                  placeholder="Catatan penugasan..."
                  rows={2}
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border/50 pt-3">
              <button
                type="button"
                onClick={() => setInlineTicket(null)}
                disabled={inlineProcessing}
                className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleInlineAssign}
                disabled={!inlineAssignee || inlineProcessing}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-black text-primary-foreground shadow-md hover:opacity-95 disabled:opacity-50"
              >
                {inlineProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                <span>Simpan Penugasan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Quick Drawer Preview (Slide-over Sheet) ─── */}
      {previewTicket && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="h-full w-full max-w-md bg-card border-l border-border p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs font-bold text-primary border-primary/30">
                    {previewTicket.receipt_id || "CAPA TICKET"}
                  </Badge>
                  <StatusPill tone={STATUS_TONE[previewTicket.status || ""] ?? "off"}>
                    {previewTicket.status}
                  </StatusPill>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewTicket(null)}
                  className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-foreground leading-snug">
                  {previewTicket.title}
                </h3>
                {previewTicket.description && (
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {previewTicket.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-muted/20 border border-border/60 rounded-2xl p-3.5">
                <div>
                  <span className="text-[11px] text-muted-foreground block">Prioritas & Batas SLA:</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge variant={previewTicket.priority === 1 ? "destructive" : previewTicket.priority === 2 ? "warning" : "secondary"}>
                      P{previewTicket.priority}
                    </Badge>
                    <span className="font-bold text-foreground">
                      {previewTicket.due_at ? new Date(previewTicket.due_at).toLocaleDateString() : "—"}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Status SLA:</span>
                  <div className="mt-1">
                    <StatusPill tone={SLA_TONE[previewTicket.sla_status ?? ""] ?? "on"}>
                      {previewTicket.sla_status || "ON_TRACK"}
                    </StatusPill>
                  </div>
                </div>
              </div>

              {/* Next Steps Guidance Callout in Drawer */}
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3.5 text-xs space-y-1">
                <span className="font-bold text-primary flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Instruksi Langkah Selanjutnya:
                </span>
                <p className="text-muted-foreground leading-snug">
                  {previewTicket.status === "OPEN"
                    ? "Tiket ini belum ditugaskan. Silakan tetapkan staf penanggung jawab (PIC) untuk memulai pengerjaan."
                    : previewTicket.status === "IN_PROGRESS"
                    ? "Teknisi sedang melakukan perbaikan di lapangan. Menunggu unggahan foto bukti SESUDAH (AFTER Photo)."
                    : previewTicket.status === "AWAITING_GM"
                    ? "Perbaikan telah selesai dilaporkan. Menunggu persetujuan dari General Manager unit."
                    : previewTicket.status === "AWAITING_QA"
                    ? "GM telah menyetujui. Menunggu verifikasi standar korporat dari Corporate QA."
                    : "Tiket telah tuntas diverifikasi dan berstatus CLOSED."}
                </p>
              </div>
            </div>

            <div className="border-t border-border/50 pt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setInlineTicket(previewTicket);
                  setInlineAssignee(previewTicket.assigned_to || "");
                  setPreviewTicket(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-all cursor-pointer"
              >
                <Users className="h-3.5 w-3.5" />
                <span>Tugaskan PIC</span>
              </button>

              <Link
                href={`/dashboard/capa/${previewTicket.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md hover:opacity-95 transition-all"
              >
                <span>Buka Detail Penuh</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}