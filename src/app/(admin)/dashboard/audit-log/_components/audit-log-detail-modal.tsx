"use client";

import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Copy,
  Check,
  Building2,
  User,
  Shield,
  Layers,
  FileText,
  AlertCircle,
  Clock,
  Globe,
  Laptop,
  ArrowRight,
  Plus,
  Minus,
  FileCode2,
} from "lucide-react";
import type { components } from "@/lib/api/openapi.d";
import { AuditLogActionBadge } from "./audit-log-action-badge";

type AuditLog = components["schemas"]["AuditLog"];

interface AuditLogDetailModalProps {
  log: AuditLog | null;
  onClose: () => void;
}

const fmtDateTime = (v?: string | null) =>
  v ? new Date(v).toLocaleString("id-ID", { dateStyle: "full", timeStyle: "medium" }) : "—";

const formatValue = (val: unknown): string => {
  if (val === null || val === undefined) return "null";
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "object") return JSON.stringify(val, null, 2);
  return String(val);
};

export function AuditLogDetailModal({ log, onClose }: AuditLogDetailModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!log) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [log, onClose]);

  const handleCopyId = () => {
    if (!log) return;
    navigator.clipboard.writeText(log.entity_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyJson = () => {
    if (!log) return;
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Diff computation between before and after payloads
  const diffEntries = useMemo(() => {
    if (!log) return [];
    const before = (log.before || {}) as Record<string, unknown>;
    const after = (log.after || {}) as Record<string, unknown>;

    const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
    return allKeys.map((key) => {
      const hasBefore = key in before;
      const hasAfter = key in after;
      const beforeVal = before[key];
      const afterVal = after[key];

      let type: "ADDED" | "REMOVED" | "MODIFIED" | "UNCHANGED" = "UNCHANGED";
      if (!hasBefore && hasAfter) type = "ADDED";
      else if (hasBefore && !hasAfter) type = "REMOVED";
      else if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) type = "MODIFIED";

      return {
        key,
        type,
        beforeVal,
        afterVal,
      };
    });
  }, [log]);

  // Extract human readable name from before or after if available
  const friendlyEntityName = useMemo(() => {
    if (!log) return null;
    const payload = ((log.after || log.before || {}) as Record<string, unknown>);
    return (
      (payload.name as string) ||
      (payload.hotel_name as string) ||
      (payload.email as string) ||
      (payload.ticket_no as string) ||
      (payload.lead_no as string) ||
      (payload.quotation_no as string) ||
      (payload.code as string) ||
      null
    );
  }, [log]);

  if (!log || !mounted) return null;

  const hasPayload = Boolean(log.before || log.after);
  const isCreateOnly = !log.before && Boolean(log.after);

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-2xl bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <AuditLogActionBadge action={log.action} />
                <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide bg-muted border border-border text-muted-foreground">
                  {log.entity_type}
                </span>
              </div>
              <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
                Detail Jejak Audit & Perubahan Data
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0 ml-2"
            title="Tutup (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Actor & Time */}
            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium">Pelaku Aksi:</span>
              </div>
              <p className="font-mono font-medium text-foreground truncate pl-5">
                {log.actor_email ?? "System (Otomatis)"}
              </p>
              <div className="flex items-center gap-2 text-muted-foreground pt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{fmtDateTime(log.at)}</span>
              </div>
            </div>

            {/* Network & Device */}
            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium">Jaringan & Klien:</span>
              </div>
              <p className="font-mono text-foreground pl-5">
                IP: <span className="font-semibold">{log.ip ?? "—"}</span>
              </p>
              <div className="flex items-center gap-2 text-muted-foreground/80 pl-5 text-[11px] truncate">
                <Laptop className="w-3 h-3 shrink-0" />
                <span className="truncate">Web / API Client</span>
              </div>
            </div>
          </div>

          {/* Target Entity Box */}
          <div className="p-4 rounded-xl bg-card border border-border/70 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">Entitas yang Terpengaruh:</span>
              <button
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer"
              >
                {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId ? "Tersalin!" : "Salin UUID"}</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    {friendlyEntityName ? friendlyEntityName : log.entity_type.toUpperCase()}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted font-mono text-muted-foreground">
                    {log.entity_type}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-muted-foreground truncate">{log.entity_id}</p>
              </div>
            </div>
          </div>

          {/* Visual Diff Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-primary" />
                <span>Perubahan State & Payload (Diff)</span>
              </h4>
              <button
                type="button"
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
              >
                {copiedJson ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedJson ? "JSON Tersalin!" : "Salin Raw JSON"}</span>
              </button>
            </div>

            {!hasPayload ? (
              <div className="py-8 px-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground space-y-1">
                <AlertCircle className="w-5 h-5 mx-auto text-muted-foreground/60 mb-2" />
                <p className="font-medium">Tidak ada payload perubahan data pada aksi ini.</p>
                <p className="text-[11px] opacity-70">
                  Aksi seperti login/autentikasi hanya mencatat stempel waktu dan jaringan.
                </p>
              </div>
            ) : isCreateOnly ? (
              /* Created Payload View */
              <div className="space-y-2">
                <div className="px-3 py-1.5 rounded-t-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Data Baru yang Dibuat (Initial State):</span>
                </div>
                <div className="border border-border/60 rounded-b-lg overflow-hidden divide-y divide-border/40">
                  {Object.entries((log.after || {}) as Record<string, unknown>).map(([k, v]) => (
                    <div key={k} className="flex flex-col sm:flex-row sm:items-center py-2 px-3 text-xs gap-2">
                      <span className="font-mono font-medium text-foreground w-44 shrink-0">{k}:</span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-400 break-all bg-emerald-500/5 px-2 py-0.5 rounded">
                        {formatValue(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Modified / Diff Table View */
              <div className="border border-border/70 rounded-xl overflow-hidden divide-y divide-border/50">
                {diffEntries.map((item) => {
                  const isMod = item.type === "MODIFIED";
                  const isAdd = item.type === "ADDED";
                  const isDel = item.type === "REMOVED";

                  return (
                    <div
                      key={item.key}
                      className={`p-3 text-xs space-y-1.5 transition-colors ${
                        isMod
                          ? "bg-amber-500/5 dark:bg-amber-950/15"
                          : isAdd
                          ? "bg-emerald-500/5 dark:bg-emerald-950/15"
                          : isDel
                          ? "bg-rose-500/5 dark:bg-rose-950/15"
                          : "bg-muted/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-foreground flex items-center gap-1.5">
                          {isMod && <span className="text-amber-500 font-bold">~</span>}
                          {isAdd && <span className="text-emerald-500 font-bold">+</span>}
                          {isDel && <span className="text-rose-500 font-bold">-</span>}
                          {item.key}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            isMod
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                              : isAdd
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : isDel
                              ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {item.type}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {/* Before */}
                        <div className="p-2 rounded-lg bg-background/80 border border-border/40 space-y-0.5">
                          <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400 block">
                            Sebelum:
                          </span>
                          <span className="font-mono text-xs text-muted-foreground break-all">
                            {item.beforeVal !== undefined ? formatValue(item.beforeVal) : "—"}
                          </span>
                        </div>

                        {/* After */}
                        <div className="p-2 rounded-lg bg-background/80 border border-border/40 space-y-0.5">
                          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 block">
                            Sesudah:
                          </span>
                          <span className="font-mono text-xs font-semibold text-foreground break-all">
                            {item.afterVal !== undefined ? formatValue(item.afterVal) : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-border/60 bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono text-[11px] truncate max-w-[280px]">Log UUID: {log.uuid}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modal, document.body) : null;
}
