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
  Globe2,
  Tag,
  Building2,
} from "lucide-react";
import { createCityAction } from "@/app/actions/cities";
import type { Province, Region } from "@/app/actions/hotels";

interface CityCreateClientProps {
  provinces: Province[];
  regions: Region[];
}

export function CityCreateClient({ provinces, regions }: CityCreateClientProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formFields: FieldSchema[] = [
    {
      name: "name",
      label: "Nama Kota / Kabupaten",
      type: "text",
      placeholder: "Contoh: Jakarta Pusat, Badung, Bandung",
      validation: { required: true },
      helperText: "Nama kanonikal kota atau kabupaten administratif",
    },
    {
      name: "province_id",
      label: "Provinsi",
      type: "select",
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
      options: [
        { value: "", label: "Tanpa Wilayah (Pilih nanti)" },
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
      placeholder: "Contoh: Jakarta, Bali, Bandung",
      helperText: "Label cluster kota untuk pencarian dan pemetaan kanal distribusi OTA / e-commerce",
    },
  ];

  const handleSubmit = async (values: Record<string, string | undefined>) => {
    setSubmitting(true);
    setErrorMessage(null);

    const provinceId = (values.province_id ?? "").trim();
    if (!provinceId) {
      setErrorMessage("Provinsi wajib dipilih.");
      setSubmitting(false);
      return;
    }

    const res = await createCityAction({
      name: (values.name ?? "").trim(),
      province_id: provinceId,
      region_id: values.region_id?.trim() || null,
      ecommerce_city: values.ecommerce_city?.trim() || null,
    });

    setSubmitting(false);

    if (!res.ok) {
      setErrorMessage(res.message || "Gagal menyimpan data kota.");
      return;
    }

    router.push("/dashboard/hotels/cities");
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
                <h2 className="text-lg font-semibold text-foreground">Formulir Kota Baru</h2>
                <p className="text-sm text-muted-foreground">
                  Pendaftaran master kota untuk relasi 3NF profil hotel, pemetaan provinsi, dan e-commerce cluster.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                <ShieldAlert className="h-5 w-5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <CavaForm
              fields={formFields}
              onSubmit={handleSubmit}
              config={{
                submitLabel: submitting ? "Menyimpan Kota..." : "Simpan Kota Baru",
              }}
              className="space-y-4"
            />
          </div>
        </div>

        {/* Kolom Kanan: Panduan Arsitektur & Normalisasi (5 Kolom) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Normalisasi 3NF Master Kota
            </h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <p>
                  Sesuai <strong>Pilihan B (Domain Separation)</strong>, data kota tidak lagi berupa string
                  bebas di tabel hotel, melainkan entitas master ber-relasi formal (Foreign Key) ke provinsi
                  dan region.
                </p>
              </div>
              <div className="flex gap-3">
                <Tag className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <p>
                  Atribut <strong>E-Commerce City</strong> menyatukan variasi nama administratif (seperti
                  Badung, Kuta, Ubud) ke dalam satu label pemasaran umum (misal: <em>Bali</em>).
                </p>
              </div>
              <div className="flex gap-3">
                <Globe2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  Semua profil hotel yang terdaftar di kota ini akan secara otomatis mewarisi informasi
                  provinsi dan wilayah regional terkait.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
