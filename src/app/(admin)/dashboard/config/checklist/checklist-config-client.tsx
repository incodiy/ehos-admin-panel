"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Lock,
  Archive,
  GitFork,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  FileCheck2,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import {
  configTemplatesAction,
  configTemplateDetailAction,
  configNewVersionAction,
  configLockTemplateAction,
  configArchiveTemplateAction,
  type ChecklistTemplate,
  type TemplateDetail,
} from "@/app/actions/config";
import { StatusPill } from "@/components/admin/data-table";

export const DEPARTMENTS = ["GM", "HOUSEKEEPING", "KITCHEN_FB", "SECURITY_RISK"] as const;
export const TIERS = ["Luxury", "Upscale", "Boutique", "Midscale", "Budget", "Eco-Resort"] as const;
export const STATUSES = ["DRAFT", "LOCKED", "ARCHIVED"] as const;

const STATUS_TONE: Record<string, "on" | "wait" | "off"> = {
  LOCKED: "on",
  DRAFT: "wait",
  ARCHIVED: "off",
};

const RUBRIC_COLORS: Record<string, string> = {
  TRAFFIC_LIGHT: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  NUMERIC_SCALE: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  MULTI_ROOM: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  BINARY_COUNT: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

interface Props {
  templates: ChecklistTemplate[];
  error: ApiError | null;
}

export function ChecklistConfigClient({ templates, error }: Props) {
  const router = useRouter();

  const [list, setList] = useState<ChecklistTemplate[]>(templates);
  const [loadError] = useState<ApiError | null>(error);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ kind: "error" | "success"; message: string } | null>(null);

  // Filters
  const [filterDept, setFilterDept] = useState("");
  const [filterTier, setFilterTier] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Expandable details for quick preview
  const [expanded, setExpanded] = useState<Record<string, TemplateDetail | null>>({});

  // Quick Fork modal
  const [forkModalFor, setForkModalFor] = useState<ChecklistTemplate | null>(null);
  const [forkVersionInput, setForkVersionInput] = useState("");

  const showToast = (kind: "error" | "success", message: string) => {
    setToast({ kind, message });
    setTimeout(() => setToast(null), 4000);
  };

  const applyFilters = async (dept: string, tier: string, st: string) => {
    setBusy(true);
    const res = await configTemplatesAction({
      department: dept || undefined,
      brandTier: tier || undefined,
      status: st || undefined,
    });
    setBusy(false);
    if (res.ok) {
      setList((res.data as ChecklistTemplate[]) ?? []);
    } else {
      showToast("error", res.message ?? "Gagal memfilter template");
    }
  };

  const onToggleExpand = async (tpl: ChecklistTemplate) => {
    if (expanded[tpl.id] !== undefined) {
      const copy = { ...expanded };
      delete copy[tpl.id];
      setExpanded(copy);
      return;
    }
    setExpanded((prev) => ({ ...prev, [tpl.id]: null }));
    const res = await configTemplateDetailAction(tpl.id);
    if (res.ok && res.data) {
      setExpanded((prev) => ({ ...prev, [tpl.id]: res.data as TemplateDetail }));
    } else {
      showToast("error", res.message ?? "Gagal memuat detail template");
      setExpanded((prev) => {
        const copy = { ...prev };
        delete copy[tpl.id];
        return copy;
      });
    }
  };

  const onQuickLock = async (tpl: ChecklistTemplate) => {
    if (!confirm(`Kunci template ${tpl.name} (${tpl.version})? Struktur butir akan menjadi immutable.`)) return;
    setBusy(true);
    const res = await configLockTemplateAction(tpl.id);
    setBusy(false);
    if (res.ok) {
      showToast("success", "Template berhasil di-LOCK");
      applyFilters(filterDept, filterTier, filterStatus);
    } else {
      showToast("error", res.message ?? "Gagal mengunci template");
    }
  };

  const onQuickArchive = async (tpl: ChecklistTemplate) => {
    if (!confirm(`Arsipkan template ${tpl.name} (${tpl.version})?`)) return;
    setBusy(true);
    const res = await configArchiveTemplateAction(tpl.id);
    setBusy(false);
    if (res.ok) {
      showToast("success", "Template berhasil diarsipkan (ARCHIVED)");
      applyFilters(filterDept, filterTier, filterStatus);
    } else {
      showToast("error", res.message ?? "Gagal mengarsipkan template");
    }
  };

  const onConfirmFork = async () => {
    if (!forkModalFor || !forkVersionInput.trim()) return;
    setBusy(true);
    const res = await configNewVersionAction(forkModalFor.id, forkVersionInput.trim());
    setBusy(false);
    if (res.ok) {
      showToast("success", "Versi baru berhasil dibuat");
      setForkModalFor(null);
      const created = res.data as { id?: string } | undefined;
      if (created?.id) {
        router.push(`/dashboard/config/checklist/${created.id}/edit`);
      } else {
        applyFilters(filterDept, filterTier, filterStatus);
      }
    } else {
      showToast("error", res.message ?? "Gagal membuat versi baru");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={cn(
            "fixed right-6 top-6 z-50 rounded-xl px-4 py-3 text-xs font-semibold shadow-xl transition-all animate-in fade-in slide-in-from-top-2",
            toast.kind === "error"
              ? "bg-destructive text-destructive-foreground"
              : "bg-emerald-600 text-white"
          )}
        >
          {toast.message}
        </div>
      )}

      {/* Top Controls: Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Bank Checklist & Master Rubrik
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daftar template checklist per departemen dan brand tier dengan arsitektur immutable versioning (B1-B3).
          </p>
        </div>

        <Link
          href="/dashboard/config/checklist/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Template Baru
        </Link>
      </div>

      {/* Load Error Banner */}
      {loadError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
          Gagal memuat template checklist dari server. Periksa koneksi backend API.
        </div>
      )}

      {/* Filters Bar */}
      <div className="grid gap-3 sm:grid-cols-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground">Departemen</span>
          <select
            className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            value={filterDept}
            onChange={(e) => {
              setFilterDept(e.target.value);
              applyFilters(e.target.value, filterTier, filterStatus);
            }}
          >
            <option value="">Semua Departemen</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground">Brand Tier</span>
          <select
            className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            value={filterTier}
            onChange={(e) => {
              setFilterTier(e.target.value);
              applyFilters(filterDept, e.target.value, filterStatus);
            }}
          >
            <option value="">Semua Tier</option>
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground">Status Lifecycle</span>
          <select
            className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              applyFilters(filterDept, filterTier, e.target.value);
            }}
          >
            <option value="">Semua Status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setFilterDept("");
              setFilterTier("");
              setFilterStatus("");
              applyFilters("", "", "");
            }}
            className="w-full py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-colors border border-border/60"
          >
            Reset Filter
          </button>
        </div>
      </div>

      {/* Template Cards List */}
      <div className="space-y-3">
        {list.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border/60 bg-muted/20">
            <FileCheck2 className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
            <p className="text-sm font-medium text-foreground">Tidak ada template checklist</p>
            <p className="text-xs text-muted-foreground mt-1">
              Sesuaikan filter pencarian atau klik &quot;Tambah Template Baru&quot;.
            </p>
          </div>
        ) : (
          list.map((tp) => {
            const detail = expanded[tp.id];
            const isOpen = detail !== undefined;

            return (
              <div
                key={tp.id}
                className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm transition-all hover:border-border"
              >
                {/* Main Card Header */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => onToggleExpand(tp)}
                      className="mt-1 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                      title="Pratinjau Butir Pertanyaan"
                    >
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-muted border border-border/60 text-foreground">
                          {tp.department}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-foreground">
                          {tp.name}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                          {tp.version}
                        </span>
                        <StatusPill tone={STATUS_TONE[tp.status] ?? "wait"}>{tp.status}</StatusPill>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Brand Tier:{" "}
                          <strong className="text-foreground">
                            {tp.brand_tier ?? "Universal (Semua Tier)"}
                          </strong>
                        </span>
                        {tp.locked_at && (
                          <span>
                            Dikunci:{" "}
                            <strong className="text-foreground">
                              {new Date(tp.locked_at).toLocaleDateString("id-ID")}
                            </strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Link
                      href={`/dashboard/config/checklist/${tp.id}/edit`}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1.5 border border-primary/20"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Buka Builder / Edit
                    </Link>

                    {tp.status === "DRAFT" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onQuickLock(tp)}
                        className="p-2 rounded-xl text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                        title="Kunci Template (LOCK)"
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                    )}

                    {tp.status === "LOCKED" && (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            setForkModalFor(tp);
                            setForkVersionInput(
                              `${tp.version.split(".")[0]}.${Number(tp.version.split(".")[1] || 1) + 1}`
                            );
                          }}
                          className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Buka Versi Baru (Fork)"
                        >
                          <GitFork className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onQuickArchive(tp)}
                          className="p-2 rounded-xl text-muted-foreground hover:text-zinc-600 hover:bg-zinc-500/10 transition-colors"
                          title="Arsipkan Template"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Collapsible Quick Preview */}
                {isOpen && (
                  <div className="border-t border-border/40 bg-muted/20 p-4 sm:p-6 space-y-4">
                    {detail === null ? (
                      <p className="text-xs text-muted-foreground italic py-2">
                        Memuat detail butir pertanyaan...
                      </p>
                    ) : detail.sections.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic py-2">
                        Belum ada section yang dibuat pada template ini.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {detail.sections.map((sec) => (
                          <div
                            key={sec.id}
                            className="bg-card border border-border/60 rounded-xl p-4 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-muted text-foreground">
                                  {sec.code}
                                </span>
                                <h4 className="text-xs font-bold text-foreground">{sec.name}</h4>
                              </div>
                              <span className="text-[11px] text-muted-foreground">
                                {sec.items?.length ?? 0} butir
                              </span>
                            </div>

                            {(sec.items?.length ?? 0) > 0 && (
                              <div className="divide-y divide-border/30 border-t border-border/30 pt-2">
                                {(sec.items ?? []).map((it) => (
                                  <div
                                    key={it.id}
                                    className="py-2 flex items-start justify-between gap-3 text-xs"
                                  >
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-foreground">
                                          {it.code}
                                        </span>
                                        <span
                                          className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                            RUBRIC_COLORS[it.rubric_type] || "bg-muted text-foreground"
                                          }`}
                                        >
                                          {it.rubric_type}
                                        </span>
                                        {it.is_life_safety && (
                                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-600 text-white flex items-center gap-0.5">
                                            <AlertTriangle className="w-2.5 h-2.5" />
                                            Life-Safety
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-muted-foreground">{it.question_text}</p>
                                    </div>
                                    <div className="text-right text-[11px] text-muted-foreground shrink-0">
                                      <span>
                                        Max: <strong>{it.max_score}</strong>
                                      </span>{" "}
                                      |{" "}
                                      <span>
                                        Bobot: <strong>{it.weight}x</strong>
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Quick Fork Modal */}
      {forkModalFor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <GitFork className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Buka Versi Baru (Fork)</h3>
                <p className="text-xs text-muted-foreground">Kloning template LOCKED ke DRAFT baru</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Menduplikasi template <strong>{forkModalFor.name}</strong> ({forkModalFor.version}) ke versi draft baru.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Nomor Versi Baru</label>
              <input
                type="text"
                value={forkVersionInput}
                onChange={(e) => setForkVersionInput(e.target.value)}
                placeholder="Contoh: v2027.2"
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
              <button
                type="button"
                onClick={() => setForkModalFor(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onConfirmFork}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
              >
                {busy ? "Memproses..." : "Buat Versi Baru"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChecklistConfigClient;