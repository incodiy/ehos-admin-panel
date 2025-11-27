"use client";

import { useState, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { StatusPill, type ToneKey } from "@/components/admin/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/admin/data-table";
import { MultiImageGallery } from "@incodiy/cavadia";
import {
  AlertTriangle,
  Building2,
  CheckCircle,
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
} from "@/app/actions/audit";
import { AuditScoringWorksheet } from "./audit-scoring-worksheet";

const MapView = dynamic(
  () => import("@incodiy/cavaloc").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full animate-pulse rounded-xl bg-muted/40" />
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
  CRITICAL: "bg-red-600/15 text-red-600",
  MAJOR: "bg-amber-600/15 text-amber-600",
  MINOR: "bg-slate-600/15 text-slate-600",
};

export function AuditDetailClient({
  detail,
  canPublish = false,
  media = [],
  hotelGeo,
}: {
  detail: AuditDetail;
  canPublish?: boolean;
  media?: AuditMediaRow[];
  hotelGeo?: { lat: number; lng: number; geofence_radius?: number } | null;
}) {
  const t = useTranslations();
  const router = useRouter();
  const sess = detail.session;
  const items = useMemo(() => detail.items ?? [], [detail.items]);
  const findings = useMemo(() => detail.findings ?? [], [detail.findings]);

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
    <div className="space-y-5">
      {/* Meta header */}
      <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-elegant backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-primary-foreground shadow-glow">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">{sess.hotel_name}</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-mono">{sess.hotel_code}</span> ·{" "}
                {t(`cfg.dept.${sess.department}` as never)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={TYPE_TONE[sess.audit_type ?? ""] ?? "off"}>
              {t(`audit.type.${sess.audit_type}` as never)}
            </StatusPill>
            <StatusPill tone={STATUS_TONE[sess.status ?? ""] ?? "off"}>
              {t(`audit.status.${sess.status}` as never)}
            </StatusPill>
            {sess.pass_fail && (
              <Badge
                variant={sess.pass_fail === "PASS" ? "success" : "destructive"}
              >
                {t(
                  sess.pass_fail === "PASS"
                    ? "audit.verdictPass"
                    : "audit.verdictFail"
                )}
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3 lg:grid-cols-5">
          <Kv
            label={t("audit.kv.period")}
            value={
              dateFmt(sess.date_start) +
              (sess.date_end ? ` – ${dateFmt(sess.date_end)}` : "")
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

          {sess.template_id && (
            <div className="col-span-2 md:col-span-3 lg:col-span-5 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3 text-xs">
              <span className="text-muted-foreground">
                Master Checklist: <strong className="text-foreground">{sess.department} {sess.template_version ? `(v${sess.template_version})` : ""}</strong>
              </span>
              <Link
                href={`/dashboard/config/checklist/${sess.template_id}/edit?returnTo=/dashboard/audits/${sess.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 font-semibold text-primary hover:bg-primary hover:text-white transition-all"
              >
                <span>Buka Builder / Edit Template</span>
                <span className="text-[10px]">↗</span>
              </Link>
            </div>
          )}
        </div>

        {/* FSM Action Bar */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-4">
          <div className="flex items-center gap-2">
            {sess.status === "PUBLISHED" && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
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
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition-smooth hover:bg-muted"
                >
                  <FileEdit className="h-3.5 w-3.5" />
                  {t("audit.editSession")}
                </Link>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-xs font-semibold text-destructive transition-smooth hover:bg-destructive hover:text-white"
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
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow transition-smooth hover:opacity-90 disabled:opacity-50"
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
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-600 transition-smooth hover:bg-amber-500/20"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t("audit.reopenAudit")}
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishing}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-glow transition-smooth hover:bg-emerald-500 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  {publishing ? t("audit.publishing") : t("audit.publishAudit")}
                </button>
              </>
            )}

            {/* Download PDF report */}
            <a
              href={`/api/audit-report/${sess.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow transition-smooth hover:opacity-90"
            >
              <FileText className="h-3.5 w-3.5" />
              {t("audit.downloadReport")}
            </a>
          </div>
        </div>

        {/* Action feedback banners */}
        {actionError && (
          <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {actionError}
          </p>
        )}
        {actionSuccess && (
          <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600">
            {actionSuccess}
          </p>
        )}

        {/* Confirmation Inline Banners */}
        {confirmReopen && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
            <span className="font-medium text-amber-600">
              {t("audit.reopenConfirm")}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReopen}
                disabled={reopening}
                className="rounded-lg bg-amber-600 px-3 py-1 font-semibold text-white transition-smooth hover:opacity-90 disabled:opacity-50"
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
                className="rounded-lg bg-destructive px-3 py-1 font-semibold text-white transition-smooth hover:opacity-90 disabled:opacity-50"
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

      {/* Geofence & Inspection Location MapView (@incodiy/cavaloc) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-primary" />
            {t("audit.gpsCoordinates")}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {sess.hotel_name} — Geofence Radius: {hotelGeo?.geofence_radius ?? 200}m
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border border-border/60">
            <MapView
              lat={hotelGeo?.lat ?? -6.2088}
              lng={hotelGeo?.lng ?? 106.8456}
              title={`${sess.hotel_code} — ${sess.hotel_name}`}
              address={`${sess.hotel_name}, Indonesia`}
              zoom={15}
              height={260}
              interactive={true}
              pinColor="#0ea5e9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="h-4 w-4 text-primary" />
            {t("audit.sectionsTitle")}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {t("audit.sectionsSubtitle")}
          </p>
        </CardHeader>
        <CardContent>
          {breakdown.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("audit.sectionsNone")}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {breakdown.map((sec) => {
                const title =
                  sec.section_code && sec.section_name && sec.section_name !== sec.section_code
                    ? `${sec.section_code} — ${sec.section_name}`
                    : sec.section_name ?? sec.section_code;

                return (
                  <div
                    key={sec.section_code}
                    className="rounded-xl border border-border/60 bg-muted/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {title}
                      </p>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-bold tabular-nums text-foreground">
                        {sec.score != null ? Number(sec.score).toFixed(1) : "—"}
                      </span>
                      {sec.max != null && (
                        <span className="text-xs text-muted-foreground">
                          / {Number(sec.max).toFixed(0)}
                        </span>
                      )}
                      {sec.pct != null && (
                        <span className="ml-auto text-xs font-semibold tabular-nums text-foreground">
                          {Math.round(sec.pct)}%
                        </span>
                      )}
                    </div>
                    <StatBar
                      pct={sec.pct != null ? Math.round(sec.pct) : undefined}
                    />
                    {sec.items_count != null && (
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {t("audit.sectionsItems", { count: sec.items_count })}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Findings & Non-Conformances */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Flag className="h-4 w-4 text-primary" />
            {t("audit.findingsTitle")}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {t("audit.findingsSubtitle")}
          </p>
        </CardHeader>
        <CardContent>
          {findings.length === 0 && draftFindings.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("audit.findingsNone")}
            </p>
          ) : (
            <div className="space-y-3">
              {(findings.length > 0 ? findings : draftFindings).map((f) => {
                const isDraft = "is_draft" in f && Boolean(f.is_draft);
                const findingMedia = media.filter(
                  (m) => m.target_id === f.id || m.target_id === String(f.id)
                );
                const imageUrls = findingMedia
                  .map(
                    (m) =>
                      m.url || (m.storage_key ? `/api/media/${m.id}` : null)
                  )
                  .filter((url): url is string => Boolean(url));

                return (
                  <div
                    key={f.id}
                    className={`flex flex-col gap-3 rounded-xl border p-4 ${
                      isDraft
                        ? "border-amber-500/30 bg-amber-50/10 dark:bg-amber-950/10"
                        : "border-border/60 bg-muted/20"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5 shrink-0">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            SEVERITY_TONE[f.severity ?? ""] ??
                            "bg-muted/40 text-muted-foreground"
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
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-red-600">
                              <ShieldAlert className="h-3 w-3" />{" "}
                              {t("audit.lifeSafety")}
                            </span>
                          )}
                          {f.item_code && (
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {f.item_code}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 font-medium">{f.title}</p>
                        {f.description && (
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {f.description}
                          </p>
                        )}
                        {f.location && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            <Shield className="mr-1 inline h-3 w-3" />
                            {f.location}
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
        </CardContent>
      </Card>

      {/* Auditor Executive Summary & Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            {t("audit.findingNotes")}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {t("audit.detailSubtitle")}
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/60 bg-muted/15 p-4 text-sm leading-relaxed text-foreground">
            <p>
              <strong className="text-primary">Ringkasan Eksekutif Auditor:</strong> Sesi audit{" "}
              <span className="font-semibold">{sess.audit_type}</span> pada hotel{" "}
              <span className="font-semibold">{sess.hotel_name}</span> ({sess.hotel_code}) untuk departemen{" "}
              <span className="font-semibold">{sess.department}</span>. Skor pencapaian:{" "}
              <span className="font-bold tabular-nums">
                {sess.total_score != null ? `${Number(sess.total_score).toFixed(1)} / 100` : "—"}
              </span>{" "}
              ({sess.pass_fail ?? "PENDING"}).
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground border-t border-border/40 pt-3">
              <span>Auditor: <strong className="text-foreground">{sess.auditor_name ?? "—"}</strong></span>
              <span>Status FSM: <strong className="text-foreground">{sess.status}</strong></span>
              <span>Total Temuan: <strong className="text-foreground">{findings.length}</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Switcher Header & Content */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode("worksheet")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                viewMode === "worksheet"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border/70 bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              <LayoutList className="h-4 w-4" />
              <span>Lembar Kerja Scoring</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border/70 bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              <TableIcon className="h-4 w-4" />
              <span>Tabel Data Lengkap</span>
            </button>
          </div>

          <span className="text-xs text-muted-foreground">
            Total {items.length} Butir Pertanyaan
          </span>
        </div>

        {viewMode === "worksheet" ? (
          <AuditScoringWorksheet
            sessionId={sess.id}
            items={items}
            sectionNames={sectionNamesMap}
            isEditable={isEditable}
            onSaveSuccess={() => {
              router.refresh();
            }}
          />
        ) : (
          <div className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-elegant backdrop-blur-xl">
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
    </div>
  );
}

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
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-0.5 flex items-center gap-1.5 truncate text-sm ${
          strong ? "font-bold tabular-nums" : "font-medium"
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
    <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </div>
  );
}