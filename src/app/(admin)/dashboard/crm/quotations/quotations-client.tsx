"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FileText, Plus, ArrowRight, ShieldAlert } from "lucide-react";
import { StatusPill, type Column } from "@/components/admin/data-table";
import { ModuleList } from "@/components/admin/module-list";
import { ApiError } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi.d";

type Quotation = components["schemas"]["Quotation"];
type ToneKey = "on" | "wait" | "off";

export type QuotationListResult = {
  success?: boolean;
  data?: Quotation[];
  meta?: components["schemas"]["PaginationMeta"];
};

const STATUS_TONE: Record<string, ToneKey> = {
  DRAFT: "wait",
  SENT: "wait",
  ACCEPTED: "on",
  DECLINED: "off",
};

const fmtDate = (v?: string) => (v ? new Date(`${v}T00:00:00`).toLocaleDateString("id-ID") : "—");
const fmtIDR = (v?: number) =>
  v == null ? "—" : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

export function QuotationsClient({
  result,
  error,
  page,
}: {
  result: QuotationListResult | null;
  error: ApiError | null;
  page: number;
}) {
  const t = useTranslations();
  const rows: Quotation[] = result?.data ?? [];

  const columns: Column<Quotation>[] = [
    {
      key: "quotation_no",
      label_id: t("quotations.cols.no"),
      label_en: t("quotations.cols.no"),
      render: (_, row) => (
        <Link
          href={`/dashboard/crm/quotations/${row.id}`}
          className="font-mono text-xs font-bold text-primary transition-smooth hover:underline"
        >
          {row.quotation_no}
        </Link>
      ),
    },
    {
      key: "company_name",
      label_id: "Klien / Instansi",
      label_en: "Client Organization",
      render: (_, row) => (
        <div>
          <p className="font-semibold text-foreground">{row.company_name ?? row.event_name ?? "—"}</p>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="rounded bg-muted px-1.5 py-0.2 font-medium">
              {row.institution_type ?? "GOV"}
            </span>
            {row.hotel_code && <span>• {row.hotel_code}</span>}
          </div>
        </div>
      ),
    },
    {
      key: "event_date",
      label_id: t("quotations.cols.date"),
      label_en: t("quotations.cols.date"),
      render: (_, row) => <span className="whitespace-nowrap text-xs">{fmtDate(row.event_date)}</span>,
    },
    {
      key: "pax_count",
      label_id: t("quotations.cols.pax"),
      label_en: t("quotations.cols.pax"),
      render: (_, row) => (
        <span className="text-xs">
          {row.pax_count ?? "—"} <span className="text-muted-foreground">pax</span>
        </span>
      ),
    },
    {
      key: "gross_amount",
      label_id: t("quotations.cols.gross"),
      label_en: t("quotations.cols.gross"),
      render: (_, row) => <span className="text-xs font-mono">{fmtIDR(row.gross_amount)}</span>,
    },
    {
      key: "discount_amount",
      label_id: t("quotations.cols.discount"),
      label_en: t("quotations.cols.discount"),
      render: (_, row) => {
        const d = row.discount_amount;
        const isPending = row.discount_approval_status === "PENDING";
        return (
          <div className="text-xs">
            <span className={d ? "font-mono text-destructive" : "text-muted-foreground"}>
              {d ? `-${fmtIDR(d)}` : "—"}
            </span>
            {isPending && (
              <span className="ml-1 inline-flex items-center text-[10px] text-amber-600 dark:text-amber-400" title="Menunggu approval GM">
                <ShieldAlert className="h-3 w-3" />
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "final_amount",
      label_id: t("quotations.cols.final"),
      label_en: t("quotations.cols.final"),
      render: (_, row) => <span className="text-xs font-mono font-bold text-foreground">{fmtIDR(row.final_amount)}</span>,
    },
    {
      key: "status",
      label_id: t("quotations.cols.status"),
      label_en: t("quotations.cols.status"),
      render: (_, row) => (
        <StatusPill tone={STATUS_TONE[row.status ?? ""] ?? "off"}>
          {t(`quotations.status.${row.status}` as never)}
        </StatusPill>
      ),
    },
    {
      key: "actions",
      label_id: "Aksi",
      label_en: "Action",
      render: (_, row) => (
        <Link
          href={`/dashboard/crm/quotations/${row.id}`}
          className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-background/60 px-2.5 py-1 text-[11px] font-medium text-foreground transition-smooth hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
        >
          <span>Detail</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-muted-foreground">
          {t("quotations.total", { total: result?.meta?.total ?? rows.length })}
        </div>
        <Link
          href="/dashboard/crm/quotations/create"
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-smooth hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          <span>{t("quotations.createButton" as never) || "+ Buat Quotation Baru"}</span>
        </Link>
      </div>

      <ModuleList<Quotation>
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id ?? ""}
        error={error}
        meta={result?.meta}
        page={page}
        icon={FileText}
        emptyKey="quotations.empty"
        totalKey="quotations.total"
        errorTitleKey="quotations.errorTitle"
        errorNetworkKey="quotations.errorNetwork"
        errorServerKey="quotations.errorServer"
        retryKey="quotations.retry"
      />
    </div>
  );
}