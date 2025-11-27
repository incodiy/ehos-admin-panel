"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { StatusPill, type Column, type ToneKey } from "@/components/admin/data-table";
import { ModuleList } from "@/components/admin/module-list";
import { ApiError } from "@/lib/api/client";
import { ClipboardCheck, Plus } from "lucide-react";
import type { AuditSessionRow, AuditSessionListResult } from "@/app/actions/audit";

const STATUS_OPTIONS = ["DRAFT", "IN_PROGRESS", "SUBMITTED", "PUBLISHED"] as const;
const DEPT_OPTIONS = ["GM", "HOUSEKEEPING", "KITCHEN_FB", "SECURITY_RISK"] as const;

const STATUS_TONE: Record<string, ToneKey> = {
  DRAFT: "off",
  IN_PROGRESS: "wait",
  SUBMITTED: "wait",
  PUBLISHED: "on",
};

interface HotelOption {
  id: string;
  code: string;
  name: string;
}

export function AuditSessionsClient({
  result,
  error,
  filters,
  canCreate = false,
}: {
  result: AuditSessionListResult | null;
  error: ApiError | null;
  filters: { department?: string; status?: string; page?: number };
  hotels?: HotelOption[];
  canCreate?: boolean;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();

  const sessions = result?.data ?? [];
  const meta = result?.meta;

  function buildHref(next: { department?: string; status?: string; page?: number }) {
    const merged = { ...filters, ...next };
    const sp = new URLSearchParams();
    if (merged.department) sp.set("department", merged.department);
    if (merged.status) sp.set("status", merged.status);
    if (merged.page && merged.page > 1) sp.set("page", String(merged.page));
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const columns: Column<AuditSessionRow>[] = [
    {
      key: "hotel",
      label_id: t("audit.cols.hotel"),
      label_en: t("audit.cols.hotel"),
      minWidth: 220,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{row.hotel_code}</span>
          <span className="font-medium">{row.hotel_name}</span>
        </div>
      ),
    },
    {
      key: "department",
      label_id: t("audit.cols.department"),
      label_en: t("audit.cols.department"),
      width: 160,
      render: (_, row) => <span>{t(`cfg.dept.${row.department}` as never)}</span>,
    },
    {
      key: "period",
      label_id: t("audit.cols.period"),
      label_en: t("audit.cols.period"),
      width: 200,
      render: (_, row) => {
        if (!row.date_start) return "—";
        const d = (s: string) => new Date(s + "T00:00:00").toLocaleDateString();
        return (
          <span className="text-sm text-muted-foreground">
            {d(row.date_start)}
            {row.date_end ? ` – ${d(row.date_end)}` : ""}
          </span>
        );
      },
    },
    {
      key: "status",
      label_id: t("audit.cols.status"),
      label_en: t("audit.cols.status"),
      width: 130,
      render: (_, row) => (
        <StatusPill tone={STATUS_TONE[row.status ?? ""] ?? "off"}>
          {t(`audit.status.${row.status}` as never)}
        </StatusPill>
      ),
    },
    {
      key: "total_score",
      label_id: t("audit.cols.score"),
      label_en: t("audit.cols.score"),
      width: 150,
      render: (_, row) => {
        if (row.status !== "PUBLISHED" || row.total_score === null) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <span className="font-semibold tabular-nums">{Number(row.total_score).toFixed(1)}</span>
            <VerdictBadge verdict={row.pass_fail} />
          </div>
        );
      },
    },
    {
      key: "published_at",
      label_id: t("audit.cols.published"),
      label_en: t("audit.cols.published"),
      width: 150,
      render: (_, row) =>
        row.published_at ? (
          <span className="text-sm text-muted-foreground">
            {new Date(row.published_at).toLocaleString()}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "auditor_name",
      label_id: t("audit.cols.auditor"),
      label_en: t("audit.cols.auditor"),
      width: 170,
      render: (_, row) => <span>{row.auditor_name}</span>,
    },
  ];

  const headerFilters = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("audit.filterDepartment")}
        </span>
        <Link
          href={buildHref({ department: undefined, page: 1 })}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-smooth ${
            !filters.department
              ? "border-primary/60 bg-primary/15 text-primary"
              : "border-border bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
          }`}
        >
          {t("audit.all")}
        </Link>
        {DEPT_OPTIONS.map((d) => {
          const active = filters.department === d;
          return (
            <Link
              key={d}
              href={buildHref({ department: active ? undefined : d, page: 1 })}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-smooth ${
                active
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-border bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {t(`cfg.dept.${d}` as never)}
            </Link>
          );
        })}
        <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("audit.filterStatus")}
        </span>
        {STATUS_OPTIONS.map((s) => {
          const active = filters.status === s;
          return (
            <Link
              key={s}
              href={buildHref({ status: active ? undefined : s, page: 1 })}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-smooth ${
                active
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-border bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {t(`audit.status.${s}` as never)}
            </Link>
          );
        })}
      </div>

      {canCreate && (
        <Link
          href="/dashboard/audits/create"
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow transition-smooth hover:opacity-90 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          {t("audit.createSession")}
        </Link>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <ModuleList<AuditSessionRow>
        columns={columns}
        rows={sessions}
        rowKey={(row) => row.id ?? ""}
        error={error}
        meta={meta}
        page={filters.page ?? 1}
        icon={ClipboardCheck}
        onRowClick={(row) => {
          if (row.id) router.push(`/dashboard/audits/${row.id}`);
        }}
        pageHref={(p) => buildHref({ page: p })}
        headerSlot={headerFilters}
        errorTitleKey="audit.errorTitle"
        errorNetworkKey="audit.errorNetwork"
        errorServerKey="audit.errorServer"
        retryKey="audit.retry"
        emptyKey="audit.empty"
        totalKey="audit.total"
      />
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict?: string | null }) {
  const t = useTranslations();
  if (!verdict) return null;
  return verdict === "PASS" ? (
    <Badge variant="success">{t("audit.verdictPass")}</Badge>
  ) : (
    <Badge variant="destructive">{t("audit.verdictFail")}</Badge>
  );
}