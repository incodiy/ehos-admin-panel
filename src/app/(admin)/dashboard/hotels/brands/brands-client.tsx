"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Building2, Plus, Edit2, Trash2, Search, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { StatusPill, type Column } from "@/components/admin/data-table";
import { ModuleList } from "@/components/admin/module-list";
import { ApiError } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi.d";
import { deleteBrandAction } from "@/app/actions/brands";

type Brand = components["schemas"]["Brand"];
type ToneKey = "on" | "wait" | "off";

export type BrandListResult = {
  success?: boolean;
  data?: Brand[];
  meta?: components["schemas"]["PaginationMeta"];
};

const STATUS_TONE: Record<string, ToneKey> = {
  ACTIVE: "on",
  INACTIVE: "wait",
  RETIRED: "off",
};

const BRAND_TIER_TONE: Record<string, ToneKey> = {
  Luxury: "on",
  Upscale: "wait",
  Boutique: "wait",
  Midscale: "wait",
  Budget: "wait",
  "Eco-Resort": "on",
};

const STATUS_TABS = [
  { id: "ALL", labelId: "Semua Status", labelEn: "All Status" },
  { id: "ACTIVE", labelId: "Aktif", labelEn: "Active" },
  { id: "INACTIVE", labelId: "Nonaktif", labelEn: "Inactive" },
  { id: "RETIRED", labelId: "Pensiun", labelEn: "Retired" },
];

const TIERS = [
  "ALL",
  "Luxury",
  "Upscale",
  "Boutique",
  "Midscale",
  "Budget",
  "Eco-Resort",
];

