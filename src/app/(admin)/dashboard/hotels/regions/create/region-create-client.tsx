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
  Globe2,
  Users,
} from "lucide-react";
import { createRegionAction } from "@/app/actions/regions";

export function RegionCreateClient() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formFields: FieldSchema[] = [
    {
      name: "code",
      label: "Kode Wilayah (Unik, Huruf Kapital)",
      type: "text",
      placeholder: "Contoh: JABAR",
      validation: { required: true },
      helperText: "Kode pengenal wilayah kapital unik untuk pemetaan RLS dan penugasan Regional ROM",
    },
    {
      name: "name",
      label: "Nama Wilayah",
      type: "text",
      placeholder: "Contoh: West Java",
      validation: { required: true },
      helperText: "Nama kanonikal wilayah operasional perhotelan",
    },
    {
      name: "country",
      label: "Negara",
      type: "text",
      defaultValue: "Indonesia",
      validation: { required: true },
      helperText: "Negara cakupan wilayah (default: Indonesia)",
    },
    {
      name: "sales_region",
      label: "Divisi Penjualan / Sales Region",
      type: "text",
      placeholder: "Contoh: Java & Bali Sales Division",
      helperText: "Nama kelompok sales regional untuk pelaporan CRM dan target bisnis",
    },
    {
      name: "ecommerce_region",
      label: "Wilayah E-Commerce",
      type: "text",
      placeholder: "Contoh: JABAR / BALI NUSA / CENTRAL JAVA",
      helperText: "Kelompok wilayah pemasaran OTA dan distribusi e-commerce",
    },
    {
      name: "status",
      label: "Status Operasional",
      type: "select",
      defaultValue: "ACTIVE",
      options: [
        { value: "ACTIVE", label: "Aktif (Operasional Penuh)" },
        { value: "INACTIVE", label: "Nonaktif (Masa Transisi/Restrukturisasi)" },
        { value: "RETIRED", label: "Pensiun (Arsip Historis)" },
      ],
      helperText: "Wilayah nonaktif atau pensiun tidak dapat dipilih saat mendaftarkan properti baru",
    },
  ];

  const handleSubmit = async (values: Record<string, string | undefined>) => {
    setSubmitting(true);
    setErrorMessage(null);

    const res = await createRegionAction({
      code: (values.code ?? "").trim().toUpperCase(),
      name: (values.name ?? "").trim(),
      country: values.country?.trim() || "Indonesia",
      sales_region: values.sales_region?.trim() || null,
      ecommerce_region: values.ecommerce_region?.trim() || null,
      status: (values.status as "ACTIVE" | "INACTIVE" | "RETIRED") || "ACTIVE",
    });

    setSubmitting(false);

    if (!res.ok) {
      setErrorMessage(res.message || "Gagal menyimpan data wilayah.");
      return;
    }

    router.push("/dashboard/hotels/regions");
    router.refresh();
  };

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
                <h2 className="text-lg font-semibold text-foreground">Formulir Wilayah Baru</h2>
                <p className="text-sm text-muted-foreground">
                  Pendaftaran master region untuk pembagian hierarki operasional dan skop RBAC.
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
                submitLabel: submitting ? "Menyimpan Wilayah..." : "Simpan Wilayah Baru",
              }}
              className="space-y-4"
            />
          </div>
        </div>

        {/* Kolom Kanan: Contextual & Architecture Guidelines (5 Kolom) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: RLS & Scoping */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Skop RBAC & Row-Level Security
            </h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <p>
                  Setiap properti hotel terikat pada <strong>Region ID</strong>. Pengguna dengan role{" "}
                  <code className="text-foreground font-mono text-xs font-semibold">REGIONAL_ROM</code> otomatis hanya dapat mengakses data audit, CAPA, dan CRM pada hotel-hotel di wilayah yang ditugaskan kepadanya.
                </p>
              </div>
              <div className="flex gap-3">
                <Globe2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  Bidang <strong>Country</strong> mendukung ekspansi wilayah internasional tanpa merusak skema isolasi data nasional.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: FSM Status Guide */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Pedoman Status Multi-State
            </h3>
            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="rounded-xl border border-border/80 bg-background/50 p-3">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">
                  ● ACTIVE (Aktif)
                </span>
                Wilayah beroperasi penuh dan siap menerima pendaftaran hotel baru serta penugasan ROM.
              </div>
              <div className="rounded-xl border border-border/80 bg-background/50 p-3">
                <span className="font-semibold text-amber-600 dark:text-amber-400 block mb-1">
                  ● INACTIVE (Nonaktif)
                </span>
                Wilayah dalam masa transisi restrukturisasi unit. Pendaftaran hotel baru ditangguhkan.
              </div>
              <div className="rounded-xl border border-border/80 bg-background/50 p-3">
                <span className="font-semibold text-slate-500 block mb-1">
                  ● RETIRED (Pensiun)
                </span>
                Wilayah telah dimerger atau dipensiunkan. Data dipertahankan untuk integritas audit historis.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
