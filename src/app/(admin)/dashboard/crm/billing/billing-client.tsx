"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CreditCard, Plus, ArrowRight, FileCheck, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { StatusPill, type Column } from "@/components/admin/data-table";
import { ModuleList } from "@/components/admin/module-list";
import { ApiError } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi.d";

type BillingMilestone = components["schemas"]["BillingMilestone"];
type ToneKey = "on" | "wait" | "off";

export type BillingListResult = {
  success?: boolean;
  data?: BillingMilestone[];
  meta?: components["schemas"]["PaginationMeta"];
};

const STATUS_TONE: Record<string, ToneKey> = {
  EXPECTED: "wait",
  UPLOADED: "wait",
  PAID: "on",
  OVERDUE: "off",
};

const shortUuid = (v?: string) => (v ? `${v.slice(0, 8)}…` : "—");
const fmtDate = (v?: string | null) =>
  v ? new Date(v.includes("T") ? v : `${v}T00:00:00`).toLocaleDateString("id-ID") : "—";
const fmtIDR = (v?: number | null) =>
  v == null ? "—" : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

export function BillingClient({
  result,
  error,
  page,
}: {
  result: BillingListResult | null;
  error: ApiError | null;
  page: number;
}) {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<string>("ALL");

  const rawRows: BillingMilestone[] = result?.data ?? [];
  const rows =
    activeTab === "ALL"
      ? rawRows
      : rawRows.filter((r) => r.status === activeTab);

  const counts = {
    ALL: rawRows.length,
    EXPECTED: rawRows.filter((r) => r.status === "EXPECTED").length,
    UPLOADED: rawRows.filter((r) => r.status === "UPLOADED").length,
    PAID: rawRows.filter((r) => r.status === "PAID").length,
    OVERDUE: rawRows.filter((r) => r.status === "OVERDUE").length,
  };

  const columns: Column<BillingMilestone>[] = [
    {
      key: "quotation_id",
      label_id: t("billing.cols.quotation"),
      label_en: t("billing.cols.quotation"),
      render: (_, row) => (
        <div>
          <Link
            href={`/dashboard/crm/quotations/${row.quotation_id}`}
            className="font-mono text-xs font-bold text-primary transition-smooth hover:underline"
          >
            {row.quotation_no ?? shortUuid(row.quotation_id)}
          </Link>
          <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">
            {row.event_name ?? "Kegiatan MICE"}
          </p>
        </div>
      ),
    },
    {
      key: "hotel_code",
      label_id: "Unit Hotel",
      label_en: "Hotel Unit",
      render: (_, row) => (
        <div>
          <span className="font-semibold text-xs text-foreground">
            {row.hotel_code ?? "—"}
          </span>
          <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">
            {row.hotel_name ?? ""}
          </p>
        </div>
      ),
    },
    {
      key: "milestone_type",
      label_id: t("billing.cols.type"),
      label_en: t("billing.cols.type"),
      render: (_, row) => (
        <div>
          <span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wide">
            {row.milestone_type}
          </span>
          {row.doc_no && (
            <p className="text-[10px] text-muted-foreground mt-0.5 font-mono truncate max-w-[160px]">
              {row.doc_no}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label_id: t("billing.cols.status"),
      label_en: t("billing.cols.status"),
      render: (_, row) => (
        <StatusPill tone={STATUS_TONE[row.status ?? ""] ?? "off"}>
          {t(`billing.status.${row.status}` as never)}
        </StatusPill>
      ),
    },
    {
      key: "amount",
      label_id: t("billing.cols.amount"),
      label_en: t("billing.cols.amount"),
      render: (_, row) => <span className="text-xs font-mono font-medium">{fmtIDR(row.amount)}</span>,
    },
    {
      key: "due_date",
      label_id: t("billing.cols.due"),
      label_en: t("billing.cols.due"),
      render: (_, row) => (
        <span className={`whitespace-nowrap text-xs ${row.status === "OVERDUE" ? "text-destructive font-bold" : ""}`}>
          {fmtDate(row.due_date)}
        </span>
      ),
    },
    {
      key: "paid_at",
      label_id: t("billing.cols.paid"),
      label_en: t("billing.cols.paid"),
      render: (_, row) => <span className="whitespace-nowrap text-xs text-muted-foreground">{fmtDate(row.paid_at)}</span>,
    },
    {
      key: "actions",
      label_id: "Aksi",
      label_en: "Action",
      render: (_, row) => (
        <Link
          href={`/dashboard/crm/billing/${row.id}`}
          className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-background/60 px-2.5 py-1 text-[11px] font-medium text-foreground transition-smooth hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
        >
          <span>Kelola</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Quick Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border/60 bg-card/60 p-1 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-smooth ${
              activeTab === "ALL"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Semua ({counts.ALL})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("EXPECTED")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-smooth ${
              activeTab === "EXPECTED"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="h-3 w-3" />
            <span>Diharapkan ({counts.EXPECTED})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("UPLOADED")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-smooth ${
              activeTab === "UPLOADED"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileCheck className="h-3 w-3" />
            <span>Terunggah ({counts.UPLOADED})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("PAID")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-smooth ${
              activeTab === "PAID"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="h-3 w-3" />
            <span>Lunas ({counts.PAID})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("OVERDUE")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-smooth ${
              activeTab === "OVERDUE"
                ? "bg-destructive text-destructive-foreground shadow-sm"
                : "text-destructive hover:bg-destructive/10"
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            <span>Jatuh Tempo ({counts.OVERDUE})</span>
          </button>
        </div>

        {/* Create Milestone Button */}
        <Link
          href="/dashboard/crm/billing/create"
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-smooth hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          <span>{t("billing.createButton" as never) || "+ Buat Milestone Baru"}</span>
        </Link>
      </div>

      {/* Module List Data Table */}
      <ModuleList<BillingMilestone>
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id ?? ""}
        error={error}
        meta={result?.meta}
        page={page}
        icon={CreditCard}
        emptyKey="billing.empty"
        totalKey="billing.total"
        errorTitleKey="billing.errorTitle"
        errorNetworkKey="billing.errorNetwork"
        errorServerKey="billing.errorServer"
        retryKey="billing.retry"
      />
    </div>
  );
}