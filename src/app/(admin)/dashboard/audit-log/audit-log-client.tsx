"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Database, Eye, User, Globe, Layers, ArrowRight } from "lucide-react";
import { type Column } from "@/components/admin/data-table";
import { ModuleList } from "@/components/admin/module-list";
import { ApiError } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi.d";
import { AuditLogActionBadge } from "./_components/audit-log-action-badge";
import { AuditLogFilterBar } from "./_components/audit-log-filter-bar";
import { AuditLogDetailModal } from "./_components/audit-log-detail-modal";

type AuditLog = components["schemas"]["AuditLog"];

export type AuditLogListResult = {
  success?: boolean;
  data?: AuditLog[];
  meta?: components["schemas"]["PaginationMeta"];
};

const fmtDateTime = (v?: string | null) =>
  v ? new Date(v).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "—";
const shortUuid = (v?: string) => (v ? `${v.slice(0, 8)}…` : "—");

// Extract a human readable name from before or after payloads
const extractFriendlyName = (row: AuditLog): string | null => {
  const payload = ((row.after || row.before || {}) as Record<string, unknown>);
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
};

interface AuditLogClientProps {
  result: AuditLogListResult | null;
  error: ApiError | null;
  page: number;
  currentSearch?: string;
  currentEntityType?: string;
  currentAction?: string;
}

export function AuditLogClient({
  result,
  error,
  page,
  currentSearch = "",
  currentEntityType = "",
  currentAction = "",
}: AuditLogClientProps) {
  const t = useTranslations();
  const rows: AuditLog[] = result?.data ?? [];

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const columns: Column<AuditLog>[] = [
    {
      key: "at",
      label_id: "Waktu",
      label_en: "Timestamp",
      render: (_, row) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground font-medium">
          {fmtDateTime(row.at)}
        </span>
      ),
    },
    {
      key: "actor_email",
      label_id: "Pelaku Aksi",
      label_en: "Actor",
      render: (_, row) => (
        <div className="flex items-center gap-1.5 min-w-0 max-w-[200px]">
          <div className="w-5 h-5 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0">
            <User className="w-3 h-3" />
          </div>
          <span className="font-mono text-xs text-foreground truncate" title={row.actor_email ?? "System"}>
            {row.actor_email ?? "System"}
          </span>
        </div>
      ),
    },
    {
      key: "action",
      label_id: "Aksi Domain",
      label_en: "Action",
      render: (_, row) => <AuditLogActionBadge action={row.action} />,
    },
    {
      key: "entity",
      label_id: "Tipe & Target Entitas",
      label_en: "Entity Target",
      render: (_, row) => {
        const friendlyName = extractFriendlyName(row);
        return (
          <div className="flex flex-col gap-0.5 min-w-0 max-w-[240px]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wide bg-muted border border-border text-muted-foreground">
                {row.entity_type}
              </span>
              {friendlyName && (
                <span className="text-xs font-semibold text-foreground truncate max-w-[160px]" title={friendlyName}>
                  {friendlyName}
                </span>
              )}
            </div>
            <span className="font-mono text-[11px] text-muted-foreground/80 truncate">
              {shortUuid(row.entity_id)}
            </span>
          </div>
        );
      },
    },
    {
      key: "ip",
      label_id: "Alamat IP",
      label_en: "IP Address",
      render: (_, row) => (
        <span className="font-mono text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded border border-border/50">
          {row.ip ?? "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label_id: "Detail Perubahan",
      label_en: "Changes",
      render: (_, row) => (
        <button
          type="button"
          onClick={() => setSelectedLog(row)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-card hover:bg-muted text-xs font-medium text-foreground transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
          title="Lihat rincian log & diff perubahan data"
        >
          <Eye className="w-3.5 h-3.5 text-primary" />
          <span>Lihat Diff</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <AuditLogFilterBar
        currentSearch={currentSearch}
        currentEntityType={currentEntityType}
        currentAction={currentAction}
      />

      {/* Main Data Table */}
      <ModuleList<AuditLog>
        columns={columns}
        rows={rows}
        rowKey={(row) => row.uuid}
        error={error}
        meta={result?.meta}
        page={page}
        icon={Database}
        emptyKey="auditLog.empty"
        totalKey="auditLog.total"
        errorTitleKey="auditLog.errorTitle"
        errorNetworkKey="auditLog.errorNetwork"
        errorServerKey="auditLog.errorServer"
        retryKey="auditLog.retry"
      />

      {/* Visual Diff & Changes Modal */}
      <AuditLogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}