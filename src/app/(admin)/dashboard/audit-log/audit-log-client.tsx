"use client";

import { useTranslations } from "next-intl";
import { Database } from "lucide-react";
import { type Column } from "@/components/admin/data-table";
import { ModuleList } from "@/components/admin/module-list";
import { ApiError } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi.d";

type AuditLog = components["schemas"]["AuditLog"];

export type AuditLogListResult = {
  success?: boolean;
  data?: AuditLog[];
  meta?: components["schemas"]["PaginationMeta"];
};

const fmtDateTime = (v?: string | null) =>
  v ? new Date(v).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "medium" }) : "—";
const shortUuid = (v?: string) => (v ? `${v.slice(0, 8)}…` : "—");

export function AuditLogClient({
  result,
  error,
  page,
}: {
  result: AuditLogListResult | null;
  error: ApiError | null;
  page: number;
}) {
  const t = useTranslations();
  const rows: AuditLog[] = result?.data ?? [];

  const columns: Column<AuditLog>[] = [
    {
      key: "at",
      label_id: t("auditLog.cols.at"),
      label_en: t("auditLog.cols.at"),
      render: (_, row) => <span className="whitespace-nowrap text-xs">{fmtDateTime(row.at)}</span>,
    },
    {
      key: "actor_email",
      label_id: t("auditLog.cols.actor"),
      label_en: t("auditLog.cols.actor"),
      render: (_, row) => <span className="font-mono text-xs">{row.actor_email ?? "system"}</span>,
    },
    {
      key: "action",
      label_id: t("auditLog.cols.action"),
      label_en: t("auditLog.cols.action"),
      render: (_, row) => (
        <span className="font-mono text-xs font-semibold text-primary">{row.action}</span>
      ),
    },
    {
      key: "entity_type",
      label_id: t("auditLog.cols.type"),
      label_en: t("auditLog.cols.type"),
      render: (_, row) => (
        <span className="rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] uppercase tracking-wide">
          {row.entity_type}
        </span>
      ),
    },
    {
      key: "entity_id",
      label_id: t("auditLog.cols.entity"),
      label_en: t("auditLog.cols.entity"),
      render: (_, row) => <span className="font-mono text-xs">{shortUuid(row.entity_id)}</span>,
    },
    {
      key: "ip",
      label_id: t("auditLog.cols.ip"),
      label_en: t("auditLog.cols.ip"),
      render: (_, row) => <span className="font-mono text-xs">{row.ip ?? "—"}</span>,
    },
  ];

  return (
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
  );
}