export function BrandsClient({
  result,
  error,
  page,
  currentSearch = "",
  currentTierFilter = "ALL",
  currentStatusFilter = "ALL",
}: {
  result: BrandListResult | null;
  error: ApiError | null;
  page: number;
  currentSearch?: string;
  currentTierFilter?: string;
  currentStatusFilter?: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const rows: Brand[] = result?.data ?? [];
  const meta = result?.meta;

  function handleFilter(newStatus: string, newTier: string, newSearch: string) {
    const params = new URLSearchParams();
    if (newStatus !== "ALL") params.set("status", newStatus);
    if (newTier !== "ALL") params.set("tier", newTier);
    if (newSearch.trim()) params.set("search", newSearch.trim());
    const q = params.toString() ? `?${params.toString()}` : "";
    router.push(`${pathname}${q}`);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget || !deleteTarget.id) return;
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await deleteBrandAction(deleteTarget.id as string);
      if (!res.ok) {
        setActionError(res.message || t("brands.deleteBlocked"));
      } else {
        setActionSuccess(t("brands.deleteSuccess"));
        setDeleteTarget(null);
        router.refresh();
      }
    });
  }

  const columns: Column<Brand>[] = [
    {
      key: "code",
      label_id: t("brands.cols.code"),
      label_en: t("brands.cols.code"),
      render: (_, row) => (
        <span className="font-mono text-xs font-semibold tracking-wider text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
          {row.code}
        </span>
      ),
    },
    {
      key: "name",
      label_id: t("brands.cols.name"),
      label_en: t("brands.cols.name"),
      render: (_, row) => (
        <div className="font-medium text-zinc-100 flex items-center gap-1.5">
          {row.name}
        </div>
      ),
    },
    {
      key: "tier",
      label_id: t("brands.cols.tier"),
      label_en: t("brands.cols.tier"),
      render: (_, row) => (
        <StatusPill tone={BRAND_TIER_TONE[row.tier] ?? "wait"}>
          {row.tier}
        </StatusPill>
      ),
    },
    {
      key: "status",
      label_id: t("brands.cols.status"),
      label_en: t("brands.cols.status"),
      render: (_, row) => {
        const s = (row.status ?? "ACTIVE") as string;
        return (
          <StatusPill tone={STATUS_TONE[s] ?? "wait"}>
            {t(`brands.status.${s}`) || s}
          </StatusPill>
        );
      },
    },
    {
      key: "hotels_count",
      label_id: t("brands.cols.hotelsCount"),
      label_en: t("brands.cols.hotelsCount"),
      render: (_, row) => (
        <span className="text-xs text-zinc-400 font-mono">
          {row.hotels_count ?? 0} properti
        </span>
      ),
    },
    {
      key: "actions",
      label_id: t("brands.cols.actions"),
      label_en: t("brands.cols.actions"),
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/hotels/brands/${encodeURIComponent(row.id as string)}/edit`}
            className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-950/30 rounded transition-colors"
            title={t("brands.editTitle")}
          >
            <Edit2 className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => {
              setActionError(null);
              setDeleteTarget(row);
            }}
            className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors"
            title={t("brands.deleteTitle")}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Alert pesan sukses / error */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-lg text-sm text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-lg text-sm text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Control Bar: Search, Filter Tabs & Tambah Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800/70 p-3 rounded-xl">
        {/* Status FSM Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {STATUS_TABS.map((tab) => {
            const isActive = currentStatusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleFilter(tab.id, currentTierFilter, searchTerm)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                }`}
              >
                {tab.labelId}
              </button>
            );
          })}
        </div>

        {/* Tier Filter & Search & Actions */}
        <div className="flex items-center gap-2">
          {/* Tier dropdown */}
          <select
            value={currentTierFilter}
            onChange={(e) => handleFilter(currentStatusFilter, e.target.value, searchTerm)}
            className="bg-zinc-950/80 border border-zinc-700/60 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
          >
            {TIERS.map((tier) => (
              <option key={tier} value={tier}>
                {tier === "ALL" ? "Semua Tier" : tier}
              </option>
            ))}
          </select>

          {/* Search box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFilter(currentStatusFilter, currentTierFilter, searchTerm);
            }}
            className="relative"
          >
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari brand / kode..."
              className="bg-zinc-950/80 border border-zinc-700/60 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 w-44 md:w-56"
            />
          </form>

          {/* Create Button */}
          <Link
            href="/dashboard/hotels/brands/create"
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Brand</span>
          </Link>
        </div>
      </div>

      {/* Tabel Data ModuleList */}
      <ModuleList<Brand>
        columns={columns}
        rows={rows}
        rowKey={(row) => (row.id as string) || row.code}
        error={error}
        page={page}
        icon={Building2}
        emptyKey="brands.empty"
        totalKey="brands.total"
        errorTitleKey="brands.errorTitle"
        errorNetworkKey="brands.errorNetwork"
        errorServerKey="brands.errorServer"
        retryKey="brands.retry"
      />

      {/* Pagination Footer */}
      {meta && meta.last_page && meta.last_page > 1 && (
        <div className="flex items-center justify-between text-xs text-zinc-400 px-2 py-3 border-t border-zinc-800">
          <span>
            Halaman {meta.current_page ?? page} dari {meta.last_page} ({meta.total ?? 0} total brand)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                params.set("page", String(page - 1));
                router.push(`${pathname}?${params.toString()}`);
              }}
              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              disabled={page >= (meta.last_page ?? 1)}
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                params.set("page", String(page + 1));
                router.push(`${pathname}?${params.toString()}`);
              }}
              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 bg-rose-950/80 rounded-lg border border-rose-800/60">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  {t("brands.deleteTitle")}
                </h3>
                <p className="text-xs text-zinc-400">
                  {deleteTarget.name} ({deleteTarget.code})
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {t("brands.deleteConfirm", { name: deleteTarget.name })}
            </p>

            {deleteTarget.hotels_count && deleteTarget.hotels_count > 0 ? (
              <div className="p-2.5 bg-amber-950/40 border border-amber-800/40 rounded-lg text-xs text-amber-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Perhatian: Brand ini memiliki {deleteTarget.hotels_count} hotel aktif terikat. Penghapusan akan otomatis ditolak oleh sistem.
                </span>
              </div>
            ) : null}

            {actionError && (
              <div className="p-2.5 bg-rose-950/60 border border-rose-800/60 rounded-lg text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleDeleteConfirm}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isPending ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}