"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Hotel, Plus, Edit2, BarChart3 } from "lucide-react";
import { StatusPill, type Column } from "@/components/admin/data-table";
import { ModuleList } from "@/components/admin/module-list";
import { ApiError } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi.d";

type Hotel = components["schemas"]["Hotel"];
type ToneKey = "on" | "wait" | "off";

export type HotelListResult = {
  success?: boolean;
  data?: Hotel[];
  meta?: components["schemas"]["PaginationMeta"];
};

const STATUS_TONE: Record<string, ToneKey> = {
  ACTIVE: "on",
  TEMPORARILY_CLOSED: "wait",
  TERMINATED: "off",
};

const STATUS_TABS = [
  { id: "ALL", labelId: "Semua Status", labelEn: "All Status" },
  { id: "ACTIVE", labelId: "Aktif", labelEn: "Active" },
  { id: "TEMPORARILY_CLOSED", labelId: "Tutup Sementara", labelEn: "Temporarily Closed" },
  { id: "TERMINATED", labelId: "Terminasi", labelEn: "Terminated" },
];

export function HotelsClient({
  result,
  error,
  page,
  currentStatusFilter = "ALL",
}: {
  result: HotelListResult | null;
  error: ApiError | null;
  page: number;
  currentStatusFilter?: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const rows: Hotel[] = result?.data ?? [];

  function handleFilterStatus(status: string) {
    const params = new URLSearchParams();
    if (status !== "ALL") {
      params.set("status", status);
    }
    const q = params.toString() ? `?${params.toString()}` : "";
    router.push(`/dashboard/hotels${q}`);
  }

  const columns: Column<Hotel>[] = [
    {
      key: "code",
      label_id: t("hotels.cols.code"),
      label_en: t("hotels.cols.code"),
      render: (_, row) => (
        <span className="font-mono text-xs font-bold text-primary">{row.code}</span>
      ),
    },
    {
      key: "name",
      label_id: t("hotels.cols.name"),
      label_en: t("hotels.cols.name"),
      render: (_, row) => (
        <div>
          <span className="block font-medium text-foreground">{row.name}</span>
          {row.brand_tier && (
            <span className="mt-0.5 inline-block rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              {row.brand_tier}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "brand",
      label_id: t("hotels.cols.brand"),
      label_en: t("hotels.cols.brand"),
      render: (_, row) => <span>{row.brand ?? "—"}</span>,
    },
    {
      key: "region",
      label_id: t("hotels.cols.region"),
      label_en: t("hotels.cols.region"),
      render: (_, row) => <span>{row.region ?? "—"}</span>,
    },
    {
      key: "city",
      label_id: t("hotels.cols.city"),
      label_en: t("hotels.cols.city"),
      render: (_, row) => <span>{row.city ?? "—"}</span>,
    },
    {
      key: "status",
      label_id: t("hotels.cols.status"),
      label_en: t("hotels.cols.status"),
      render: (_, row) => {
        const tone: ToneKey = STATUS_TONE[row.status ?? ""] ?? "off";
        const label =
          row.status === "ACTIVE"
            ? "Aktif"
            : row.status === "TEMPORARILY_CLOSED"
            ? "Tutup Sementara"
            : row.status === "TERMINATED"
            ? "Terminasi"
            : (row.status ?? "—");
        return <StatusPill tone={tone}>{label}</StatusPill>;
      },
    },
    {
      key: "gm_name",
      label_id: t("hotels.cols.gm"),
      label_en: t("hotels.cols.gm"),
      render: (_, row) => <span className="text-sm">{row.gm_name ?? "—"}</span>,
    },
    {
      key: "actions",
      label_id: "Aksi",
      label_en: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <Link
            href={`/dashboard/hotels/${row.code}/edit`}
            className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-card/60 px-2.5 py-1 text-xs font-semibold text-foreground transition hover:bg-muted"
            title="Edit Properti Hotel"
          >
            <Edit2 className="h-3 w-3" />
            Edit
          </Link>
          <Link
            href={`/dashboard/hotel/${row.code}`}
            className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/5 px-2 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10"
            title="Analytics Drilldown"
          >
            <BarChart3 className="h-3 w-3" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Action Toolbar & Status Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/70 p-3 shadow-elegant backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_TABS.map((tab) => {
            const isActive = currentStatusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleFilterStatus(tab.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {tab.labelId}
              </button>
            );
          })}
        </div>

        <div>
          <Link
            href="/dashboard/hotels/create"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Tambah Hotel
          </Link>
        </div>
      </div>

      <ModuleList<Hotel>
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id ?? row.code ?? ""}
        error={error}
        meta={result?.meta}
        page={page}
        icon={Hotel}
        emptyKey="hotels.empty"
        totalKey="hotels.total"
        errorTitleKey="hotels.errorTitle"
        errorNetworkKey="hotels.errorNetwork"
        errorServerKey="hotels.errorServer"
        retryKey="hotels.retry"
      />
    </div>
  );
}