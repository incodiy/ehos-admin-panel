"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CavaForm, type FieldSchema } from "@incodiy/cavaform";
import {
  Building2,
  DollarSign,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { crmCreateLeadAction } from "@/app/actions/crm";
import { useLanguage } from "@/context/LanguageContext";
import type { components } from "@/lib/api/openapi";

export interface HotelOption {
  id: string;
  code: string;
  name: string;
}

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

export function LeadCreateClient({
  hotels,
  provinces,
  users,
  activeHotelId,
  currentUserId,
}: {
  hotels: HotelOption[];
  provinces: ProvinceOption[];
  users: UserOption[];
  activeHotelId?: string;
  currentUserId?: string;
}) {
  const router = useRouter();
  const { language } = useLanguage();

  const initialHotel =
    hotels.find((h) => h.id === activeHotelId) ?? hotels[0] ?? null;
  const [selectedHotelId, setSelectedHotelId] = useState<string>(
    initialHotel?.id ?? ""
  );
  const [institutionType, setInstitutionType] = useState<string>("GOV");
  const [estimatedValue, setEstimatedValue] = useState<number>(75000000);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedHotel =
    hotels.find((h) => h.id === selectedHotelId) ?? initialHotel;

  const isGovernment = institutionType === "GOV";

  const fields: FieldSchema[] = [
    {
      name: "hotel_id",
      type: "select",
      label: language === "en" ? "Target Hotel Property *" : "Unit Hotel Pelaksana *",
      defaultValue: selectedHotelId,
      options: hotels.map((h) => ({
        label: `${h.code} — ${h.name}`,
        value: h.id,
      })),
      validation: { required: true },
    },
    {
      name: "company_name",
      type: "text",
      label: language === "en" ? "Organization / Company Name *" : "Nama Instansi / Perusahaan *",
      placeholder: language === "en" ? "e.g. PT Telekomunikasi Indonesia / Ministry of Finance" : "Contoh: PT Telkom Indonesia / Kementerian Keuangan RI",
      validation: { required: true, minLength: 3 },
    },
    {
      name: "institution_type",
      type: "select",
      label: language === "en" ? "Institution Category *" : "Klasifikasi Lembaga *",
      defaultValue: "GOV",
      options: INSTITUTION_TYPES,
      validation: { required: true },
    },
    {
      name: "source",
      type: "select",
      label: language === "en" ? "Acquisition Channel *" : "Saluran Akuisisi Lead *",
      defaultValue: "MANUAL",
      options: SOURCE_OPTIONS,
      validation: { required: true },
    },
    {
      name: "pic_name",
      type: "text",
      label: language === "en" ? "Contact Person (PIC)" : "Nama Narahubung (PIC)",
      placeholder: language === "en" ? "Full name of PIC" : "Nama lengkap pemesan/panitia",
    },
    {
      name: "pic_phone",
      type: "text",
      label: language === "en" ? "Phone / WhatsApp Number" : "Nomor Telepon / WhatsApp",
      placeholder: "081234567890",
    },
    {
      name: "pic_email",
      type: "text",
      label: language === "en" ? "Contact Email Address" : "Alamat Email PIC",
      placeholder: "pic@instansi.go.id",
    },
    {
      name: "province_id",
      type: "select",
      label: language === "en" ? "Origin / Jurisdiction Province" : "Wilayah / Provinsi Asal",
      defaultValue: "",
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
      label: language === "en" ? "Estimated Potential Value (IDR)" : "Estimasi Nilai Kontrak (IDR)",
      defaultValue: 75000000,
    },
    {
      name: "owner_id",
      type: "select",
      label: language === "en" ? "Assigned Sales Executive" : "Sales Executive Penanggung Jawab",
      defaultValue: currentUserId ?? "",
      options: [
        { label: language === "en" ? "— Select Sales Rep —" : "— Pilih Sales Rep —", value: "" },
        ...users.map((u) => ({
          label: `${u.name} (${u.email})`,
          value: u.id,
        })),
      ],
    },
  ];

  async function handleSubmit(values: Record<string, unknown>) {
    setSubmitting(true);
    setErrorMessage(null);

    const payload: components["schemas"]["LeadCreateRequest"] = {
      hotel_id: String(values.hotel_id || selectedHotelId),
      company_name: String(values.company_name || "").trim(),
      institution_type: (values.institution_type as "GOV" | "PRIVATE") || (institutionType as "GOV" | "PRIVATE") || "GOV",
      source: (values.source as "MANUAL" | "RFP_PORTAL" | "REFERRAL" | "CROSS_SELLING") || "MANUAL",
      pic_name: values.pic_name ? String(values.pic_name).trim() : undefined,
      pic_phone: values.pic_phone ? String(values.pic_phone).trim() : undefined,
      pic_email: values.pic_email ? String(values.pic_email).trim() : undefined,
      province_id: values.province_id ? String(values.province_id) : undefined,
      amount_est: values.amount_est ? Number(values.amount_est) : undefined,
      owner_id: values.owner_id ? String(values.owner_id) : undefined,
    };

    const res = await crmCreateLeadAction(payload);
    setSubmitting(false);

    if (res.ok) {
      router.push("/dashboard/crm/leads");
      router.refresh();
    } else {
      setErrorMessage(
        res.message || (language === "en" ? "Failed to create lead" : "Gagal membuat lead baru")
      );
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Kolom Kiri (8/12): Formulir Terstruktur CavaForm */}
      <div className="lg:col-span-8">
        <div className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-elegant backdrop-blur-xl">
          <div className="mb-6 border-b border-border/40 pb-4">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {language === "en" ? "Register New Business Lead" : "Registrasi Lead Bisnis Baru"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {language === "en"
                ? "Initiate a new opportunity in the CRM pipeline (PRD-F-07). Leads will start in LEAD status with SLA follow-up monitoring."
                : "Inisiasi peluang MICE / korporat baru ke dalam pipeline CRM (PRD-F-07). Status awal otomatis LEAD dengan pemantauan SLA follow-up."}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-xs font-medium text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <CavaForm
            fields={fields}
            onSubmit={handleSubmit}
            onChange={(vals) => {
              if (vals.hotel_id && String(vals.hotel_id) !== selectedHotelId) {
                setSelectedHotelId(String(vals.hotel_id));
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
                ? (language === "en" ? "Saving Lead..." : "Menyimpan Lead...")
                : (language === "en" ? "Create Business Lead" : "Simpan & Inisiasi Lead"),
              locale: language,
            }}
          />
        </div>
      </div>

      {/* Kolom Kanan (4/12): Panel Konteks & Regulasi SBM / FSM */}
      <div className="space-y-6 lg:col-span-4">
        {/* Unit & Target Summary */}
        <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-elegant backdrop-blur-xl">
          <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Building2 className="h-4 w-4 text-primary" />
            <span>{language === "en" ? "Target Property Context" : "Konteks Properti"}</span>
          </div>
          <div className="mt-3">
            <div className="text-base font-bold text-foreground">
              {selectedHotel?.name || "Semua Properti"}
            </div>
            <div className="mt-0.5 text-xs font-mono text-muted-foreground">
              Code: {selectedHotel?.code || "ALL"}
            </div>
          </div>
        </div>

        {/* SBM Government Rate Warning / Badge */}
        {isGovernment && (
          <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <ShieldCheck className="h-4 w-4" />
              <span>{language === "en" ? "PMK SBM Pagu Enforced" : "Kepatuhan SBM Standar Biaya"}</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {language === "en"
                ? "Institution belongs to Government/SOE sector (GOV). Quotations created for this lead will strictly validate against Ministry of Finance SBM ceiling rates (PRD-E-01/E-02)."
                : "Kategori instansi pemerintah/BUMN (GOV) tunduk pada regulasi PMK Standar Biaya Masukan. Quotation yang diterbitkan akan diverifikasi otomatis terhadap pagu regional."}
            </p>
          </div>
        )}

        {/* Pipeline & SLA Guide */}
        <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-elegant backdrop-blur-xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span>{language === "en" ? "FSM Pipeline Flow" : "Alur Tahapan Lead"}</span>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-3 text-xs">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                1
              </span>
              <div>
                <div className="font-semibold text-foreground">LEAD → CONTACTED</div>
                <div className="text-[11px] text-muted-foreground">
                  SLA response time 24 jam untuk follow-up pertama PIC.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 text-xs">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                2
              </span>
              <div>
                <div className="font-semibold text-foreground">CONTACTED → PROSPECT</div>
                <div className="text-[11px] text-muted-foreground">
                  Validasi pagu anggaran & terbitkan draft Penawaran Resmi (PDF ber-barcode).
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 text-xs">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                3
              </span>
              <div>
                <div className="font-semibold text-foreground">PROSPECT → CONFIRMED / LOST</div>
                <div className="text-[11px] text-muted-foreground">
                  Deal disetujui (CONFIRMED) atau catat alasan penolakan (LOST).
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estimation Glance */}
        <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-elegant backdrop-blur-xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <DollarSign className="h-4 w-4 text-primary" />
            <span>{language === "en" ? "Opportunity Value Glance" : "Ringkasan Potensi"}</span>
          </div>
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimasi Nilai Kontrak:</span>
              <span className="font-bold text-primary">
                Rp {estimatedValue.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
