"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CavaForm, type FieldSchema } from "@incodiy/cavaform";
import {
  MapPin,
  ArrowLeft,
  ShieldAlert,
  Info,
  CheckCircle2,
  Building2,
  Users,
  Key,
} from "lucide-react";
import type { components } from "@/lib/api/openapi.d";
import { updateRegionAction } from "@/app/actions/regions";
import { StatusPill } from "@/components/admin/data-table";

type RegionDetail = components["schemas"]["RegionDetail"];

interface RegionEditClientProps {
  region: RegionDetail;
}

export function RegionEditClient({ region }: RegionEditClientProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const formFields: FieldSchema[] = [
    {
      name: "code",
      label: "Kode Wilayah (Unik, Huruf Kapital)",
      type: "text",
      defaultValue: region.code,
      placeholder: "Contoh: JABAR",
      validation: { required: true },
      helperText: "Kode unik pengenal wilayah untuk pemetaan RLS dan penugasan Regional ROM",
    },
    {
      name: "name",
      label: "Nama Wilayah",
      type: "text",
      defaultValue: region.name,
      placeholder: "Contoh: West Java",
      validation: { required: true },
      helperText: "Nama kanonikal wilayah operasional",
    },
    {
      name: "country",
      label: "Negara",
      type: "text",
      defaultValue: region.country ?? "Indonesia",
      validation: { required: true },
      helperText: "Negara cakupan wilayah",
    },
    {
      name: "sales_region",
      label: "Divisi Penjualan / Sales Region",
      type: "text",
      defaultValue: region.sales_region ?? "",
      placeholder: "Contoh: Java & Bali Sales Division",
      helperText: "Nama divisi penjualan regional untuk CRM & quotation",
    },
    {
      name: "ecommerce_region",
      label: "Wilayah E-Commerce",
      type: "text",
      defaultValue: region.ecommerce_region ?? "",
      placeholder: "Contoh: JABAR / BALI NUSA / CENTRAL JAVA",
      helperText: "Kelompok wilayah pemasaran OTA dan distribusi e-commerce",
    },
    {
      name: "status",
      label: "Status Operasional FSM",
      type: "select",
      defaultValue: region.status ?? "ACTIVE",
      options: [
        { value: "ACTIVE", label: "Aktif (Operasional Penuh)" },
        { value: "INACTIVE", label: "Nonaktif (Masa Transisi/Restrukturisasi)" },
        { value: "RETIRED", label: "Pensiun (Arsip Historis)" },
      ],
      helperText: "Mengubah status menjadi Nonaktif/Pensiun akan mencegah pendaftaran properti baru",
    },
  ];

  const handleSubmit = async (values: Record<string, string | undefined>) => {
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const regionId = (region.id ?? region.code) as string;
    const res = await updateRegionAction(regionId, {
      code: values.code ? values.code.trim().toUpperCase() : undefined,
      name: values.name ? values.name.trim() : undefined,
      country: values.country ? values.country.trim() : undefined,
      sales_region: values.sales_region !== undefined ? (values.sales_region.trim() || null) : undefined,
      ecommerce_region: values.ecommerce_region !== undefined ? (values.ecommerce_region.trim() || null) : undefined,
      status: values.status as "ACTIVE" | "INACTIVE" | "RETIRED" | undefined,
    });

    setSubmitting(false);

    if (!res.ok) {
      setErrorMessage(res.message || "Gagal memperbarui data wilayah.");
      return;
    }

    setSuccessMessage("Data wilayah berhasil diperbarui.");
    router.refresh();
  };

  const statusTone =
    region.status === "ACTIVE"
      ? "on"
      : region.status === "INACTIVE"
      ? "wait"
      : "off";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header & Back Link */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard/hotels/regions"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Wilayah
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Status saat ini:</span>
          <StatusPill tone={statusTone}>{region.status ?? "ACTIVE"}</StatusPill>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Kolom Kiri: Primary Form Engine (7 Kolom) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Edit Wilayah: {region.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Perbarui profil, data penjualan, dan transisi status FSM operasional.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                <ShieldAlert className="h-5 w-5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <CavaForm
              fields={formFields}
              onSubmit={handleSubmit}
              config={{
                submitLabel: submitting ? "Memperbarui Data..." : "Perbarui Data Wilayah",
              }}
              className="space-y-4"
            />
          </div>
        </div>

        {/* Kolom Kanan: Contextual & Live Relational Metadata Panel (5 Kolom) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Relational Stats */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Statistik Properti & Penugasan
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
                <span className="text-muted-foreground">Properti Hotel Aktif:</span>
                <span className="font-semibold text-foreground text-base">
                  {region.hotels_count ?? 0} Hotel
                </span>
              </div>

              {region.hotels_count && region.hotels_count > 0 ? (
                <div className="flex gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>
                    Wilayah ini memiliki hotel aktif terafiliasi. Operasi penghapusan diblokir demi menjaga integritas data relasional.
                  </p>
                </div>
              ) : null}

              <div>
                <span className="text-xs text-muted-foreground block mb-2 font-medium">
                  Regional ROM yang Ditugaskan:
                </span>
                {region.rom_names && region.rom_names.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {region.rom_names.map((name, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground"
                      >
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs italic text-muted-foreground">
                    Belum ada Regional ROM yang ditugaskan ke wilayah ini.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: System Metadata */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              Identitas & Jejak Audit
            </h3>
            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span>Public UUID:</span>
                <span className="font-mono text-foreground select-all">{region.id ?? "—"}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span>Kode Wilayah:</span>
                <span className="font-mono font-semibold text-primary">{region.code}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span>Terdaftar Sejak:</span>
                <span className="text-foreground">
                  {region.created_at ? new Date(region.created_at).toLocaleDateString("id-ID") : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Pembaruan Terakhir:</span>
                <span className="text-foreground">
                  {region.updated_at ? new Date(region.updated_at).toLocaleDateString("id-ID") : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
