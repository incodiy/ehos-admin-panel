"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CavaForm, type FieldSchema } from "@incodiy/cavaform";
import {
  FileText,
  Calculator,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
} from "lucide-react";
import { crmCreateQuotationAction } from "@/app/actions/quotations";
import { useLanguage } from "@/context/LanguageContext";

export interface LeadOption {
  id: string;
  lead_no: string;
  company_name: string;
  institution_type: string;
  hotel_id: string;
  amount_est?: number | null;
  status?: string;
  province_id?: string | null;
}

export interface HotelOption {
  id: string;
  code: string;
  name: string;
  province_id?: string;
}

export interface SbmRateOption {
  id: string;
  province_id: string;
  province_name?: string | null;
  package_type: string;
  max_rate_per_pax: number;
  fiscal_year: number;
  is_active: boolean;
}

const PACKAGE_OPTIONS = [
  { value: "FULLDAY", label: "Full Day Meeting (1x Makan, 2x Rehat Kopi)" },
  { value: "HALFDAY", label: "Half Day Meeting (1x Makan, 1x Rehat Kopi)" },
  { value: "FULLBOARD", label: "Full Board Meeting (Akomodasi + Makan Lengkap)" },
];

export function QuotationCreateClient({
  leads,
  hotels,
  sbmRates,
  preselectedLeadId,
}: {
  leads: LeadOption[];
  hotels: HotelOption[];
  sbmRates: SbmRateOption[];
  preselectedLeadId?: string;
}) {
  const router = useRouter();
  const { language } = useLanguage();

  const activeLeads = leads.filter((l) => l.status !== "LOST");
  const initialLead =
    activeLeads.find((l) => l.id === preselectedLeadId) ?? activeLeads[0] ?? null;

  const [selectedLeadId, setSelectedLeadId] = useState<string>(
    initialLead?.id ?? ""
  );
  const [packageType, setPackageType] = useState<string>("FULLDAY");
  const [paxCount, setPaxCount] = useState<number>(100);
  const [grossAmount, setGrossAmount] = useState<number>(
    initialLead?.amount_est ? Number(initialLead.amount_est) : 35000000
  );
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [eventDate, setEventDate] = useState<string>(
    new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedLead = activeLeads.find((l) => l.id === selectedLeadId) ?? initialLead;
  const targetHotel = hotels.find((h) => h.id === selectedLead?.hotel_id);

  // Kalkulasi SBM Rate dinamis
  const fiscalYear = eventDate ? new Date(eventDate).getFullYear() : new Date().getFullYear();
  const matchingSbm = sbmRates.find(
    (s) =>
      s.package_type === packageType &&
      s.fiscal_year === fiscalYear &&
      (targetHotel?.province_id ? s.province_id === targetHotel.province_id : true)
  );

  const effectivePerPax = paxCount > 0 ? grossAmount / paxCount : 0;
  const maxSbmRate = matchingSbm?.max_rate_per_pax ?? null;
  const isGovernment = selectedLead?.institution_type === "GOV";
  const isExceeded = isGovernment && maxSbmRate !== null && effectivePerPax > maxSbmRate;
  const finalAmount = Math.max(0, grossAmount - discountAmount);
  const isDiscountPending = isGovernment && discountAmount > 0;

  const fmtIDR = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);

  const fields: FieldSchema[] = [
    {
      name: "lead_id",
      type: "select",
      label: language === "en" ? "Target Lead / Client *" : "Target Prospek / Instansi Klien *",
      defaultValue: selectedLeadId,
      options: activeLeads.map((l) => ({
        label: `${l.lead_no} — ${l.company_name} (${l.institution_type})`,
        value: l.id,
      })),
      validation: { required: true },
    },
    {
      name: "event_name",
      type: "text",
      label: language === "en" ? "Event / Agenda Title *" : "Nama Agenda / Kegiatan MICE *",
      placeholder:
        language === "en"
          ? "e.g. Annual Strategic Planning Workshop"
          : "Contoh: Rapat Koordinasi dan Evaluasi Kinerja Tahunan",
      defaultValue: selectedLead?.company_name
        ? `${selectedLead.company_name} — Paket ${packageType}`
        : "",
      validation: { required: true, minLength: 3 },
    },
    {
      name: "event_date",
      type: "date",
      label: language === "en" ? "Event Date *" : "Tanggal Pelaksanaan Acara *",
      defaultValue: eventDate,
      validation: { required: true },
    },
    {
      name: "package_type",
      type: "select",
      label: language === "en" ? "MICE Meeting Package *" : "Paket Pertemuan MICE *",
      defaultValue: packageType,
      options: PACKAGE_OPTIONS,
      validation: { required: true },
    },
    {
      name: "pax_count",
      type: "number",
      label: language === "en" ? "Number of Participants (Pax) *" : "Jumlah Peserta (Pax) *",
      defaultValue: paxCount,
      placeholder: "100",
      validation: { required: true, min: 1, max: 10000 },
    },
    {
      name: "gross_amount",
      type: "number",
      label: language === "en" ? "Gross Package Proposal (IDR) *" : "Nilai Penawaran Kotor (Rp) *",
      defaultValue: grossAmount,
      placeholder: "35000000",
      validation: { required: true, min: 100000 },
    },
    {
      name: "discount_amount",
      type: "number",
      label: language === "en" ? "Commercial Discount (IDR)" : "Diskon Komersial (Rp)",
      defaultValue: discountAmount,
      placeholder: "0",
      validation: { min: 0 },
    },
  ];

  async function handleSubmit(formData: Record<string, unknown>) {
    setErrorMessage(null);

    if (isExceeded) {
      setErrorMessage(
        language === "en"
          ? `Proposal exceeds SBM rate ceiling (${fmtIDR(effectivePerPax)}/pax > ${fmtIDR(maxSbmRate!)}/pax). Government leads will be rejected with HTTP 409.`
          : `Penawaran melampaui batas pagu SBM Kemenkeu (${fmtIDR(effectivePerPax)}/pax > ${fmtIDR(maxSbmRate!)}/pax). Lead instansi pemerintah akan ditolak oleh sistem.`
      );
      return;
    }

    setSubmitting(true);
    const payload = {
      lead_id: String(formData.lead_id || selectedLeadId),
      event_date: String(formData.event_date || eventDate),
      event_name: String(formData.event_name || `${selectedLead?.company_name} — Paket ${packageType}`),
      package_type: String(formData.package_type || packageType) as "FULLDAY" | "HALFDAY" | "FULLBOARD",
      pax_count: Number(formData.pax_count || paxCount),
      gross_amount: Number(formData.gross_amount || grossAmount),
      discount_amount: Number(formData.discount_amount || discountAmount || 0),
    };

    const res = await crmCreateQuotationAction(payload);
    setSubmitting(false);

    if (res.ok) {
      router.push("/dashboard/crm/quotations");
      router.refresh();
    } else {
      setErrorMessage(
        res.message || (language === "en" ? "Failed to generate quotation" : "Gagal menerbitkan penawaran quotation")
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
              {language === "en" ? "Generate Official MICE Quotation" : "Penerbitan Proposal Penawaran MICE Resmi"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {language === "en"
                ? "Calculates live SBM compliance, locks financial snapshot (E3), and prepares official proposal with Code39 Barcode (PRD-F-09)."
                : "Validasi otomatis pagu SBM Kemenkeu, penguncian snapshot rate historis (E3), dan persiapan proposal resmi ber-barcode Code39 (PRD-F-09)."}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-xs font-medium text-destructive">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <CavaForm
            fields={fields}
            onSubmit={handleSubmit}
            onChange={(vals) => {
              if (vals.lead_id && String(vals.lead_id) !== selectedLeadId) {
                const newLead = activeLeads.find((l) => l.id === String(vals.lead_id));
                setSelectedLeadId(String(vals.lead_id));
                if (newLead?.amount_est) {
                  setGrossAmount(Number(newLead.amount_est));
                }
              }
              if (vals.package_type && String(vals.package_type) !== packageType) {
                setPackageType(String(vals.package_type));
              }
              if (vals.pax_count && Number(vals.pax_count) !== paxCount) {
                setPaxCount(Number(vals.pax_count));
              }
              if (vals.gross_amount && Number(vals.gross_amount) !== grossAmount) {
                setGrossAmount(Number(vals.gross_amount));
              }
              if (vals.discount_amount !== undefined && Number(vals.discount_amount) !== discountAmount) {
                setDiscountAmount(Number(vals.discount_amount));
              }
              if (vals.event_date && String(vals.event_date) !== eventDate) {
                setEventDate(String(vals.event_date));
              }
            }}
            config={{
              columns: 1,
              submitLabel: submitting
                ? (language === "en" ? "Generating Quotation..." : "Memproses Quotation...")
                : (language === "en" ? "Generate Official Quotation" : "Terbitkan Proposal Penawaran"),
              locale: language,
            }}
          />
        </div>
      </div>

      {/* Kolom Kanan (4/12): Live SBM Pagu Engine & Guidance Panel */}
      <div className="space-y-6 lg:col-span-4">
        {/* Panel 1: SBM Pagu Live Calculator */}
        <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-elegant backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Calculator className="h-4 w-4 text-primary" />
            <span>{language === "en" ? "SBM Compliance Engine" : "Kalkulator Kepatuhan SBM"}</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-muted-foreground">{language === "en" ? "Client Classification" : "Klasifikasi Klien"}</span>
              <span className="font-semibold text-foreground">
                {selectedLead?.institution_type === "GOV" ? "Pemerintah (GOV)" : "Swasta (PRIVATE)"}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-muted-foreground">{language === "en" ? "Target Property" : "Unit Hotel"}</span>
              <span className="font-medium text-foreground">
                {targetHotel ? `${targetHotel.code} — ${targetHotel.name}` : "—"}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-muted-foreground">{language === "en" ? "Effective Rate / Pax" : "Tarif Efektif / Pax"}</span>
              <span className={`font-semibold ${isExceeded ? "text-destructive" : "text-primary"}`}>
                {fmtIDR(effectivePerPax)} / pax
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-muted-foreground">{language === "en" ? "SBM Max Ceiling" : "Pagu Maksimum PMK"}</span>
              <span className="font-medium text-foreground">
                {maxSbmRate ? `${fmtIDR(maxSbmRate)} / pax` : "—"}
              </span>
            </div>

            {/* Status Indicator */}
            <div className="pt-2">
              {isExceeded ? (
                <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{language === "en" ? "EXCEEDS SBM CEILING" : "MELEBIHI PAGU SBM KEMENKEU"}</span>
                </div>
              ) : isGovernment ? (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>{language === "en" ? "COMPLIANT WITH SBM PAGU" : "SESUAI PAGU SBM KEMENKEU"}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-500/10 p-3 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{language === "en" ? "PRIVATE LEAD (SBM EXEMPT)" : "KORPORAT SWASTA (BEBAS SBM)"}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel 2: Financial Breakdown Summary */}
        <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-elegant backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileText className="h-4 w-4 text-primary" />
            <span>{language === "en" ? "Commercial Summary" : "Ringkasan Finansial"}</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>{language === "en" ? "Gross Value:" : "Nilai Kotor:"}</span>
              <span className="font-mono text-foreground">{fmtIDR(grossAmount)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{language === "en" ? "Discount:" : "Potongan Diskon:"}</span>
              <span className="font-mono text-destructive">
                {discountAmount > 0 ? `-${fmtIDR(discountAmount)}` : "Rp 0"}
              </span>
            </div>
            <div className="flex justify-between border-t border-border/50 pt-2 text-sm font-bold text-foreground">
              <span>{language === "en" ? "Net Final Amount:" : "Total Nilai Bersih:"}</span>
              <span className="font-mono text-primary">{fmtIDR(finalAmount)}</span>
            </div>
          </div>

          {isDiscountPending && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {language === "en"
                  ? "Discount on government leads requires General Manager approval before sending."
                  : "Pemberian diskon pada instansi dinas memerlukan approval GM sebelum dapat dikirim."}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
