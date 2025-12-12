"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { MapPin, Plus, Edit2, Trash2, Search, AlertCircle, CheckCircle2 } from "lucide-react";
import { StatusPill, type Column } from "@/components/admin/data-table";
import { ModuleList } from "@/components/admin/module-list";
import { ApiError } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi.d";
import { deleteRegionAction } from "@/app/actions/regions";

type Region = components["schemas"]["Region"];
type ToneKey = "on" | "wait" | "off";

export type RegionListResult = {
  success?: boolean;
  data?: Region[];
  meta?: components["schemas"]["PaginationMeta"];
};

const STATUS_TONE: Record<string, ToneKey> = {
  ACTIVE: "on",
  INACTIVE: "wait",
  RETIRED: "off",
};

const STATUS_TABS = [
  { id: "ALL", labelId: "Semua Status", labelEn: "All Status" },
  { id: "ACTIVE", labelId: "Aktif", labelEn: "Active" },
  { id: "INACTIVE", labelId: "Nonaktif", labelEn: "Inactive" },
  { id: "RETIRED", labelId: "Pensiun", labelEn: "Retired" },
];

export function RegionsClient({
  result,
  error,
  page,
  currentSearch = "",
  currentStatusFilter = "ALL",
}: {
  result: RegionListResult | null;
  error: ApiError | null;
  page: number;
  currentSearch?: string;
  currentStatusFilter?: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const [deleteTarget, setDeleteTarget] = useState<Region | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const rows: Region[] = result?.data ?? [];
  const meta = result?.meta;

  function handleFilter(newStatus: string, newSearch: string) {
    const params = new URLSearchParams();
    if (newStatus !== "ALL") params.set("status", newStatus);
    if (newSearch.trim()) params.set("search", newSearch.trim());
    const q = params.toString() ? `?${params.toString()}` : "";
    router.push(`${pathname}${q}`);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget || !deleteTarget.id) return;
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await deleteRegionAction(deleteTarget.id as string);
      if (!res.ok) {
        setActionError(res.message || t("regions.deleteBlocked"));
      } else {
        setActionSuccess(t("regions.deleteSuccess"));
        setDeleteTarget(null);
        router.refresh();
      }
    });
  }

  const columns: Column<Region>[] = [
    {
      key: "code",
      label_id: t("regions.cols.code"),
      label_en: t("regions.cols.code"),
      render: (_, row) => (
        <span className="font-mono text-xs font-bold text-primary">{row.code}</span>
      ),
    },
    {
      key: "name",
      label_id: t("regions.cols.name"),
      label_en: t("regions.cols.name"),
      render: (_, row) => <span className="font-medium text-foreground">{row.name}</span>,
    },
    {
      key: "country",
      label_id: t("regions.cols.country"),
      label_en: t("regions.cols.country"),
      render: (_, row) => <span>{row.country ?? "—"}</span>,
    },
    {
      key: "sales_region",
      label_id: t("regions.cols.sales"),
      label_en: t("regions.cols.sales"),
      render: (_, row) => <span>{row.sales_region ?? "—"}</span>,
    },
    {
      key: "ecommerce_region",
      label_id: "Wilayah E-Commerce",
      label_en: "Ecommerce Region",
      render: (_, row) => (
        <span className="font-mono text-xs text-muted-foreground">{row.ecommerce_region ?? "—"}</span>
      ),
    },
    {
      key: "status",
      label_id: t("regions.cols.status"),
      label_en: t("regions.cols.status"),
      render: (_, row) => {
        const tone: ToneKey = STATUS_TONE[row.status ?? ""] ?? "off";
        const label =
          row.status === "ACTIVE"
            ? t("regions.status.ACTIVE")
            : row.status === "INACTIVE"
            ? t("regions.status.INACTIVE")
            : row.status === "RETIRED"
            ? t("regions.status.RETIRED")
            : (row.status ?? "—");
        return <StatusPill tone={tone}>{label}</StatusPill>;
      },
    },
    {
      key: "actions",
      label_id: t("regions.cols.actions"),
      label_en: t("regions.cols.actions"),
      render: (_, row) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/dashboard/hotels/regions/${encodeURIComponent(row.id ?? row.code ?? "")}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </Link>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Hapus
          </button>
        </div>
      ),
    },
  ];

  const headerSlot = (
    <div className="space-y-4">
      {/* Action feedback banners */}
      {actionError && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}
      {actionSuccess && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Top Filter and Actions Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex rounded-xl border border-border bg-background/60 p-1 backdrop-blur-md">
            {STATUS_TABS.map((tab) => {
              const active = currentStatusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleFilter(tab.id, searchTerm)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.labelId}
                </button>
              );
            })}
          </div>

          {/* Search box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFilter(currentStatusFilter, searchTerm);
            }}
            className="relative flex items-center"
          >
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari wilayah / kode..."
              className="h-9 w-48 rounded-xl border border-border bg-background/80 pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:w-60"
            />
          </form>
        </div>

        {/* Create Region Button */}
        <Link
          href="/dashboard/hotels/regions/create"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          {t("regions.createButton")}
        </Link>
      </div>

      {/* Delete Confirmation Modal Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-destructive mb-3">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-base font-semibold">{t("regions.deleteTitle")}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              {t("regions.deleteConfirm", { name: `${deleteTarget.name} (${deleteTarget.code})` })}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleDeleteConfirm}
                className="rounded-xl bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground shadow transition-colors hover:bg-destructive/90"
              >
                {isPending ? "Menghapus..." : "Hapus Wilayah"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <ModuleList<Region>
      columns={columns}
      rows={rows}
      rowKey={(row) => row.id ?? row.code ?? ""}
      error={error}
      meta={meta}
      page={page}
      icon={MapPin}
      headerSlot={headerSlot}
      emptyKey="regions.empty"
      totalKey="regions.total"
      errorTitleKey="regions.errorTitle"
      errorNetworkKey="regions.errorNetwork"
      errorServerKey="regions.errorServer"
      retryKey="regions.retry"
    />
  );
}