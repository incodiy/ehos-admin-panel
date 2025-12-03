"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { DataTable, StatusPill, type Column, type ToneKey } from "@/components/admin/data-table";
import { ApiError } from "@/lib/api/client";
import { Plus, ShieldAlert } from "lucide-react";
import type { components } from "@/lib/api/openapi";

type CapaTicket = components["schemas"]["CapaTicket"];
export type CapaTicketListResult = {
  success?: boolean;
  data?: CapaTicket[];
  meta?: components["schemas"]["PaginationMeta"];
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
}: {
  result: CapaTicketListResult | null;
  error: ApiError | null;
  filters: { status?: string; priority?: string; only_overdue?: boolean };
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();

  const tickets = result?.data ?? [];
  const meta = result?.meta;

  function buildHref(next: { status?: string; priority?: string; only_overdue?: boolean }) {
    const merged = { ...filters, ...next };
    const sp = new URLSearchParams();
    if (merged.status) sp.set("status", merged.status);
    if (merged.priority) sp.set("priority", merged.priority);
    if (merged.only_overdue) sp.set("only_overdue", "1");
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

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
            {date.toLocaleString()}
          </span>
        );
      },
    },
    {
      key: "status",
      label_id: t("capa.cols.status"),
      label_en: t("capa.cols.status"),
      width: 140,
      render: (_, row) => (
        <StatusPill tone={STATUS_TONE[row.status || ""] ?? "off"}>{t(`capa.status.${row.status}` as never)}</StatusPill>
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
    <div className="space-y-4">
      {/* Action Header & Filter chips */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("capa.filterStatus")}</span>
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
        <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("capa.filterPriority")}</span>
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
        <Link
          href="/dashboard/capa/create"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          <span>+ Buat Tiket CAPA</span>
        </Link>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-elegant backdrop-blur-xl">
        <DataTable<CapaTicket>
          columns={columns}
          data={tickets}
          rowKey={(row) => row.id ?? ""}
          isLoading={false}
          emptyMessage={t("capa.empty")}
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
    </div>
  );
}