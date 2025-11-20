"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CavaForm, type FieldSchema } from "@incodiy/cavaform";
import {
  ListChecks,
  ArrowLeft,
  ShieldAlert,
  Info,
  CheckCircle2,
  Layers,
  Lock,
  Sparkles,
} from "lucide-react";
import {
  configCreateTemplateAction,
  type Department,
} from "@/app/actions/config";

export function ChecklistCreateClient() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formFields: FieldSchema[] = [
    {
      name: "department",
      label: "Departemen Audit",
      type: "select",
      options: [
        { label: "General Manager (GM)", value: "GM" },
        { label: "Housekeeping (HK)", value: "HOUSEKEEPING" },
        { label: "Kitchen & Food Beverage (FB)", value: "KITCHEN_FB" },
        { label: "Security & Risk Management (SRM)", value: "SECURITY_RISK" },
      ],
      validation: { required: true },
      placeholder: "Pilih Departemen",
    },
    {
      name: "name",
      label: "Nama Template Checklist",
      type: "text",
      placeholder: "Contoh: Housekeeping — Standard Room v2027",
      validation: { required: true, minLength: 3, maxLength: 255 },
    },
    {
      name: "version",
      label: "Nomor Versi (Semver/Tahun)",
      type: "text",
      placeholder: "Contoh: v2027.1",
      validation: { required: true, minLength: 1, maxLength: 20 },
    },
    {
      name: "brandTier",
      label: "Klasifikasi Brand Tier (Filter PRD-F-01)",
      type: "select",
      options: [
        { label: "Universal (Berlaku Semua Tier Brand)", value: "" },
        { label: "Luxury (MĀUA)", value: "Luxury" },
        { label: "Upscale (Swiss-Belhotel, Swiss-Belresidence)", value: "Upscale" },
        { label: "Boutique (Swiss-Belboutique, Heritage)", value: "Boutique" },
        { label: "Midscale (Swiss-Belinn, Swiss-Belcourt)", value: "Midscale" },
        { label: "Budget (Zest, Swiss-Belexpress)", value: "Budget" },
        { label: "Eco-Resort (Swiss-Belresort, Eco Suites)", value: "Eco-Resort" },
      ],
      placeholder: "Pilih Brand Tier (Opsional)",
    },
  ];

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    setErrorMessage(null);

    const department = String(values.department || "GM") as Department;
    const name = String(values.name || "").trim();
    const version = String(values.version || "").trim();
    const brandTier = values.brandTier ? String(values.brandTier) : null;

    try {
      const res = await configCreateTemplateAction({
        department,
        name,
        version,
        brandTier,
      });

      if (!res.ok) {
        setErrorMessage(
          res.message === "http_409"
            ? "Template dengan kombinasi Departemen, Nama, dan Versi ini sudah terdaftar."
            : res.message || "Gagal membuat template checklist."
        );
        setSubmitting(false);
        return;
      }

      const created = res.data as { id?: string } | undefined;
      if (created?.id) {
        router.push(`/dashboard/config/checklist/${created.id}/edit`);
      } else {
        router.push("/dashboard/config/checklist");
      }
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan jaringan.";
      setErrorMessage(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/config/checklist"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Bank Checklist
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ListChecks className="w-6 h-6 text-primary" />
            Tambah Template Checklist Baru
          </h1>
          <p className="text-sm text-muted-foreground">
            Inisialisasi template checklist draft untuk dikonfigurasi section dan item pertanyaannya.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive animate-in fade-in duration-200">
          <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold">Penyimpanan Gagal</p>
            <p className="text-destructive/90">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Primary Column (7 cols): CavaForm */}
        <div className="lg:col-span-7 bg-card border border-border/60 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="mb-6 border-b border-border/40 pb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Informasi & Metadata Template
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Template dibuat dengan status awal <strong>DRAFT</strong>. Setelah section dan butir pertanyaan lengkap, template dapat di-LOCK agar siap digunakan pada sesi audit.
            </p>
          </div>

          <CavaForm
            fields={formFields}
            onSubmit={handleSubmit}
            config={{
              submitLabel: submitting ? "Menyimpan Template..." : "Simpan & Lanjut ke Builder",
            }}
          />
        </div>

        {/* Secondary Column (5 cols): Contextual Architecture & Rules */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Versioning & Lock Immutability */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Immutable Versioning (B1-B3)</h3>
                <p className="text-xs text-muted-foreground">Prinsip snapshot anti-refactor</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground space-y-2 border-t border-border/40 pt-3">
              <p>
                Sesuai batasan arsitektur EHOS <strong>Constraint B1–B3</strong>:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                <li>
                  Setiap template berstatus <strong>DRAFT</strong> dapat diubah atau dihapus secara bebas.
                </li>
                <li>
                  Saat sesi audit pertama kali menggunakan template, status akan berubah menjadi <strong>LOCKED</strong> secara permanen.
                </li>
                <li>
                  Template yang sudah di-LOCK <strong>tidak dapat diubah</strong> agar skor historis audit tahun sebelumnya tetap otentik.
                </li>
                <li>
                  Pembaruan butir standar dilakukan dengan <strong>Fork New Version</strong> (mis. v2027.1 &rarr; v2027.2).
                </li>
              </ul>
            </div>
          </div>

          {/* Card 2: PRD-F-01 Brand Tier Fit */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Filter Brand Tier (PRD-F-01)</h3>
                <p className="text-xs text-muted-foreground">Standar dinamis per kelas hotel</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground space-y-2 border-t border-border/40 pt-3">
              <p>
                Checklist audit menyesuaikan klasifikasi properti:
              </p>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40 text-muted-foreground text-[11px] leading-relaxed">
                Contoh: Standar kamar <strong>MĀUA Ecoluxury (Luxury)</strong> mewajibkan fasilitas private plunge pool & amenities premium, sementara <strong>Zest Hotel (Budget)</strong> fokus pada standar efisiensi sanitasi dasar tanpa opsi N/A palsu.
              </div>
            </div>
          </div>

          {/* Card 3: Next Step Guide */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
              <Info className="w-4 h-4 text-sky-500" />
              Langkah Selanjutnya
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Setelah template berhasil disimpan, Anda akan langsung dialihkan ke <strong>Dedicated Checklist Builder</strong> untuk menyusun section kategori, butir pertanyaan inspeksi, dan penentuan bobot rubrik.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Auto-redirect ke Builder terintegrasi
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChecklistCreateClient;
