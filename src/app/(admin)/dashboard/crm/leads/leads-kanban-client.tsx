"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLanguage } from "@/context/LanguageContext";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  crmAddActivityAction,
  crmLeadDetailAction,
  crmUpdateLeadStatusAction,
  type LeadDetail,
  type LeadKanbanRow,
} from "@/app/actions/crm";
import {
  X,
  Phone,
  Mail,
  CalendarClock,
  MapPin,
  User,
  Handshake,
  AlertTriangle,
  RefreshCw,
  PhoneCall,
  CalendarPlus,
  StickyNote,
  CheckCircle2,
  Plus,
  Edit,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type WarRoomData = {
  columns: Record<string, { rows: LeadKanbanRow[]; total: number }>;
  dueTotal: number;
};

const COLUMN_ORDER = ["LEAD", "CONTACTED", "PROSPECT", "CONFIRMED", "LOST"] as const;

/** Mirror backend app/services/crm_pipeline.py ALLOWED_TRANSITIONS — kartu hanya droppable bila legal. */
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  LEAD: ["CONTACTED", "PROSPECT", "CONFIRMED", "LOST"],
  CONTACTED: ["PROSPECT", "CONFIRMED", "LOST"],
  PROSPECT: ["CONFIRMED", "LOST"],
  CONFIRMED: ["LOST"],
  LOST: [],
};

const COLUMN_STYLE: Record<string, { dot: string; header: string; text: string }> = {
  LEAD: { dot: "bg-sky-500", header: "border-sky-500/30", text: "text-sky-600" },
  CONTACTED: { dot: "bg-amber-500", header: "border-amber-500/30", text: "text-amber-600" },
  PROSPECT: { dot: "bg-violet-500", header: "border-violet-500/30", text: "text-violet-600" },
  CONFIRMED: { dot: "bg-emerald-500", header: "border-emerald-500/30", text: "text-emerald-600" },
  LOST: { dot: "bg-rose-500", header: "border-rose-500/30", text: "text-rose-600" },
};

const SOURCE_ICON: Record<string, typeof Handshake> = {
  RFP_PORTAL: CalendarPlus,
  CROSS_SELLING: RefreshCw,
  REFERRAL: Handshake,
  MANUAL: StickyNote,
};

function useCurrency(language: string) {
  const locale = language === "id" ? "id-ID" : "en-US";
  return useCallback(
    (v?: number | null) =>
      v === null || v === undefined
        ? "—"
        : new Intl.NumberFormat(locale, {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
          }).format(v),
    [locale],
  );
}

