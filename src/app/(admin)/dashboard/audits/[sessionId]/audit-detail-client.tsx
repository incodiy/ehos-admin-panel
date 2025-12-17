"use client";

import { useState, useMemo, type ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useTranslations, useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { StatusPill, type ToneKey } from "@/components/admin/data-table";
import { DataTable, type Column } from "@/components/admin/data-table";
import { MultiImageGallery } from "@incodiy/cavadia";
import {
  AlertTriangle,
  Building2,
  CheckCircle,
  CheckCircle2,
  FileEdit,
  FileText,
  Flag,
  ListChecks,
  MapPin,
  RotateCcw,
  Send,
  Shield,
  ShieldAlert,
  Trash2,
  User,
  LayoutList,
  Table as TableIcon,
  X,
  Sparkles,
  ExternalLink,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from "lucide-react";
import {
  publishAuditSessionAction,
  submitAuditSessionAction,
  reopenAuditSessionAction,
  deleteAuditSessionAction,
  type AuditSessionRow,
  type AuditItemScoreRow,
  type FindingRow,
  type AuditMediaRow,
  type ComprehensiveAuditData,
} from "@/app/actions/audit";
import { AuditScoringWorksheet } from "./audit-scoring-worksheet";

// Dynamically import LocationPicker from @incodiy/cavaloc with all rich enterprise tier features
const LocationPicker = dynamic(
  () => import("@incodiy/cavaloc").then((mod) => mod.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 w-full animate-pulse rounded-2xl bg-muted/40 flex items-center justify-center text-xs text-muted-foreground">
        Loading Map...
      </div>
    ),
  }
);

export type AuditDetail = {
  session?: AuditSessionRow;
  department_breakdown?: Array<{
    section_code?: string;
    section_name?: string;
    score?: number | null;
    max?: number | null;
    pct?: number | null;
    items_count?: number | null;
  }>;
  items?: AuditItemScoreRow[];
  findings?: FindingRow[];
};

export type HotelDetailData = {
  id: string;
  name: string;
  code: string;
  image_url?: string | null;
  brand?: string | null;
  brand_tier?: string | null;
  city?: string | null;
  address?: string | null;
  geo?: { lat: number; lng: number };
  geofence_radius_meters?: number;
};

const STATUS_TONE: Record<string, ToneKey> = {
  DRAFT: "off",
  IN_PROGRESS: "wait",
  SUBMITTED: "wait",
  PUBLISHED: "on",
};

const TYPE_TONE: Record<string, ToneKey> = {
  FULL: "on",
  MICRO: "wait",
  FOLLOWUP: "off",
};

const SEVERITY_TONE: Record<string, string> = {
  CRITICAL: "bg-red-600/15 text-red-600 border-red-500/30",
  MAJOR: "bg-amber-600/15 text-amber-600 border-amber-500/30",
  MINOR: "bg-slate-600/15 text-slate-600 border-slate-500/30",
};

export function AuditDetailClient({
  detail,
  canPublish = false,
  media = [],
  hotel,
  hotelGeo,
  comprehensiveData,
}: {
  detail: AuditDetail;
  canPublish?: boolean;
  media?: AuditMediaRow[];
  hotel?: HotelDetailData | null;
  hotelGeo?: { lat: number; lng: number; geofence_radius?: number } | null;
  comprehensiveData?: ComprehensiveAuditData;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const sess = detail.session;
  const items = useMemo(() => detail.items ?? [], [detail.items]);
  const findings = useMemo(() => detail.findings ?? [], [detail.findings]);

  // Modal State Controls
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [showFindingsModal, setShowFindingsModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showWorkflowGuide, setShowWorkflowGuide] = useState(false);
  const [findingSeverityFilter, setFindingSeverityFilter] = useState<string>("ALL");

  const [publishing, setPublishing] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [confirmReopen, setConfirmReopen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"worksheet" | "table">("worksheet");

  const sectionNamesMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (detail.department_breakdown) {
      for (const b of detail.department_breakdown) {
        if (b.section_code && b.section_name) {
          map[b.section_code] = b.section_name;
        }
      }
    }
    return map;
  }, [detail.department_breakdown]);

  const breakdown = useMemo(() => {
    if (detail.department_breakdown && detail.department_breakdown.length > 0) {
      return detail.department_breakdown.map((b) => {
        const rawPct = b.pct != null ? Number(b.pct) : undefined;
        return {
          ...b,
          pct: rawPct != null ? (rawPct > 1 ? rawPct : rawPct * 100) : undefined,
        };
      });
    }
    // Dynamic fallback from items
    const secMap: Record<
      string,
      { section_code: string; section_name: string; score: number; max: number; items_count: number }
    > = {};
    for (const it of items) {
      const code = it.section_code || "GENERAL";
      const name = it.section_name || sectionNamesMap[code] || code;
      if (!secMap[code]) {
        secMap[code] = { section_code: code, section_name: name, score: 0, max: 0, items_count: 0 };
      }
      secMap[code].items_count += 1;
      if (!it.is_na) {
        const itemMax = Number(it.max_score ?? 90);
        secMap[code].max += itemMax;
        if (it.score != null) {
          secMap[code].score += Number(it.score);
        }
      }
    }
    return Object.values(secMap).map((s) => ({
      ...s,
      pct: s.max > 0 ? (s.score / s.max) * 100 : 100,
    }));
  }, [detail.department_breakdown, items, sectionNamesMap]);

  const draftFindings = useMemo(() => {
    return items
      .filter((it) => it.value === "NO" || it.value === "NEED REVIEW" || it.value === "FAIL" || (it.score === 0 && !it.is_na))
      .map((it) => ({
        id: String(it.id || it.item_id),
        title: it.question_text || it.code || "Temuan Ketidaksesuaian",
        description: it.note || (it.value === "NEED REVIEW" ? "Butir memerlukan evaluasi dan perbaikan" : "Standar belum terpenuhi"),
        severity: it.is_life_safety ? "CRITICAL" : it.value === "NO" ? "MAJOR" : "MINOR",
        is_life_safety: Boolean(it.is_life_safety),
        item_code: it.code,
        location: it.room_ref,
        is_draft: true,
      }));
  }, [items]);

  const allFindings = useMemo(() => {
    return findings.length > 0 ? findings : draftFindings;
  }, [findings, draftFindings]);

  const filteredFindings = useMemo(() => {
    if (findingSeverityFilter === "ALL") return allFindings;
    if (findingSeverityFilter === "LIFE_SAFETY") return allFindings.filter((f) => f.is_life_safety);
    return allFindings.filter((f) => f.severity === findingSeverityFilter);
  }, [allFindings, findingSeverityFilter]);

  if (!sess) return null;

  const isEditable = sess.status === "DRAFT" || sess.status === "IN_PROGRESS";

  async function handlePublish() {
    if (!sess?.id) return;
    setPublishing(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await publishAuditSessionAction(sess.id);
      if (!res.ok) {
        setActionError(res.message || t("audit.publishError"));
        return;
      }
      setActionSuccess(t("audit.publishSuccess"));
      router.refresh();
    } catch {
      setActionError(t("audit.publishError"));
    } finally {
      setPublishing(false);
    }
  }

  async function handleSubmitReview() {
    if (!sess?.id) return;
    setSubmittingReview(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await submitAuditSessionAction(sess.id);
      if (!res.ok) {
        setActionError(res.message || t("audit.submitError"));
        return;
      }
      setActionSuccess(t("audit.submitSuccess"));
      router.refresh();
    } catch {
      setActionError(t("audit.submitError"));
    } finally {
      setSubmittingReview(false);
    }
  }

  async function handleReopen() {
    if (!sess?.id) return;
    setReopening(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await reopenAuditSessionAction(sess.id);
      if (!res.ok) {
        setActionError(res.message || t("audit.reopenError"));
        return;
      }
      setActionSuccess(t("audit.reopenSuccess"));
      setConfirmReopen(false);
      router.refresh();
    } catch {
      setActionError(t("audit.reopenError"));
    } finally {
      setReopening(false);
    }
  }

  async function handleDelete() {
    if (!sess?.id) return;
    setDeleting(true);
    setActionError(null);
    try {
      const res = await deleteAuditSessionAction(sess.id);
      if (!res.ok) {
        setActionError(res.message || t("audit.deleteError"));
        return;
      }
      router.push("/dashboard/audits");
      router.refresh();
    } catch {
      setActionError(t("audit.deleteError"));
    } finally {
      setDeleting(false);
    }
  }

  const dateFmt = (s?: string | null) =>
    s ? new Date(s + "T00:00:00").toLocaleDateString() : "—";
  const dtFmt = (s?: string | null) => (s ? new Date(s).toLocaleString() : "—");

  const itemColumns: Column<AuditItemScoreRow>[] = [
    {
      key: "code",
      label_id: t("audit.cols.itemCode"),
      label_en: t("audit.cols.itemCode"),
      width: 80,
      render: (_, row) => (
        <span className="font-mono text-xs text-muted-foreground">{row.code}</span>
      ),
    },
    {
      key: "question_text",
      label_id: t("audit.cols.question"),
      label_en: t("audit.cols.question"),
      minWidth: 280,
      render: (_, row) => (
        <div className="flex flex-col gap-1">
          <span className="text-sm">{row.question_text}</span>
          {row.is_life_safety && (
            <span className="inline-flex w-fit items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-red-600">
              <ShieldAlert className="h-3 w-3" /> {t("audit.lifeSafety")}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "section",
      label_id: t("audit.cols.section"),
      label_en: t("audit.cols.section"),
      width: 130,
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs text-muted-foreground">
            {row.section_code}
          </span>
          <span className="text-xs">{row.section_name}</span>
        </div>
      ),
    },
    {
      key: "room_ref",
      label_id: t("audit.cols.room"),
      label_en: t("audit.cols.room"),
      width: 90,
      render: (_, row) => row.room_ref ?? "—",
    },
    {
      key: "value",
      label_id: t("audit.cols.value"),
      label_en: t("audit.cols.value"),
      width: 90,
      render: (_, row) =>
        row.is_na ? (
          <StatusPill tone="off">{t("audit.na")}</StatusPill>
        ) : (
          <span>{row.value ?? "—"}</span>
        ),
    },
    {
      key: "score",
      label_id: t("audit.cols.score"),
      label_en: t("audit.cols.score"),
      width: 100,
      render: (_, row) => {
        if (row.is_na || row.score === null)
          return <span className="text-muted-foreground">—</span>;
        return (
          <span className="font-semibold tabular-nums">
            {Number(row.score).toFixed(1)}
            {row.max_score != null && (
              <span className="font-normal text-muted-foreground">
                /{Number(row.max_score).toFixed(0)}
              </span>
            )}
          </span>
        );
      },
    },
    {
      key: "note",
      label_id: t("audit.cols.note"),
      label_en: t("audit.cols.note"),
      minWidth: 180,
      render: (_, row) =>
        row.note ? (
          <span className="text-xs text-muted-foreground">{row.note}</span>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1: 2-COLUMN HEADER (LEFT: HOTEL INFO CARD, RIGHT: CAVALOC MAP)
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* KOLOM KIRI (7 Kolom): Card Informasi Hotel Elegan */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card/90 to-card/70 p-6 shadow-xl backdrop-blur-xl relative overflow-hidden group">
          {/* Subtle Background Accent Glow */}
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          <div>
            {/* Top Hotel Header with Thumbnail & Badges */}
            <div className="flex flex-col sm:flex-row items-start gap-4">
              {/* Hotel Photo / Thumbnail */}
              <div className="relative h-20 w-28 sm:h-24 sm:w-32 shrink-0 rounded-2xl overflow-hidden border border-border/80 shadow-md bg-muted">
                {hotel?.image_url ? (
                  <img
                    src={hotel.image_url}
                    alt={sess.hotel_name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                    <Building2 className="h-8 w-8" />
                    <span className="text-[10px] font-bold mt-1 tracking-wider uppercase">Swiss-Belhotel</span>
                  </div>
                )}
                {hotel?.brand_tier && (
                  <div className="absolute bottom-1 left-1 right-1 rounded-md bg-black/60 backdrop-blur-sm px-1.5 py-0.5 text-center text-[9px] font-bold text-white uppercase tracking-wider">
                    {hotel.brand_tier}
                  </div>
                )}
              </div>

              {/* Title & Badges */}
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                    {sess.hotel_code}
                  </span>
                  <StatusPill tone={TYPE_TONE[sess.audit_type ?? ""] ?? "off"}>
                    {t(`audit.type.${sess.audit_type}` as never)}
                  </StatusPill>
                  <StatusPill tone={STATUS_TONE[sess.status ?? ""] ?? "off"}>
                    {t(`audit.status.${sess.status}` as never)}
                  </StatusPill>
                  {sess.pass_fail && (
                    <Badge variant={sess.pass_fail === "PASS" ? "success" : "destructive"}>
                      {t(sess.pass_fail === "PASS" ? "audit.verdictPass" : "audit.verdictFail")}
                    </Badge>
                  )}
                </div>

                <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight leading-tight line-clamp-1">
                  {sess.hotel_name}
                </h2>

                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="font-medium">{t(`cfg.dept.${sess.department}` as never)}</span>
                  <span>•</span>
                  <span>{hotel?.city || "Indonesia"}</span>
                  {hotel?.brand && (
                    <>
                      <span>•</span>
                      <span className="font-medium text-foreground/80">{hotel.brand}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Metrics Key-Value Grid */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-border/50 pt-4">
              <Kv
                label={t("audit.kv.period")}
                value={
                  dateFmt(sess.date_start) +
                  (sess.date_end && sess.date_end !== sess.date_start ? ` – ${dateFmt(sess.date_end)}` : "")
                }
              />
              <Kv
                label={t("audit.kv.score")}
                value={
                  sess.total_score != null
                    ? `${Number(sess.total_score).toFixed(1)} / 100`
                    : "—"
                }
                strong
              />
              <Kv
                label={t("audit.kv.auditor")}
                icon={<User className="h-3.5 w-3.5" />}
                value={sess.auditor_name ?? "—"}
              />
              <Kv
                label={t("audit.kv.published")}
                value={sess.published_at ? dtFmt(sess.published_at) : "—"}
              />
              <Kv
                label={t("audit.kv.origin")}
                value={t(`audit.origin.${sess.origin}` as never)}
              />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("audit.geofenceRadius")}
                </p>
                <p className="mt-0.5 text-xs font-bold text-foreground">
                  {hotelGeo?.geofence_radius ?? 200} {t("audit.meters")}
                </p>
              </div>
            </div>

            {/* Template Info & Builder Link */}
            {sess.template_id && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/40 px-3.5 py-2 text-xs border border-border/40">
                <span className="text-muted-foreground text-[11px]">
                  {t("audit.masterChecklist")}{" "}
                  <strong className="text-foreground">
                    {sess.department} {sess.template_version ? `(v${sess.template_version})` : ""}
                  </strong>
                </span>
                <Link
                  href={`/dashboard/config/checklist/${sess.template_id}/edit?returnTo=/dashboard/audits/${sess.id}`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                >
                  <span>{t("audit.openBuilder")}</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>

          {/* Action Bar (Submit, Reopen, Publish, PDF, Edit, Delete) */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
            <div className="flex items-center gap-2">
              {sess.status === "PUBLISHED" && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="h-4 w-4" /> {t("audit.lockedState")}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* DRAFT: Edit + Delete */}
              {sess.status === "DRAFT" && (
                <>
                  <Link
                    href={`/dashboard/audits/${sess.id}/edit`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-smooth hover:bg-muted"
                  >
                    <FileEdit className="h-3.5 w-3.5" />
                    {t("audit.editSession")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive transition-smooth hover:bg-destructive hover:text-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("audit.deleteSession")}
                  </button>
                </>
              )}

              {/* IN_PROGRESS: Submit for Review */}
              {sess.status === "IN_PROGRESS" && (
                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md shadow-primary/25 transition-smooth hover:opacity-95 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  {submittingReview ? t("audit.submitting") : t("audit.submitAudit")}
                </button>
              )}

              {/* SUBMITTED: Reopen + Publish (if canPublish) */}
              {sess.status === "SUBMITTED" && canPublish && (
                <>
                  <button
                    type="button"
                    onClick={() => setConfirmReopen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 transition-smooth hover:bg-amber-500/20"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {t("audit.reopenAudit")}
                  </button>
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={publishing}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/25 transition-smooth hover:bg-emerald-500 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {publishing ? t("audit.publishing") : t("audit.publishAudit")}
                  </button>
                </>
              )}

              {/* Download PDF report */}
              <a
                href={`/api/audit-report/${sess.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-95 transition-all"
              >
                <FileText className="h-3.5 w-3.5" />
                {t("audit.downloadReport")}
              </a>
            </div>
          </div>

          {/* Inline Action Notifications & Modals */}
          {actionError && (
            <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive font-medium">
              {actionError}
            </p>
          )}
          {actionSuccess && (
            <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 font-medium">
              {actionSuccess}
            </p>
          )}

          {confirmReopen && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
              <span className="font-medium text-amber-700 dark:text-amber-400">
                {t("audit.reopenConfirm")}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReopen}
                  disabled={reopening}
                  className="rounded-lg bg-amber-600 px-3 py-1 font-bold text-white transition-smooth hover:opacity-90 disabled:opacity-50"
                >
                  {reopening ? t("audit.reopening") : t("common.confirm")}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReopen(false)}
                  disabled={reopening}
                  className="rounded-lg border border-border bg-card px-3 py-1 font-medium text-muted-foreground transition-smooth hover:text-foreground"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          )}

          {confirmDelete && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs">
              <span className="font-medium text-destructive">
                {t("audit.deleteConfirm")}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-lg bg-destructive px-3 py-1 font-bold text-white transition-smooth hover:opacity-90 disabled:opacity-50"
                >
                  {deleting ? t("audit.deleting") : t("common.confirm")}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="rounded-lg border border-border bg-card px-3 py-1 font-medium text-muted-foreground transition-smooth hover:text-foreground"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* KOLOM KANAN (5 Kolom): Card Peta Cavaloc Enterprise Suite */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl border border-border/70 bg-card/80 p-5 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground">{t("audit.gpsCoordinates")}</h3>
                <p className="text-[11px] text-muted-foreground">
                  {t("audit.geofenceRadius")}: <strong className="text-foreground">{hotelGeo?.geofence_radius ?? 200}m</strong>
                </p>
              </div>
            </div>

            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Cavaloc Enterprise Suite
            </span>
          </div>

          {/* Full Cavaloc Map Canvas with all controls */}
          <div className="mt-3 flex-1 overflow-hidden rounded-2xl border border-border/60 min-h-[280px]">
            <LocationPicker
              tier="enterprise"
              locale={locale === "en" ? "en" : "id"}
              initialCoords={{
                lat: hotelGeo?.lat ?? -8.775,
                lng: hotelGeo?.lng ?? 115.221,
              }}
              initialAddress={hotel?.address || `${sess.hotel_name}, Indonesia`}
              initialCity={hotel?.city || "Bali"}
              readOnly={true}
              enableFullscreen={true}
              enableDarkTiles={true}
              enableTravelRouting={true}
              enableNearbyRadar={true}
              enableMapExport={true}
              enableGeofencing={true}
              enableMultiProvider={true}
              enableLiveTraffic={true}
              enableWeatherAqi={true}
              pinColor="#10b981"
              mapHeight={290}
              onLocationSelected={() => {}}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40 pt-2.5">
            <span className="truncate">
              {sess.hotel_code} · {hotelGeo?.lat?.toFixed(5) ?? "-8.77500"}, {hotelGeo?.lng?.toFixed(5) ?? "115.22100"}
            </span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${hotelGeo?.lat ?? -8.775},${hotelGeo?.lng ?? 115.221}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline shrink-0"
            >
              <span>Google Maps</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1.5: AUDIT COMPLETION NOTIFICATION & CAPA REMEDIATION BRIDGE
         ═══════════════════════════════════════════════════════════════════════ */}
      {sess.status === "PUBLISHED" && (
        <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-card to-emerald-500/5 p-6 shadow-xl backdrop-blur-xl relative overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-md">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-extrabold text-foreground">
                    Sesi Audit Selesai & Terpublikasi Secara Resmi
                  </h3>
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                    PUBLISHED · VERIFIED
                  </Badge>
                  {sess.pass_fail && (
                    <Badge variant={sess.pass_fail === "PASS" ? "success" : "destructive"} className="text-[10px] font-black">
                      {sess.pass_fail === "PASS" ? "LULUS (PASS)" : "TIDAK LULUS (FAIL)"}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                  Seluruh penilaian telah diverifikasi dan dikunci secara permanen. Terdapat <strong className="text-foreground font-bold">{allFindings.length} butir ketidaksesuaian</strong>
                  {allFindings.filter((f) => f.is_life_safety).length > 0 && (
                    <span className="text-destructive font-bold"> (termasuk {allFindings.filter((f) => f.is_life_safety).length} isu kritis Life Safety)</span>
                  )} yang memerlukan tindakan perbaikan melalui modul tiket CAPA (*Corrective & Preventive Action*).
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowWorkflowGuide((prev) => !prev)}
                className="flex items-center gap-1.5 rounded-2xl border border-border/80 bg-background/80 px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition-all cursor-pointer shadow-xs"
              >
                <BookOpen className="h-4 w-4 text-primary" />
                <span>{showWorkflowGuide ? "Tutup Panduan Alur" : "Pelajari Alur Audit ➔ CAPA"}</span>
                {showWorkflowGuide ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>

              <Link
                href={`/dashboard/capa?hotel_id=${hotel?.id || ""}`}
                className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-black text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all cursor-pointer"
              >
                <ShieldAlert className="h-4 w-4" />
                <span>Kelola Tiket CAPA Hotel Ini</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Collapsible Interactive Workflow Visualizer */}
          {showWorkflowGuide && (
            <div className="mt-6 border-t border-border/50 pt-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Panduan Alur Integrasi: Dari Temuan Audit Menuju Penyelesaian CAPA
                </span>
                <span className="text-[11px] font-semibold text-primary">Siklus Standar Swiss-Belhotel</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                {/* Step 1 */}
                <div className="rounded-2xl border border-border/60 bg-card/60 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-[11px] font-black text-primary">1</span>
                    <Badge variant="outline" className="text-[9px]">Inspeksi</Badge>
                  </div>
                  <h4 className="font-bold text-foreground">Scoring & Checklist</h4>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Auditor mengevaluasi butir standar 3 departemen (Security, Kitchen, HK) dan Room Check fisik.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="rounded-2xl border border-border/60 bg-card/60 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-[11px] font-black text-primary">2</span>
                    <Badge variant="outline" className="text-[9px]">Publikasi</Badge>
                  </div>
                  <h4 className="font-bold text-foreground">Deteksi Temuan (*Findings*)</h4>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Butir bernilai NO (0) atau Life Safety otomatis terekam sebagai temuan ketidaksesuaian resmi.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-[11px] font-black text-amber-700 dark:text-amber-300">3</span>
                    <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-600">Tiket CAPA</Badge>
                  </div>
                  <h4 className="font-bold text-foreground">Penugasan PIC & SLA</h4>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Tiket CAPA terbit dengan target SLA (P1: 48 Jam, P2: 14 Hari, P3: 30 Hari) ke GM & Dept Head.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-[11px] font-black text-emerald-700 dark:text-emerald-300">4</span>
                    <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-600">Verifikasi</Badge>
                  </div>
                  <h4 className="font-bold text-foreground">Bukti Foto & Closed</h4>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    PIC hotel upload foto bukti Before/After perbaikan, lalu Auditor QA verifikasi dan tutup tiket (CLOSED).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2: SUMMARY INFORMATION CARD WITH 3 MODAL ACTION BUTTONS
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl border border-border/70 bg-gradient-to-r from-card via-card/90 to-card p-6 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                {t("audit.summaryTitle")}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("audit.summarySubtitle")}
            </p>
          </div>

          {/* Highlights Counter Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-1.5 text-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">{t("audit.auditScore")}</span>
              <span className="text-sm font-black text-foreground">
                {sess.total_score != null ? `${Number(sess.total_score).toFixed(1)}%` : "DRAFT"}
              </span>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-1.5 text-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">{t("audit.totalSections")}</span>
              <span className="text-sm font-black text-foreground">{t("audit.countSections", { count: breakdown.length })}</span>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-center">
              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">{t("audit.findingsIssue")}</span>
              <span className="text-sm font-black text-amber-600 dark:text-amber-400">{t("audit.countItems", { count: allFindings.length })}</span>
            </div>
          </div>
        </div>

        {/* 3 Prominent Action Buttons that Open Modals */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Button 1: Rincian Skor Per Bagian */}
          <button
            type="button"
            onClick={() => setShowBreakdownModal(true)}
            className="flex items-center justify-between rounded-2xl border border-border/70 bg-gradient-to-br from-card to-muted/30 p-4 text-left shadow-sm hover:border-primary/50 hover:bg-primary/5 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-sm">
                <ListChecks className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                  {t("audit.btnBreakdownTitle")}
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {t("audit.btnBreakdownDesc")}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary group-hover:bg-primary group-hover:text-white transition-all">
              {t("audit.countSections", { count: breakdown.length })}
            </span>
          </button>

          {/* Button 2: Temuan & Ketidaksesuaian */}
          <button
            type="button"
            onClick={() => setShowFindingsModal(true)}
            className="flex items-center justify-between rounded-2xl border border-border/70 bg-gradient-to-br from-card to-muted/30 p-4 text-left shadow-sm hover:border-amber-500/50 hover:bg-amber-500/5 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors shadow-sm">
                <Flag className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {t("audit.btnFindingsTitle")}
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {t("audit.btnFindingsDesc")}
                </p>
              </div>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold transition-all ${
                allFindings.length > 0
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {t("audit.countFindings", { count: allFindings.length })}
            </span>
          </button>

          {/* Button 3: Catatan Temuan Auditor */}
          <button
            type="button"
            onClick={() => setShowNotesModal(true)}
            className="flex items-center justify-between rounded-2xl border border-border/70 bg-gradient-to-br from-card to-muted/30 p-4 text-left shadow-sm hover:border-blue-500/50 hover:bg-blue-500/5 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors shadow-sm">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {t("audit.btnNotesTitle")}
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {t("audit.btnNotesDesc")}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
              {t("audit.badgeExecutive")}
            </span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 3: VIEW SWITCHER HEADER & WORKSHEET / TABLE CONTENT
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode("worksheet")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                viewMode === "worksheet"
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "border border-border/70 bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <LayoutList className="h-4 w-4" />
              <span>{t("audit.worksheetTab")}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                viewMode === "table"
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "border border-border/70 bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <TableIcon className="h-4 w-4" />
              <span>{t("audit.tableTab")}</span>
            </button>
          </div>

          <span className="text-xs text-muted-foreground font-medium">
            {t("audit.totalQuestions", { count: items.length })}
          </span>
        </div>

        {viewMode === "worksheet" ? (
          <AuditScoringWorksheet
            sessionId={sess.id}
            session={sess}
            items={items}
            sectionNames={sectionNamesMap}
            isEditable={isEditable}
            comprehensiveData={comprehensiveData}
            onSaveSuccess={() => {
              router.refresh();
            }}
          />
        ) : (
          <div className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-xl backdrop-blur-xl">
            <DataTable<AuditItemScoreRow>
              columns={itemColumns}
              data={items}
              rowKey={(row) => `${row.id}-${row.room_ref ?? ""}`}
              isLoading={false}
              emptyMessage={t("audit.itemsNone")}
              enableExport
              enableColumnToggle
              enableFullscreen
            />
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 1: RINCIAN SKOR PER BAGIAN (SECTION BREAKDOWN)
         ═══════════════════════════════════════════════════════════════════════ */}
      <AuditModal
        isOpen={showBreakdownModal}
        onClose={() => setShowBreakdownModal(false)}
        title="Rincian Skor Per Bagian (Section Breakdown)"
        subtitle={`Rekapitulasi pencapaian skor per seksi checklist untuk hotel ${sess.hotel_name}`}
        icon={<ListChecks className="h-5 w-5 text-primary" />}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-6">
          {/* Top Score Summary Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-muted/40 p-4 border border-border/60">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Total Skor Akumulasi
              </p>
              <h3 className="text-2xl font-black text-foreground">
                {sess.total_score != null ? `${Number(sess.total_score).toFixed(1)} / 100` : "Dalam Proses"}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary border border-primary/20">
                {breakdown.length} Seksi Departemen
              </span>
              {sess.pass_fail && (
                <Badge variant={sess.pass_fail === "PASS" ? "success" : "destructive"}>
                  {sess.pass_fail === "PASS" ? "HASIL: MEMENUHI STANDAR (PASS)" : "HASIL: BELUM MEMENUHI (FAIL)"}
                </Badge>
              )}
            </div>
          </div>

          {/* Section Breakdown Grid */}
          {breakdown.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("audit.sectionsNone")}
            </p>
          ) : (
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {breakdown.map((sec) => {
                const title =
                  sec.section_code && sec.section_name && sec.section_name !== sec.section_code
                    ? `${sec.section_code} — ${sec.section_name}`
                    : sec.section_name ?? sec.section_code;

                return (
                  <div
                    key={sec.section_code}
                    className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-bold text-foreground">
                        {title}
                      </p>
                    </div>
                    <div className="mt-2.5 flex items-baseline gap-1">
                      <span className="text-xl font-black tabular-nums text-foreground">
                        {sec.score != null ? Number(sec.score).toFixed(1) : "—"}
                      </span>
                      {sec.max != null && (
                        <span className="text-xs text-muted-foreground">
                          / {Number(sec.max).toFixed(0)} pts
                        </span>
                      )}
                      {sec.pct != null && (
                        <span
                          className={`ml-auto text-xs font-black tabular-nums ${
                            sec.pct >= 80
                              ? "text-emerald-600 dark:text-emerald-400"
                              : sec.pct >= 60
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {Math.round(sec.pct)}%
                        </span>
                      )}
                    </div>
                    <StatBar pct={sec.pct != null ? Math.round(sec.pct) : undefined} />
                    {sec.items_count != null && (
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        {t("audit.sectionsItems", { count: sec.items_count })}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AuditModal>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 2: TEMUAN & KETIDAKSESUAIAN (FINDINGS)
         ═══════════════════════════════════════════════════════════════════════ */}
      <AuditModal
        isOpen={showFindingsModal}
        onClose={() => setShowFindingsModal(false)}
        title="Temuan & Ketidaksesuaian (Findings)"
        subtitle="Daftar ketidaksesuaian SOP, butir koreksi lapangan, dan bukti dokumentasi foto"
        icon={<Flag className="h-5 w-5 text-amber-500" />}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          {/* Severity Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFindingSeverityFilter("ALL")}
                className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                  findingSeverityFilter === "ALL"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Semua ({allFindings.length})
              </button>
              <button
                type="button"
                onClick={() => setFindingSeverityFilter("LIFE_SAFETY")}
                className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                  findingSeverityFilter === "LIFE_SAFETY"
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-red-600 hover:bg-red-500/10"
                }`}
              >
                Life Safety ({allFindings.filter((f) => f.is_life_safety).length})
              </button>
              <button
                type="button"
                onClick={() => setFindingSeverityFilter("MAJOR")}
                className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                  findingSeverityFilter === "MAJOR"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-amber-600 hover:bg-amber-500/10"
                }`}
              >
                Major ({allFindings.filter((f) => f.severity === "MAJOR").length})
              </button>
              <button
                type="button"
                onClick={() => setFindingSeverityFilter("MINOR")}
                className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                  findingSeverityFilter === "MINOR"
                    ? "bg-slate-600 text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Minor ({allFindings.filter((f) => f.severity === "MINOR").length})
              </button>
            </div>

            <span className="text-xs text-muted-foreground">
              Menampilkan <strong>{filteredFindings.length}</strong> butir
            </span>
          </div>

          {/* Findings List */}
          {filteredFindings.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto opacity-70" />
              <p className="text-sm font-semibold text-foreground">Tidak Ada Temuan Ketidaksesuaian</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Seluruh butir yang dievaluasi telah memenuhi standar kepatuhan atau tidak memiliki catatan korektif.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFindings.map((f) => {
                const isDraft = "is_draft" in f && Boolean(f.is_draft);
                const findingMedia = media.filter(
                  (m) => m.target_id === f.id || m.target_id === String(f.id)
                );
                const imageUrls = findingMedia
                  .map(
                    (m) => m.url || (m.storage_key ? `/api/media/${m.id}` : null)
                  )
                  .filter((url): url is string => Boolean(url));

                return (
                  <div
                    key={f.id}
                    className={`flex flex-col gap-3 rounded-2xl border p-4 transition-colors ${
                      isDraft
                        ? "border-amber-500/30 bg-amber-50/10 dark:bg-amber-950/10"
                        : "border-border/60 bg-muted/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
                            SEVERITY_TONE[f.severity ?? ""] ??
                            "bg-muted/40 text-muted-foreground border-border/40"
                          }`}
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={
                              f.severity === "CRITICAL"
                                ? "destructive"
                                : f.severity === "MAJOR"
                                ? "warning"
                                : "secondary"
                            }
                          >
                            {t(`audit.severity.${f.severity}` as never)}
                          </Badge>
                          {isDraft && (
                            <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                              Draft Temuan Lapangan
                            </span>
                          )}
                          {f.is_life_safety && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-red-600 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                              <ShieldAlert className="h-3 w-3" /> {t("audit.lifeSafety")}
                            </span>
                          )}
                          {f.item_code && (
                            <span className="font-mono text-[11px] font-bold text-muted-foreground">
                              {f.item_code}
                            </span>
                          )}
                        </div>

                        <p className="mt-1.5 text-xs font-bold text-foreground">{f.title}</p>
                        {f.description && (
                          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                            {f.description}
                          </p>
                        )}
                        {f.location && (
                          <p className="mt-1.5 text-[11px] text-muted-foreground flex items-center gap-1">
                            <Shield className="h-3 w-3 text-primary" />
                            <span>Lokasi / Kamar: <strong>{f.location}</strong></span>
                          </p>
                        )}
                      </div>
                    </div>

                    {imageUrls.length > 0 && (
                      <div className="mt-2 border-t border-border/40 pt-3">
                        <MultiImageGallery
                          images={imageUrls}
                          onChange={() => {}}
                          title={t("audit.evidencePhotos")}
                          className="max-w-md"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AuditModal>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 3: CATATAN TEMUAN AUDITOR (AUDITOR EXECUTIVE NOTES & SUMMARY)
         ═══════════════════════════════════════════════════════════════════════ */}
      <AuditModal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        title="Catatan Temuan Auditor (Auditor Summary)"
        subtitle="Ringkasan eksekutif, analisa kepatuhan SOP, dan catatan evaluasi resmi auditor"
        icon={<FileText className="h-5 w-5 text-blue-500" />}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-6">
          {/* Executive Summary Narrative */}
          <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-muted/30 to-muted/10 p-5 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-primary">
              Ringkasan Eksekutif Resmi
            </h4>
            <p className="text-xs text-foreground leading-relaxed font-medium">
              Sesi audit standar <span className="font-bold">{sess.audit_type}</span> telah dilaksanakan pada unit properti{" "}
              <span className="font-bold text-primary">{sess.hotel_name}</span> ({sess.hotel_code}) untuk departemen operasional{" "}
              <span className="font-bold">{sess.department}</span>. Pencapaian skor akhir adalah sebesar{" "}
              <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {sess.total_score != null ? `${Number(sess.total_score).toFixed(1)} / 100` : "Dalam Evaluasi"}
              </span>{" "}
              dengan status keputusan resmi <span className="font-bold">{sess.pass_fail ?? "PENDING"}</span>.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-border/40 pt-3 text-xs text-muted-foreground">
              <div>
                <span className="block text-[10px] uppercase font-bold text-muted-foreground">Auditor Utama</span>
                <strong className="text-foreground">{sess.auditor_name ?? "—"}</strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-muted-foreground">Status FSM</span>
                <strong className="text-foreground">{sess.status}</strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-muted-foreground">Total Temuan</span>
                <strong className="text-foreground">{allFindings.length} Isu Tercatat</strong>
              </div>
            </div>
          </div>

          {/* Items with Notes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" />
              <span>Catatan Komentar Per Butir Pertanyaan</span>
            </h4>

            {(() => {
              const itemsWithNotes = items.filter((it) => it.note && it.note.trim().length > 0);
              if (itemsWithNotes.length === 0) {
                return (
                  <p className="py-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl border border-border/40">
                    Tidak ada catatan komentar khusus pada butir-butir evaluasi ini.
                  </p>
                );
              }
              return (
                <div className="divide-y divide-border/40 rounded-2xl border border-border/70 bg-card overflow-hidden">
                  {itemsWithNotes.map((it) => (
                    <div key={it.id} className="p-3.5 space-y-1 hover:bg-muted/10 transition-colors">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-primary">{it.code}</span>
                        <span className="text-[11px] text-muted-foreground font-medium">{it.section_name || it.section_code}</span>
                      </div>
                      <p className="text-xs font-semibold text-foreground">{it.question_text}</p>
                      <div className="mt-1 rounded-lg bg-muted/40 p-2 text-xs text-foreground italic border-l-2 border-primary">
                        &ldquo;{it.note}&rdquo;
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </AuditModal>
    </div>
  );
}

// ─── HELPER COMPONENTS ──────────────────────────────────────────────────────

function Kv({
  label,
  value,
  icon,
  strong,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-0.5 flex items-center gap-1.5 truncate text-xs sm:text-sm ${
          strong ? "font-black tabular-nums text-foreground" : "font-semibold text-foreground/90"
        }`}
      >
        {icon}
        {value}
      </p>
    </div>
  );
}

function StatBar({ pct }: { pct?: number }) {
  if (pct === undefined)
    return <div className="mt-2.5 h-1.5 w-full rounded-full bg-muted" />;
  const color =
    pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </div>
  );
}

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  maxWidth?: string;
}

function AuditModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidth = "max-w-3xl",
}: AuditModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div
        className={`relative z-10 w-full ${maxWidth} max-h-[88vh] flex flex-col rounded-3xl border border-border/80 bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border/50 bg-gradient-to-r from-card via-card/90 to-card p-5">
          <div className="flex items-start gap-3 min-w-0">
            {icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted/60 border border-border/60 shadow-sm mt-0.5">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-foreground tracking-tight">
                {title}
              </h3>
              {subtitle && (
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border/60 bg-muted/40 p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {children}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end border-t border-border/50 bg-muted/20 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-foreground px-5 py-2 text-xs font-bold text-background transition-all hover:opacity-90 shadow-sm"
          >
            Tutup Dialog
          </button>
        </div>
      </div>
    </div>
  );
}