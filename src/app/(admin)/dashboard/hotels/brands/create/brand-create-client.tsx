"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CavaForm, type FieldSchema } from "@incodiy/cavaform";
import {
  Building2,
  ArrowLeft,
  ShieldAlert,
  Info,
  CheckCircle2,
  Layers,
  Sparkles,
  Award,
} from "lucide-react";
import { createBrandAction, type BrandCreateRequest } from "@/app/actions/brands";

export function BrandCreateClient() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formFields: FieldSchema[] = [
    {
      name: "code",
      label: "Kode Brand (Unik, Huruf Kapital)",
      type: "text",
      placeholder: "Contoh: SBH, GSB, ZST",
      validation: { required: true },
      helperText: "Kode pengenal unik brand 2-20 karakter (otomatis dinormalisasi huruf kapital)",
    },
    {
      name: "name",
      label: "Nama Brand",
      type: "text",
      placeholder: "Contoh: Swiss-Belhotel, Zest Hotel",
      validation: { required: true },
      helperText: "Nama kanonikal brand korporat perhotelan",
    },
    {
      name: "tier",
      label: "Tier Standar Layanan (PRD-F-01)",
      type: "select",
      defaultValue: "Upscale",
      options: [
        { value: "Luxury", label: "Luxury (Bintang 5+ / Grand Luxury)" },
        { value: "Upscale", label: "Upscale (Bintang 4-5 / Bisnis & Resor Premium)" },
        { value: "Boutique", label: "Boutique (Desain Tematik & Layanan Personalisasi)" },
        { value: "Midscale", label: "Midscale (Bintang 3-4 / Urban Modern)" },
        { value: "Budget", label: "Budget (Bintang 2 / Esensial & Kompak)" },
        { value: "Eco-Resort", label: "Eco-Resort (Konservasi Lingkungan & Alam)" },
      ],
      validation: { required: true },
      helperText: "Filter brand_tier otomatis mengonfigurasi rubrik pertanyaan checklist audit",
    },
    {
      name: "status",
      label: "Status Operasional Brand",
      type: "select",
      defaultValue: "ACTIVE",
      options: [
        { value: "ACTIVE", label: "Aktif (Dapat Didaftarkan ke Properti Hotel)" },
        { value: "INACTIVE", label: "Nonaktif (Masa Penundaan/Restrukturisasi Portofolio)" },
        { value: "RETIRED", label: "Pensiun (Arsip Historis Brand)" },
      ],
      helperText: "Brand nonaktif atau pensiun tidak dapat dipilih saat mendaftarkan unit hotel baru",
    },
  ];

  async function handleSubmit(values: Record<string, unknown>) {
    setSubmitting(true);
    setErrorMessage(null);

    const payload: BrandCreateRequest = {
      code: String(values.code || "").trim().toUpperCase(),
      name: String(values.name || "").trim(),
      tier: (values.tier as BrandCreateRequest["tier"]) || "Upscale",
      status: (values.status as BrandCreateRequest["status"]) || "ACTIVE",
    };

    const res = await createBrandAction(payload);
    setSubmitting(false);

    if (!res.ok) {
      setErrorMessage(res.message || "Gagal menambahkan brand baru. Periksa koneksi dan coba lagi.");
    } else {
      router.push("/dashboard/hotels/brands");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Back Navigation */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/hotels/brands"
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            title="Kembali ke Katalog Brand"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              <h1 className="text-xl font-bold tracking-tight text-zinc-100">
                Tambah Brand Baru
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Konfigurasi brand korporat dan penentuan tier standar layanan (PRD-F-01).
            </p>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-950/60 border border-rose-800/80 rounded-xl text-sm text-rose-300 flex items-start gap-3 shadow-lg">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-rose-200">Gagal Menyimpan Brand</h4>
            <p className="text-xs text-rose-300/90 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* 2-Column Dedicated Layout: 7 cols Form + 5 cols Architecture Context */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Form Utama (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-zinc-800/70 pb-3">
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Identitas & Parameter Brand
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Lengkapi data kanonikal brand yang akan berlaku di seluruh sistem EHOS.
            </p>
          </div>

          <CavaForm
            fields={formFields}
            onSubmit={handleSubmit}
            config={{
              submitLabel: submitting ? "Menyimpan Data..." : "Simpan & Daftarkan Brand",
            }}
          />
        </div>

        {/* Kolom Kanan: Panduan Arsitektur & Tier Impact (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 1: Dampak Tier terhadap Rubrik Checklist (PRD-F-01) */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <Sparkles className="w-4 h-4" />
              <h3 className="text-xs font-semibold tracking-wide uppercase">
                Dampak Tier Checklist (PRD-F-01)
              </h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Pemilihan <strong>Brand Tier</strong> menentukan otomatisasi pertanyaan checklist audit multi-departemen (Housekeeping, F&B, GM, Risk).
            </p>
            <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-2 text-xs text-zinc-400">
              <div className="flex items-center gap-2 text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Standar amenitas Luxury/Resort ≠ Budget</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Mencegah opsi N/A palsu pada evaluasi operasional</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Bobot penilaian audit terkalibrasi secara adil</span>
              </div>
            </div>
          </div>

          {/* Card 2: Klasifikasi 6 Tier Resmi */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <Award className="w-4 h-4" />
              <h3 className="text-xs font-semibold tracking-wide uppercase">
                Klasifikasi Tier Resmi SBII
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-zinc-300">
              <li className="flex items-start gap-2">
                <span className="font-mono text-amber-400 font-semibold shrink-0">Luxury:</span>
                <span>Grand Swiss-Belhotel, MĀUA (Fasilitas bintang 5+, butler, private pool).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-violet-400 font-semibold shrink-0">Upscale:</span>
                <span>Swiss-Belhotel, Swiss-Belresidence (Full-service MICE & grand ballroom).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-pink-400 font-semibold shrink-0">Boutique:</span>
                <span>Swiss-Belboutique (Sentuhan artistik & layanan personal).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-sky-400 font-semibold shrink-0">Midscale:</span>
                <span>Swiss-Belinn, Swiss-Belcourt (Pilihan ideal pelancong urban & dinas).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-zinc-400 font-semibold shrink-0">Budget:</span>
                <span>Swiss-Belexpress, Zest Hotel (Kamar kompak esensial, grab-and-go).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-emerald-400 font-semibold shrink-0">Eco-Resort:</span>
                <span>Swiss-Belresort (Wisata alam, konservasi, ruang terbuka hijau).</span>
              </li>
            </ul>
          </div>

          {/* Card 3: Aturan Kode & Integritas */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 shadow-lg space-y-2">
            <div className="flex items-center gap-2 text-blue-400">
              <Info className="w-4 h-4" />
              <h3 className="text-xs font-semibold tracking-wide uppercase">
                Aturan Integritas Data
              </h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Kode brand bersifat unik global di database (contoh: <code className="text-zinc-200 font-mono">SBH</code>, <code className="text-zinc-200 font-mono">ZST</code>). Setelah properti hotel dikaitkan ke brand, kode tidak dapat diubah sembarangan guna menjaga riwayat audit dan konsistensi kontrak API.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