function useDateTime(language: string) {
  const locale = language === "id" ? "id-ID" : "en-US";
  return useCallback(
    (v?: string | null) => {
      if (!v) return null;
      return new Date(v).toLocaleString(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    [locale],
  );
}

type Toast = { kind: "error"; message: string } | null;

export function LeadsKanbanClient({
  columns,
  dueTotal,
  error,
}: {
  columns: WarRoomData["columns"];
  dueTotal: number;
  error: ApiError | null;
}) {
  const t = useTranslations();
  const { language } = useLanguage();
  const fmtIDR = useCurrency(language);
  const fmtDT = useDateTime(language);
  const router = useRouter();

  const [dragId, setDragId] = useState<string | null>(null);
  const [dragStatus, setDragStatus] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [movingStatus, setMovingStatus] = useState<{ id: string; to: string } | null>(null);
  const [pendingLost, setPendingLost] = useState<LeadKanbanRow | null>(null);
  const [lostReason, setLostReason] = useState("");
  const [openLead, setOpenLead] = useState<LeadKanbanRow | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function flashError(msg: string) {
    setToast({ kind: "error", message: msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  }

  function moveLeadLocal(id: string, from: string, to: string) {
    const src = columns[from]?.rows ?? [];
    const target = columns[to]?.rows ?? [];
    const row = src.find((r) => r.id === id);
    if (!row) return;
    const updated = { ...row, status: to } as LeadKanbanRow;
    columns[from] = { ...columns[from], rows: src.filter((r) => r.id !== id) };
    columns[to] = { ...columns[to], rows: [updated, ...target] };
  }

  async function applyMove(lead: LeadKanbanRow, to: string, reason?: string) {
    if (!lead.id) return;
    const from = lead.status;
    if (!from || from === to) return;
    setMovingStatus({ id: lead.id, to });
    moveLeadLocal(lead.id, from, to);
    try {
      const res = await crmUpdateLeadStatusAction(lead.id, to, reason !== undefined ? reason : undefined);
      if (!res.ok) {
        moveLeadLocal(lead.id, to, from); // revert optimistik
        flashError(res.message ?? `http_${res.status}`);
        return;
      }
      router.refresh();
    } finally {
      setMovingStatus(null);
    }
  }

  function onDrop(status: string) {
    if (!dragId || !dragStatus) return;
    const legal = ALLOWED_TRANSITIONS[dragStatus] ?? [];
    if (!legal.includes(status)) {
      setDragId(null);
      setDragStatus(null);
      return;
    }
    const row = columns[dragStatus]?.rows.find((r) => r.id === dragId);
    if (row) {
      if (status === "LOST") {
        setPendingLost(row);
      } else {
        void applyMove(row, status);
      }
    }
    setDragId(null);
    setDragStatus(null);
  }

  const activeTotal = COLUMN_ORDER.slice(0, 3).reduce((sum, s) => sum + (columns[s]?.total ?? 0), 0);
  const confirmedTotal = columns["CONFIRMED"]?.total ?? 0;
  const lostTotal = columns["LOST"]?.total ?? 0;

  // ─── Error state (G4: jujur, tanpa fallback data) ─────────────────────
  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
        <p className="mt-3 font-semibold">{t("crm.errorTitle")}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {error.status === 0 ? t("crm.errorNetwork") : t("crm.errorServer", { status: error.status })}
        </p>
        <button
          onClick={() => router.refresh()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:opacity-90"
        >
          <RefreshCw className="h-4 w-4" /> {t("crm.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toast error aksi */}
      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {toast.message}
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Pipeline Manajemen Peluang & Negosiasi MICE Swiss-Belhotel (PRD-F-07)
        </p>
        <Link
          href="/dashboard/crm/leads/create"
          className="inline-flex items-center gap-2 self-start rounded-xl bg-brand-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow transition-smooth hover:opacity-90 sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>+ Buat Lead Baru</span>
        </Link>
      </div>

      {/* War Room KPI strip (angka total server — jujur) */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <WarRoomKpi label={t("crm.kpi.active")} value={activeTotal} tone="text-violet-600" />
        <WarRoomKpi label={t("crm.kpi.confirmed")} value={confirmedTotal} tone="text-emerald-600" />
        <WarRoomKpi label={t("crm.kpi.due")} value={dueTotal} tone="text-amber-600" alert={dueTotal > 0} />
        <WarRoomKpi label={t("crm.kpi.lost")} value={lostTotal} tone="text-rose-600" />
      </div>

      {/* Board */}
      <div className="rounded-2xl border border-border/60 bg-card/70 p-3 shadow-elegant backdrop-blur-xl">
        <p className="px-2 pb-2 text-xs font-medium text-muted-foreground">{t("crm.dndHint")}</p>
        <div className="flex snap-x gap-3 overflow-x-auto pb-2">
          {COLUMN_ORDER.map((status) => {
            const col = columns[status] ?? { rows: [], total: 0 };
            const style = COLUMN_STYLE[status];
            const droppable = dragStatus !== null && (ALLOWED_TRANSITIONS[dragStatus] ?? []).includes(status);
            return (
              <div
                key={status}
                onDragOver={(e) => {
                  if (droppable) e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (droppable) onDrop(status);
                }}
                className={cn(
                  "flex w-[19rem] shrink-0 snap-start flex-col rounded-xl border bg-background/40 transition-smooth",
                  style.header,
                  droppable && "ring-2 ring-primary/60",
                )}
              >
                <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", style.dot)} />
                  <span className={cn("text-sm font-bold", style.text)}>{t(`crm.status.${status}` as never)}</span>
                  <Badge variant="secondary" className="ml-auto font-mono">
                    {col.total}
                  </Badge>
                  {col.total > col.rows.length && (
                    <span className="text-[10px] font-medium text-muted-foreground">+{col.total - col.rows.length}</span>
                  )}
                </div>
                <div className="flex min-h-[8rem] flex-1 flex-col gap-2 p-2">
                  {col.rows.length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted-foreground">{t("crm.emptyColumn")}</p>
                  ) : (
                    col.rows.map((row) => {
                      const SourceIcon = SOURCE_ICON[row.source ?? "MANUAL"] ?? StickyNote;
                      const isMoving = movingStatus?.id === row.id;
                      return (
                        <div
                          key={row.id}
                          draggable
                          onDragStart={() => {
                            setDragId(row.id ?? "");
                            setDragStatus(row.status ?? "");
                          }}
                          onDragEnd={() => {
                            setDragId(null);
                            setDragStatus(null);
                          }}
                          onClick={() => setOpenLead(row)}
                          className={cn(
                            "cursor-grab rounded-lg border border-border/70 bg-card p-3 shadow-sm transition-smooth active:cursor-grabbing hover:border-primary/40 hover:shadow-md",
                            isMoving && "opacity-60",
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] text-muted-foreground">{row.lead_no}</span>
                            <SourceIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <p className="mt-1 truncate text-sm font-semibold">{row.company_name}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                            <Badge variant={row.institution_type === "GOV" || row.institution_type === "GOVERNMENT" ? "default" : "secondary"} className="px-1.5 py-0 text-[10px]">
                              {t.has(`crm.inst.${row.institution_type}`) ? (t(`crm.inst.${row.institution_type}` as never)) : row.institution_type}
                            </Badge>
                            <span className="rounded bg-muted px-1.5 py-0.5 font-mono font-medium text-muted-foreground">
                              {row.hotel_code}
                            </span>
                            {row.amount_est != null && (
                              <span className="font-semibold text-foreground">{fmtIDR(row.amount_est)}</span>
                            )}
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1 truncate">
                              <CalendarClock className="h-3 w-3 shrink-0" />
                              {row.next_followup_at ? fmtDT(row.next_followup_at) : t("crm.noFollowup")}
                            </span>
                            {row.followup_due && (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 font-bold text-destructive">
                                {t("crm.followupDue")}
                              </span>
                            )}
                          </div>
                          {row.owner_name && (
                            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                              <User className="h-3 w-3" /> {row.owner_name}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal lost_reason (F-07: wajib saat LOST) */}
      {pendingLost && (
        <Modal title={t("crm.lostTitle", { company: pendingLost.company_name ?? "—" })} onClose={() => setPendingLost(null)}>
          <label className="block text-sm font-medium">{t("crm.lostReasonLabel")}</label>
          <input
            value={lostReason}
            onChange={(e) => setLostReason(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            placeholder={t("crm.lostReasonPlaceholder")}
            autoFocus
          />
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setPendingLost(null);
                setLostReason("");
              }}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-smooth hover:bg-muted"
            >
              {t("crm.cancel")}
            </button>
            <button
              disabled={!lostReason.trim() || movingStatus?.id === pendingLost.id}
              onClick={() => {
                void applyMove(pendingLost, "LOST", lostReason.trim());
                setPendingLost(null);
                setLostReason("");
              }}
              className="rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:opacity-90 disabled:opacity-50"
            >
              {t("crm.confirmMove")}
            </button>
          </div>
        </Modal>
      )}

      {/* Drawer detail lead */}
      {openLead && <LeadDetailDrawer lead={openLead} onClose={() => setOpenLead(null)} fmtIDR={fmtIDR} fmtDT={fmtDT} />}
    </div>
  );
}

function WarRoomKpi({
  label,
  value,
  tone,
  alert,
}: {
  label: string;
  value: number;
  tone: string;
  alert?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-elegant backdrop-blur-xl">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-black tabular-nums", tone, alert && "animate-pulse")}>{value}</p>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const t = useTranslations();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label={t("common.close")} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function LeadDetailDrawer({
  lead,
  onClose,
  fmtIDR,
  fmtDT,
}: {
  lead: LeadKanbanRow;
  onClose: () => void;
  fmtIDR: (v?: number | null) => string;
  fmtDT: (v?: string | null) => string | null;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [detail, setDetail] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [actType, setActType] = useState<"CALL" | "EMAIL" | "MEETING" | "NOTE">("CALL");
  const [actNote, setActNote] = useState("");
  const [actNext, setActNext] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!lead.id) return;
    setLoading(true);
    const res = await crmLeadDetailAction(lead.id);
    if (res.ok) setDetail(res.data as LeadDetail);
    else setErrorMsg(res.message ?? `http_${res.status}`);
    setLoading(false);
  }, [lead.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitActivity() {
    if (!lead.id || !actNote.trim()) return;
    setSubmitting(true);
    const res = await crmAddActivityAction(lead.id, actType, actNote.trim(), actNext || null);
    if (!res.ok) {
      setErrorMsg(res.message ?? `http_${res.status}`);
      setSubmitting(false);
      return;
    }
    setActNote("");
    setActNext("");
    setSubmitting(false);
    await load();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button aria-label={t("common.close")} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-lg flex-col border-l border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <p className="font-mono text-xs text-muted-foreground">{lead.lead_no}</p>
            <h3 className="text-lg font-bold">{lead.company_name}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex items-center gap-2 border-b border-border/60 bg-muted/20 px-5 py-2.5">
          <Link
            href={`/dashboard/crm/leads/${lead.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-smooth hover:border-primary/50 hover:bg-muted"
          >
            <Edit className="h-3.5 w-3.5 text-primary" />
            <span>Ubah Metadata</span>
          </Link>
          <Link
            href={`/dashboard/crm/quotations/create?lead_id=${lead.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-smooth hover:opacity-90"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>+ Buat Quotation</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading && <p className="py-8 text-center text-sm text-muted-foreground">{t("crm.drawer.loading")}</p>}
          {!loading && errorMsg && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
              {errorMsg}
            </p>
          )}
          {!loading && !errorMsg && detail && (
            <div className="space-y-5">
              {/* Info kontak */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoItem icon={<MapPin className="h-4 w-4" />} label={t("crm.drawer.hotel")} value={detail.hotel_code} />
                <InfoItem icon={<User className="h-4 w-4" />} label={t("crm.drawer.owner")} value={detail.owner_name} />
                <InfoItem
                  icon={<Phone className="h-4 w-4" />}
                  label={t("crm.drawer.picPhone")}
                  value={detail.pic_phone ?? "—"}
                />
                <InfoItem
                  icon={<Mail className="h-4 w-4" />}
                  label={t("crm.drawer.picEmail")}
                  value={detail.pic_email ?? "—"}
                />
                <InfoItem
                  icon={<CalendarClock className="h-4 w-4" />}
                  label={t("crm.drawer.nextFollowup")}
                  value={detail.next_followup_human ?? "—"}
                />
                <InfoItem icon={<Handshake className="h-4 w-4" />} label={t("crm.drawer.amount")} value={fmtIDR(detail.amount_est)} />
              </div>

              {/* Quotation */}
              <section>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("crm.drawer.quotations")}</h4>
                {detail.quotations && detail.quotations.length > 0 ? (
                  <div className="space-y-2">
                    {detail.quotations.map((q, i) => (
                      <div key={i} className="rounded-lg border border-border/60 bg-background/50 p-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-semibold">{q.quotation_no}</span>
                          <Badge variant="secondary">{q.status}</Badge>
                        </div>
                        <p className="mt-1">{q.event_name || "—"}</p>
                        <p className="mt-0.5 text-muted-foreground">
                          {t("crm.drawer.pax")}: {q.pax_count} · {fmtIDR(q.final_amount ?? q.gross_amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("crm.drawer.emptyQuotations")}</p>
                )}
              </section>

              {/* Timeline aktivitas */}
              <section>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("crm.drawer.activities")}</h4>
                {detail.activities && detail.activities.length > 0 ? (
                  <ol className="space-y-3 border-l border-border/60 pl-4">
                    {detail.activities.map((a, i) => {
                      const Icon =
                        a.type === "CALL" ? PhoneCall : a.type === "EMAIL" ? Mail : a.type === "MEETING" ? CalendarClock : StickyNote;
                      return (
                        <li key={i} className="relative text-xs">
                          <span className="absolute -left-[1.35rem] top-0.5 rounded-full border border-border bg-card p-1">
                            <Icon className="h-3 w-3 text-muted-foreground" />
                          </span>
                          <p>
                            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                              {t(`crm.act.${a.type}` as never)}
                            </Badge>{" "}
                            <span className="text-muted-foreground">{fmtDT(a.at)}</span>
                          </p>
                          {a.note && <p className="mt-0.5 text-foreground">{a.note}</p>}
                          {a.next_followup_at && (
                            <p className="mt-0.5 flex items-center gap-1 text-muted-foreground">
                              <CalendarPlus className="h-3 w-3" /> {t("crm.drawer.nextFromActivity")}: {fmtDT(a.next_followup_at)}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("crm.drawer.emptyActivities")}</p>
                )}
              </section>

              {/* Tambah aktivitas */}
              <section className="rounded-xl border border-border/60 bg-background/50 p-3">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("crm.drawer.addActivity")}</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(["CALL", "EMAIL", "MEETING", "NOTE"] as const).map((tp) => (
                    <button
                      key={tp}
                      onClick={() => setActType(tp)}
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-smooth",
                        actType === tp
                          ? "border-primary/60 bg-primary/15 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t(`crm.act.${tp}` as never)}
                    </button>
                  ))}
                </div>
                <textarea
                  value={actNote}
                  onChange={(e) => setActNote(e.target.value)}
                  rows={2}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                  placeholder={t("crm.drawer.notePlaceholder")}
                />
                <input
                  value={actNext}
                  onChange={(e) => setActNext(e.target.value)}
                  type="datetime-local"
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
                {detail.status === "LOST" && (
                  <p className="mt-2 flex items-center gap-1 text-xs font-medium text-rose-600">
                    <AlertTriangle className="h-3.5 w-3.5" /> {t("crm.drawer.lostNoActivity")}
                  </p>
                )}
                <button
                  disabled={!actNote.trim() || submitting || detail.status === "LOST"}
                  onClick={submitActivity}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:opacity-90 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" /> {t("crm.drawer.submit")}
                </button>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/50 p-2.5">
      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium">{value ?? "—"}</p>
    </div>
  );
}