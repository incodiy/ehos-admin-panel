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
  Hotel,
  Layers,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { components } from "@/lib/api/openapi";
import { updateBrandAction, deleteBrandAction, type BrandUpdateRequest } from "@/app/actions/brands";
import { StatusPill } from "@/components/admin/data-table";

type BrandDetail = components["schemas"]["BrandDetail"];
type BrandHotelSummary = components["schemas"]["BrandHotelSummary"];

interface BrandEditClientProps {
  brand: BrandDetail;
}

export function BrandEditClient({ brand }: BrandEditClientProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formFields: FieldSchema[] = [
    {
      name: "code",
      label: "Kode Brand (Unik, Huruf Kapital)",
      type: "text",
      defaultValue: brand.code,
      placeholder: "Contoh: SBH",
      validation: { required: true },
      helperText: "Kode unik pengenal brand 2-20 karakter",
    },
    {
      name: "name",
      label: "Nama Brand",
      type: "text",
      defaultValue: brand.name,
      placeholder: "Contoh: Swiss-Belhotel",
      validation: { required: true },
      helperText: "Nama kanonikal brand korporat perhotelan",
    },
    {
      name: "tier",
      label: "Tier Standar Layanan (PRD-F-01)",
      type: "select",
      defaultValue: brand.tier,
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
      defaultValue: brand.status ?? "ACTIVE",
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
    setSuccessMessage(null);

    const payload: BrandUpdateRequest = {
      code: String(values.code || "").trim().toUpperCase(),
      name: String(values.name || "").trim(),
      tier: (values.tier as BrandUpdateRequest["tier"]) || undefined,
      status: (values.status as BrandUpdateRequest["status"]) || undefined,
    };

    const res = await updateBrandAction(brand.id as string, payload);
    setSubmitting(false);

    if (!res.ok) {
      setErrorMessage(res.message || "Gagal memperbarui data brand. Periksa koneksi dan coba lagi.");
    } else {
      setSuccessMessage("Data brand berhasil diperbarui.");
      router.refresh();
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setErrorMessage(null);

    const res = await deleteBrandAction(brand.id as string);
    setDeleting(false);

    if (!res.ok) {
      setErrorMessage(res.message || "Brand tidak dapat dihapus karena masih memiliki hotel aktif terikat.");
      setDeleteConfirmOpen(false);
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
                Edit Brand: {brand.name}
              </h1>
              <span className="font-mono text-xs bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded">
                {brand.code}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Perbarui profil, klasifikasi tier layanan, dan status operasional brand.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusPill tone={brand.status === "ACTIVE" ? "on" : brand.status === "INACTIVE" ? "wait" : "off"}>
            {brand.status}
          </StatusPill>
        </div>
      </div>

      {/* Alert Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-sm text-emerald-300 flex items-center gap-3 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-950/60 border border-rose-800/80 rounded-xl text-sm text-rose-300 flex items-start gap-3 shadow-lg animate-in fade-in">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-rose-200">Gagal Memproses Aksi</h4>
            <p className="text-xs text-rose-300/90 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* 2-Column Dedicated Layout: 7 cols Form + 5 cols Context & Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Form Utama (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-zinc-800/70 pb-3">
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Perbarui Informasi Brand
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Sesuaikan identitas nama, tier rubrik checklist, dan status operasional.
            </p>
          </div>

          <CavaForm
            fields={formFields}
            onSubmit={handleSubmit}
            config={{
              submitLabel: submitting ? "Memperbarui Data..." : "Simpan Perubahan Brand",
            }}
          />
        </div>

        {/* Kolom Kanan: Telemetri, Hotel Terhubung & Danger Zone (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 1: Ringkasan Properti Terhubung */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <Hotel className="w-4 h-4" />
                <h3 className="text-xs font-semibold tracking-wide uppercase">
                  Portofolio Hotel Terhubung
                </h3>
              </div>
              <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                {brand.hotels_count ?? 0} Unit
              </span>
            </div>

            {brand.hotels && brand.hotels.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {((brand.hotels ?? []) as BrandHotelSummary[]).map((h) => (
                  <div
                    key={h.id}
                    className="p-2.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono text-zinc-400 mr-2 text-[10px] bg-zinc-800/60 px-1.5 py-0.5 rounded">
                        {h.code}
                      </span>
                      <span className="text-zinc-200 font-medium">{h.name}</span>
                      {h.city && (
                        <p className="text-[11px] text-zinc-500 mt-0.5">{h.city}</p>
                      )}
                    </div>
                    <StatusPill tone={h.status === "ACTIVE" ? "on" : "wait"}>
                      {h.status}
                    </StatusPill>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-zinc-950/40 border border-zinc-800/50 rounded-xl text-xs text-zinc-500 text-center">
                Belum ada properti hotel yang dikaitkan ke brand ini.
              </div>
            )}
          </div>

          {/* Card 2: Dampak Tier terhadap Rubrik Checklist (PRD-F-01) */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <Sparkles className="w-4 h-4" />
              <h3 className="text-xs font-semibold tracking-wide uppercase">
                Pengaruh Tier Standar Layanan
              </h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Tier saat ini: <strong className="text-zinc-200">{brand.tier}</strong>. Mengubah tier brand ini akan memengaruhi filter pertanyaan checklist audit (PRD-F-01) untuk seluruh {brand.hotels_count ?? 0} properti yang terdaftar.
            </p>
          </div>

          {/* Card 3: Danger Zone */}
          <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center gap-2 text-rose-400">
              <Trash2 className="w-4 h-4" />
              <h3 className="text-xs font-semibold tracking-wide uppercase">
                Zona Bahaya
              </h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Hapus brand dari katalog korporat. Penghapusan akan ditolak otomatis oleh sistem jika masih terdapat properti hotel aktif yang terhubung.
            </p>
            <button
              type="button"
              onClick={() => setDeleteConfirmOpen(true)}
              className="w-full py-2 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Brand Ini</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 bg-rose-950/80 rounded-lg border border-rose-800/60">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  Hapus Brand: {brand.name}
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Kode: {brand.code}
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus brand ini? Tindakan ini akan melakukan *soft-delete* pada data master brand.
            </p>

            {brand.hotels_count && brand.hotels_count > 0 ? (
              <div className="p-3 bg-amber-950/60 border border-amber-800/60 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Perhatian: Brand ini memiliki {brand.hotels_count} properti hotel aktif. Penghapusan akan otomatis dibatalkan oleh backend demi menjaga integritas data relasional.
                </span>
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {deleting ? "Menghapus..." : "Konfirmasi Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BrandEditClient;
