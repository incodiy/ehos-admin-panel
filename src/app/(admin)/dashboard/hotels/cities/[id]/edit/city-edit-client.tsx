"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CavaForm, type FieldSchema } from "@incodiy/cavaform";
import {
  MapPin,
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  Tag,
  Building2,
} from "lucide-react";
import { updateCityAction, type City } from "@/app/actions/cities";
import type { Province, Region } from "@/app/actions/hotels";

interface CityEditClientProps {
  city: City;
  provinces: Province[];
  regions: Region[];
}

export function CityEditClient({ city, provinces, regions }: CityEditClientProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const formFields: FieldSchema[] = [
    {
      name: "name",
      label: "Nama Kota / Kabupaten",
      type: "text",
      defaultValue: city.name,
      placeholder: "Contoh: Jakarta Pusat, Badung, Bandung",
      validation: { required: true },
      helperText: "Nama kanonikal kota atau kabupaten administratif",
    },
    {
      name: "province_id",
      label: "Provinsi",
      type: "select",
      defaultValue: city.province_id ?? "",
      validation: { required: true },
      options: [
        { value: "", label: "Pilih Provinsi..." },
        ...provinces
          .filter((p) => Boolean(p.id))
          .map((p) => ({
            value: p.id as string,
            label: p.name ?? "",
          })),
      ],
      helperText: "Provinsi administratif tempat kota berada",
    },
    {
      name: "region_id",
      label: "Wilayah Regional (Opsional)",
      type: "select",
      defaultValue: city.region_id ?? "",
      options: [
        { value: "", label: "Tanpa Wilayah" },
        ...regions
          .filter((r) => Boolean(r.id))
          .map((r) => ({
            value: r.id as string,
            label: `${r.name ?? ""} (${r.code ?? ""})`,
          })),
      ],
      helperText: "Wilayah regional EHOS untuk pengelompokan hierarki operasional",
    },
    {
      name: "ecommerce_city",
      label: "E-Commerce City (Opsional)",
      type: "text",
      defaultValue: city.ecommerce_city ?? "",
      placeholder: "Contoh: Jakarta, Bali, Bandung",
      helperText: "Label cluster kota untuk pencarian dan pemetaan kanal distribusi OTA / e-commerce",
    },
  ];

  const handleSubmit = async (values: Record<string, string | undefined>) => {
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await updateCityAction(city.id, {
      name: values.name ? values.name.trim() : undefined,
      province_id: values.province_id ? values.province_id.trim() : null,
      region_id: values.region_id ? values.region_id.trim() : null,
      ecommerce_city: values.ecommerce_city ? values.ecommerce_city.trim() : null,
    });

    setSubmitting(false);

    if (!res.ok) {
      setErrorMessage(res.message || "Gagal memperbarui data kota.");
      return;
    }

    setSuccessMessage("Data kota berhasil diperbarui!");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header & Back Link */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard/hotels/cities"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Master Kota
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Kolom Kiri: Form Engine (7 Kolom) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Edit Master Kota</h2>
                <p className="text-sm text-muted-foreground">
                  Perbarui nama kota, relasi wilayah regional, dan identitas cluster e-commerce.
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
                submitLabel: submitting ? "Menyimpan Perubahan..." : "Simpan Perubahan",
              }}
              className="space-y-4"
            />
          </div>
        </div>

        {/* Kolom Kanan: Detail & Ringkasan Entitas (5 Kolom) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Informasi Kota Terpilih
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">ID Kota:</span>
                <span className="font-mono text-xs text-foreground">{city.id}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Provinsi Terhubung:</span>
                <span className="font-medium text-foreground">{city.province ?? "—"}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Wilayah Regional:</span>
                <span className="font-medium text-foreground">{city.region ?? "—"}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-muted-foreground">E-Commerce City:</span>
                <span className="font-semibold text-primary">{city.ecommerce_city ?? "—"}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Tag className="h-4 w-4 text-amber-500" />
              Catatan Sinkronisasi Hotel
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Mengubah nama kota atau provinsi akan otomatis tercermin di seluruh profil hotel yang merujuk pada kota ini secara instan melalui relasi 3NF PostgreSQL.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
