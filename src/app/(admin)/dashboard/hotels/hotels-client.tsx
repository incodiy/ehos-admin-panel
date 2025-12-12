"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Hotel,
  Plus,
  Edit2,
  BarChart3,
  Search,
  Building2,
  Navigation,
  Globe,
  UtensilsCrossed,
  Coffee,
  Eye,
  Tag,
  Contact,
} from "lucide-react";
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
  currentSearch = "",
  currentStatusFilter = "ALL",
}: {
  result: HotelListResult | null;
  error: ApiError | null;
  page: number;
  currentSearch?: string;
  currentStatusFilter?: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const rows: Hotel[] = result?.data ?? [];

  function handleFilter(status: string, search: string) {
    const params = new URLSearchParams();
    if (status !== "ALL") {
      params.set("status", status);
    }
    if (search.trim()) {
      params.set("search", search.trim());
    }
    const q = params.toString() ? `?${params.toString()}` : "";
    router.push(`/dashboard/hotels${q}`);
  }

  const columns: Column<Hotel>[] = [
    {
      key: "property",
      label_id: "Properti Hotel",
      label_en: "Hotel Property",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          {/* Fasad Image Thumbnail */}
          <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
            {row.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={row.image_url}
                alt={row.name}
                className="h-full w-full object-cover transition duration-300 hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                <Hotel className="h-5 w-5 opacity-40" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-primary">{row.code}</span>
              {row.brand_tier && (
                <span className="inline-block rounded-full border border-border bg-background/60 px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {row.brand_tier}
                </span>
              )}
            </div>
            <Link
              href={`/dashboard/hotels/${row.code}`}
              className="block truncate font-medium text-foreground hover:text-primary transition-colors"
              title={row.name}
            >
              {row.name}
            </Link>
            <span className="text-[11px] text-muted-foreground">{row.brand ?? "—"}</span>
          </div>
        </div>
      ),
    },
    {
      key: "location",
      label_id: "Lokasi & Daerah",
      label_en: "Location",
      render: (_, row) => (
        <div className="text-xs space-y-1">
          <div className="font-medium text-foreground">{row.city ?? "—"}</div>
          {row.ecommerce_city && (
            <div className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <Tag className="h-2.5 w-2.5" />
              <span>E-Com: {row.ecommerce_city}</span>
            </div>
          )}
          <div className="text-[11px] text-muted-foreground">{row.region ?? "—"}</div>
        </div>
      ),
    },
    {
      key: "facilities",
      label_id: "Fasilitas F&B",
      label_en: "F&B Facilities",
      render: (_, row) => (
        <div>
          {row.has_fb ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <UtensilsCrossed className="h-3 w-3" />
              F&B Available
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-zinc-500/10 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              <Coffee className="h-3 w-3" />
              Room Only
            </span>
          )}
        </div>
      ),
    },
    {
      key: "contacts",
      label_id: "PIC Operasional",
      label_en: "Key Contacts",
      render: (_, row) => (
        <div className="text-xs space-y-0.5">
          <div className="font-medium text-foreground truncate max-w-[150px]">
            GM: {row.gm_name || "—"}
          </div>
          <div className="text-[11px] text-muted-foreground truncate max-w-[150px]">
            ROM: {row.rom_name || "—"}
          </div>
        </div>
      ),
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
      key: "actions",
      label_id: "Aksi",
      label_en: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/dashboard/hotels/${row.code}`}
            className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-card/60 px-2 py-1 text-xs font-semibold text-foreground transition hover:bg-muted"
            title="Lihat Profil & Detail Hotel"
          >
            <Eye className="h-3 w-3" />
            Detail
          </Link>
          <Link
            href={`/dashboard/hotels/${row.code}/edit`}
            className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-card/60 px-2 py-1 text-xs font-semibold text-foreground transition hover:bg-muted"
            title="Edit Master Hotel"
          >
            <Edit2 className="h-3 w-3" />
            Edit
          </Link>
          <Link
            href={`/dashboard/hotel/${row.code}`}
            className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/5 px-2 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10"
            title="Audit Drilldown"
          >
            <BarChart3 className="h-3 w-3" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/hotels"
            className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
          >
            <Building2 className="h-4 w-4" />
            Katalog Hotel
          </Link>
          <Link
            href="/dashboard/hotels/contacts"
            className="inline-flex items-center gap-2 rounded-xl border border-transparent px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Contact className="h-4 w-4" />
            Kontak PIC
          </Link>
          <Link
            href="/dashboard/hotels/cities"
            className="inline-flex items-center gap-2 rounded-xl border border-transparent px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Navigation className="h-4 w-4" />
            Master Kota
          </Link>
          <Link
            href="/dashboard/hotels/regions"
            className="inline-flex items-center gap-2 rounded-xl border border-transparent px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Globe className="h-4 w-4" />
            Master Wilayah
          </Link>
          <Link
            href="/dashboard/hotels/brands"
            className="inline-flex items-center gap-2 rounded-xl border border-transparent px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Hotel className="h-4 w-4" />
            Master Brand
          </Link>
        </div>

        <Link
          href="/dashboard/hotels/create"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Tambah Hotel
        </Link>
      </div>

      {/* Action Toolbar & Status Filter Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex rounded-xl border border-border bg-background/60 p-1 backdrop-blur-md">
            {STATUS_TABS.map((tab) => {
              const isActive = currentStatusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleFilter(tab.id, searchTerm)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    isActive
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
              placeholder="Cari hotel / kode / kota..."
              className="h-9 w-52 rounded-xl border border-border bg-background/80 pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:w-64"
            />
          </form>
        </div>

        <div className="text-xs text-muted-foreground">
          Total: <span className="font-semibold text-foreground">{rows.length}</span> properti terdaftar
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