"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CavaForm, type FieldSchema } from "@incodiy/cavaform";
import {
  DollarSign,
  AlertCircle,
  TrendingUp,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { crmUpdateLeadAction } from "@/app/actions/crm";
import { useLanguage } from "@/context/LanguageContext";
import type { components } from "@/lib/api/openapi";

export interface ProvinceOption {
  id: string;
  code: string;
  name: string;
}

export interface UserOption {
  id: string;
  name: string;
  email: string;
}

export interface LeadDetail {
  id: string;
  lead_no: string;
  hotel_id: string;
  source: string;
  institution_type: string;
  company_name: string;
  pic_name?: string | null;
  pic_phone?: string | null;
  pic_email?: string | null;
  province_id?: string | null;
  status: string;
  lost_reason?: string | null;
  next_followup_at?: string | null;
  amount_est?: number | null;
  owner_id: string;
  created_at: string;
}

const INSTITUTION_TYPES = [
  { value: "GOV", label: "Pemerintah / BUMN / SBM Pagu (GOV)" },
  { value: "PRIVATE", label: "Swasta / Korporasi / Individu (PRIVATE)" },
];

const SOURCE_OPTIONS = [
  { value: "MANUAL", label: "Direct Sales / Walk-in / Manual" },
  { value: "RFP_PORTAL", label: "Portal RFP Publik (Frontpage)" },
  { value: "REFERRAL", label: "Referral Antar-Unit Hotel" },
  { value: "CROSS_SELLING", label: "Cross-Selling Corporate" },
];

const STATUS_OPTIONS = [
  { value: "LEAD", label: "LEAD — Inisiasi / Masuk Pertama Kali" },
  { value: "CONTACTED", label: "CONTACTED — Telah Dihubungi PIC" },
  { value: "PROSPECT", label: "PROSPECT — Prospek Terkualifikasi (Proposal Draft)" },
  { value: "CONFIRMED", label: "CONFIRMED — Kesepakatan Disetujui (Deal Won)" },
  { value: "LOST", label: "LOST — Batal / Kalah Bersaing" },
];

export function LeadEditClient({
  lead,
  provinces,
  users,
}: {
  lead: LeadDetail;
  provinces: ProvinceOption[];
  users: UserOption[];
}) {
  const router = useRouter();
  const { language } = useLanguage();

  const [currentStatus, setCurrentStatus] = useState<string>(lead.status);
  const [institutionType, setInstitutionType] = useState<string>(lead.institution_type);
  const [estimatedValue, setEstimatedValue] = useState<number>(lead.amount_est ?? 0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isGovernment = institutionType === "GOV";

  const fields: FieldSchema[] = [
    {
      name: "status",
      type: "select",
      label: language === "en" ? "Pipeline Stage (Status) *" : "Tahapan Pipeline (Status) *",
      defaultValue: currentStatus,
      options: STATUS_OPTIONS,
      validation: { required: true },
    },
    ...(currentStatus === "LOST"
      ? [
          {
            name: "lost_reason",
            type: "text" as const,
            label: language === "en" ? "Lost Reason (Mandatory when LOST) *" : "Alasan Penolakan / Gagal (Wajib jika LOST) *",
            placeholder: language === "en" ? "e.g. Budget ceiling cut, competitor offered lower rate" : "Contoh: Pagu dibatalkan instansi / memilih kompetitor",
            defaultValue: lead.lost_reason ?? "",
            validation: { required: true, minLength: 3 },
          },
        ]
      : []),
    {
      name: "company_name",
      type: "text",
      label: language === "en" ? "Organization / Company Name *" : "Nama Instansi / Perusahaan *",
      defaultValue: lead.company_name,
      validation: { required: true, minLength: 3 },
    },
    {
      name: "institution_type",
      type: "select",
      label: language === "en" ? "Institution Category *" : "Klasifikasi Lembaga *",
      defaultValue: institutionType,
      options: INSTITUTION_TYPES,
      validation: { required: true },
    },
    {
      name: "source",
      type: "select",
      label: language === "en" ? "Acquisition Channel *" : "Saluran Akuisisi Lead *",
      defaultValue: lead.source,
      options: SOURCE_OPTIONS,
      validation: { required: true },
    },
    {
      name: "pic_name",
      type: "text",
      label: language === "en" ? "Contact Person (PIC)" : "Nama Narahubung (PIC)",
      defaultValue: lead.pic_name ?? "",
    },
    {
      name: "pic_phone",
      type: "text",
      label: language === "en" ? "Phone / WhatsApp Number" : "Nomor Telepon / WhatsApp",
      defaultValue: lead.pic_phone ?? "",
    },
    {
      name: "pic_email",
      type: "text",
      label: language === "en" ? "Contact Email Address" : "Alamat Email PIC",
      defaultValue: lead.pic_email ?? "",
    },
    {
      name: "province_id",
      type: "select",
      label: language === "en" ? "Origin / Jurisdiction Province" : "Wilayah / Provinsi Asal",
      defaultValue: lead.province_id ?? "",
      options: [
        { label: language === "en" ? "— Select Province —" : "— Pilih Provinsi —", value: "" },
        ...provinces.map((p) => ({
          label: `${p.code} - ${p.name}`,
          value: p.id,
        })),
      ],
    },
    {
      name: "amount_est",
      type: "number",
      label: language === "en" ? "Estimated Contract Value (IDR)" : "Estimasi Nilai Kontrak (IDR)",
      defaultValue: lead.amount_est ?? 0,
    },
    {
      name: "owner_id",
      type: "select",
      label: language === "en" ? "Assigned Sales Executive" : "Sales Executive Penanggung Jawab",
      defaultValue: lead.owner_id,
      options: [
        ...users.map((u) => ({
          label: `${u.name} (${u.email})`,
          value: u.id,
        })),
      ],
      validation: { required: true },
    },
  ];

  async function handleSubmit(values: Record<string, unknown>) {
    setSubmitting(true);
    setErrorMessage(null);

    const payload: components["schemas"]["LeadUpdateRequest"] = {
      status: (values.status as "LEAD" | "CONTACTED" | "PROSPECT" | "CONFIRMED" | "LOST") || (currentStatus as "LEAD" | "CONTACTED" | "PROSPECT" | "CONFIRMED" | "LOST"),
      lost_reason: values.lost_reason ? String(values.lost_reason).trim() : null,
      company_name: String(values.company_name || lead.company_name).trim(),
      institution_type: (values.institution_type as "GOV" | "PRIVATE") || (institutionType as "GOV" | "PRIVATE") || "GOV",
      source: (values.source as "MANUAL" | "RFP_PORTAL" | "REFERRAL" | "CROSS_SELLING") || "MANUAL",
      pic_name: values.pic_name ? String(values.pic_name).trim() : undefined,
      pic_phone: values.pic_phone ? String(values.pic_phone).trim() : undefined,
      pic_email: values.pic_email ? String(values.pic_email).trim() : undefined,
      province_id: values.province_id ? String(values.province_id) : undefined,
      amount_est: values.amount_est ? Number(values.amount_est) : undefined,
      owner_id: values.owner_id ? String(values.owner_id) : undefined,
    };

    const res = await crmUpdateLeadAction(lead.id, payload);
    setSubmitting(false);

    if (res.ok) {
      router.push("/dashboard/crm/leads");
      router.refresh();
    } else {
      setErrorMessage(
        res.message || (language === "en" ? "Failed to update lead" : "Gagal memperbarui data lead")
      );
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Kolom Kiri (8/12): Form Terstruktur CavaForm */}
      <div className="lg:col-span-8">
        <div className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-elegant backdrop-blur-xl">
          <div className="mb-6 border-b border-border/40 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  {language === "en" ? "Update Lead Specification" : "Perbarui Data & Metadata Lead"}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {language === "en"
                    ? `Modifying record for ${lead.lead_no} — ${lead.company_name}`
                    : `Mengubah rincian arsip untuk ${lead.lead_no} — ${lead.company_name}`}
                </p>
              </div>
              <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-mono font-semibold text-primary">
                {lead.lead_no}
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-xs font-medium text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <CavaForm
            key={currentStatus}
            fields={fields}
            onSubmit={handleSubmit}
            onChange={(vals) => {
              if (vals.status && String(vals.status) !== currentStatus) {
                setCurrentStatus(String(vals.status));
              }
              if (vals.institution_type && String(vals.institution_type) !== institutionType) {
                setInstitutionType(String(vals.institution_type));
              }
              if (vals.amount_est && Number(vals.amount_est) !== estimatedValue) {
                setEstimatedValue(Number(vals.amount_est));
              }
            }}
            config={{
              columns: 1,
              submitLabel: submitting
                ? (language === "en" ? "Saving Changes..." : "Menyimpan Perubahan...")
                : (language === "en" ? "Save Lead Updates" : "Simpan Perubahan Lead"),
              locale: language,
            }}
          />
        </div>
      </div>

      {/* Kolom Kanan (4/12): Ringkasan Status & Aksi Terkait */}
      <div className="space-y-6 lg:col-span-4">
        {/* Status Card */}
        <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-elegant backdrop-blur-xl">
          <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span>{language === "en" ? "Current Stage" : "Tahapan Saat Ini"}</span>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-foreground">{currentStatus}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Terdaftar sejak {new Date(lead.created_at).toLocaleDateString("id-ID", { dateStyle: "medium" })}
            </p>
          </div>
        </div>

        {/* Action Shortcut: Buat Quotation */}
        <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-elegant backdrop-blur-xl">
          <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <FileText className="h-4 w-4 text-primary" />
            <span>{language === "en" ? "Quotation Issuance" : "Penerbitan Penawaran"}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {language === "en"
              ? "Draft an official proposal with SBM pagu verification and barcode security."
              : "Terbitkan surat penawaran resmi ber-kop dan barcode untuk lead ini."}
          </p>
          <div className="mt-4">
            <Link
              href={`/dashboard/crm/quotations/create?lead_id=${lead.id}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 border border-primary/30 py-2.5 text-xs font-semibold text-primary transition-smooth hover:bg-primary/20"
            >
              + Terbitkan Quotation Baru
            </Link>
          </div>
        </div>

        {/* SBM Notice */}
        {isGovernment && (
          <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <ShieldCheck className="h-4 w-4" />
              <span>Kepatuhan SBM Standar Biaya</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Perubahan estimasi nilai kontrak atau penawaran harus mematuhi pagu PMK SBM regional untuk kementerian/BUMN.
            </p>
          </div>
        )}

        {/* Opportunity Value Glance */}
        <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-elegant backdrop-blur-xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <DollarSign className="h-4 w-4 text-primary" />
            <span>Nilai Kontrak Terkini</span>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-primary">
              Rp {estimatedValue.toLocaleString("id-ID")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
