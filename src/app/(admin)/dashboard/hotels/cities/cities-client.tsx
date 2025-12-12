"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle2,
  Building2,
  Globe,
  Tag,
  Hotel,
  Navigation,
  Contact,
} from "lucide-react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ApiError } from "@/lib/api/client";
import { deleteCityAction, type City } from "@/app/actions/cities";
import type { Province, Region } from "@/app/actions/hotels";

interface CitiesClientProps {
  cities: City[];
  provinces: Province[];
  regions: Region[];
  error: ApiError | null;
  currentSearch?: string;
  currentProvince?: string;
  currentRegion?: string;
}

export function CitiesClient({
  cities,
  provinces,
  regions,
  error,
  currentSearch = "",
  currentProvince = "ALL",
  currentRegion = "ALL",
}: CitiesClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const [selectedProvince, setSelectedProvince] = useState(currentProvince);
  const [selectedRegion, setSelectedRegion] = useState(currentRegion);

  const [deleteTarget, setDeleteTarget] = useState<City | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  function handleFilter(newSearch: string, newProv: string, newReg: string) {
    const params = new URLSearchParams();
    if (newSearch.trim()) params.set("search", newSearch.trim());
    if (newProv && newProv !== "ALL") params.set("province_id", newProv);
    if (newReg && newReg !== "ALL") params.set("region_id", newReg);
    const q = params.toString() ? `?${params.toString()}` : "";
    router.push(`${pathname}${q}`);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget || !deleteTarget.id) return;
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await deleteCityAction(deleteTarget.id);
      if (!res.ok) {
        setActionError(res.message || "Gagal menghapus kota. Pastikan tidak ada hotel yang terhubung.");
      } else {
        setActionSuccess(`Kota ${deleteTarget.name} berhasil dihapus.`);
        setDeleteTarget(null);
        router.refresh();
      }
    });
  }

  const columns: Column<City>[] = [
    {
      key: "name",
      label_id: "Nama Kota",
      label_en: "City Name",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
            <MapPin className="h-4 w-4" />
          </div>
          <span className="font-semibold text-foreground">{row.name}</span>
        </div>
      ),
    },
    {
      key: "province",
      label_id: "Provinsi",
      label_en: "Province",
      render: (_, row) => (
        <span className="inline-flex items-center rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
          {row.province ?? "—"}
        </span>
      ),
    },
    {
      key: "region",
      label_id: "Wilayah Regional",
      label_en: "Region",
      render: (_, row) => (
        <span className="inline-flex items-center rounded-md border border-border bg-background/60 px-2.5 py-1 text-xs font-semibold text-foreground">
          {row.region ?? "—"}
        </span>
      ),
    },
    {
      key: "ecommerce_city",
      label_id: "E-Commerce City",
      label_en: "Ecommerce City",
      render: (_, row) => (
        row.ecommerce_city ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            <Tag className="h-3 w-3" />
            {row.ecommerce_city}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )
      ),
    },
    {
      key: "actions",
      label_id: "Aksi",
      label_en: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/dashboard/hotels/cities/${encodeURIComponent(row.id)}/edit`}
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

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/hotels"
            className="inline-flex items-center gap-2 rounded-xl border border-transparent px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
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
            className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
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
          href="/dashboard/hotels/cities/create"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Tambah Kota Baru
        </Link>
      </div>

      {/* Action feedback alerts */}
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
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error.message || "Gagal memuat daftar kota dari server."}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFilter(searchTerm, selectedProvince, selectedRegion);
            }}
            className="relative flex items-center"
          >
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama kota / e-commerce..."
              className="h-9 w-52 rounded-xl border border-border bg-background/80 pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:w-64"
            />
          </form>

          {/* Province Filter */}
          <select
            value={selectedProvince}
            onChange={(e) => {
              setSelectedProvince(e.target.value);
              handleFilter(searchTerm, e.target.value, selectedRegion);
            }}
            className="h-9 rounded-xl border border-border bg-background/80 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">Semua Provinsi</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Region Filter */}
          <select
            value={selectedRegion}
            onChange={(e) => {
              setSelectedRegion(e.target.value);
              handleFilter(searchTerm, selectedProvince, e.target.value);
            }}
            className="h-9 rounded-xl border border-border bg-background/80 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">Semua Wilayah</option>
            {regions.map((r) => (
              <option key={r.id ?? r.code} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-muted-foreground">
          Total: <span className="font-semibold text-foreground">{cities.length}</span> kota terdaftar
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={cities}
        emptyMessage="Tidak ada data kota yang sesuai dengan filter."
      />

      {/* Delete Confirmation Modal Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-destructive mb-3">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-base font-semibold">Hapus Master Kota</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Apakah Anda yakin ingin menghapus kota{" "}
              <strong className="text-foreground">{deleteTarget.name}</strong>? Tindakan ini tidak dapat
              dibatalkan jika kota telah digunakan oleh profil hotel.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleDeleteConfirm}
                className="inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90"
              >
                <Trash2 className="h-4 w-4" />
                {isPending ? "Menghapus..." : "Ya, Hapus Kota"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
