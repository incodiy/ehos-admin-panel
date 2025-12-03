"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CavaForm, type FieldSchema } from "@incodiy/cavaform";
import {
  FileCheck,
  Building2,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { crmCreateBillingMilestoneAction } from "@/app/actions/billing";
import { useLanguage } from "@/context/LanguageContext";

export interface AcceptedQuotationOption {
  id: string;
  quotation_no: string;
  hotel_id?: string;
  hotel_name?: string | null;
  hotel_code?: string | null;
  event_name?: string | null;
  event_date?: string | null;
  package_type?: string;
  pax_count?: number | null;
  final_amount?: number;
  status?: string;
}

const MILESTONE_DESCRIPTIONS: Record<string, { id: string; en: string }> = {
  SPK: {
    id: "Surat Perintah Kerja (SPK) — Dokumen penugasan resmi dari Pejabat Pembuat Komitmen (PPK) instansi pemerintah ke pihak hotel.",
    en: "Work Order (SPK) — Official engagement document issued by Government Commitment Officer (PPK).",
  },
  NPWP: {
    id: "NPWP & Berkas Perpajakan — Verifikasi identitas pajak bendahara instansi pemotong PPh Pasal 23 / PPh Final.",
    en: "Tax Registration (NPWP) — Official tax identification of government disbursement unit for tax withholding.",
  },
  BAST: {
    id: "Berita Acara Serah Terima (BAST) — Dokumen serah terima pekerjaan MICE setelah kegiatan selesai dilaksanakan.",
    en: "Handover Acceptance (BAST) — Confirmation of completion signed by both hotel management and government official.",
  },
  LPJ: {
    id: "Laporan Pertanggungjawaban (LPJ) — Kelengkapan bukti fisik (rundown, foto, daftar hadir) untuk pencairan SP2D APBN/APBD.",
    en: "Accountability Report (LPJ) — Supporting evidence compilation for government budget disbursement.",
  },
};

export function BillingCreateClient({
  quotations,
  preselectedQuotationId,
}: {
  quotations: AcceptedQuotationOption[];
  preselectedQuotationId?: string;
}) {
  const router = useRouter();
  const { language } = useLanguage();

  const initialQuotation =
    quotations.find((q) => q.id === preselectedQuotationId) ?? quotations[0] ?? null;

  const [selectedQuotationId, setSelectedQuotationId] = useState<string>(
    initialQuotation?.id ?? ""
  );
  const [milestoneType, setMilestoneType] = useState<string>("SPK");
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]
  );
  const [amount, setAmount] = useState<number>(
    initialQuotation?.final_amount ?? 0
  );
  const [docNo, setDocNo] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeQuotation =
    quotations.find((q) => q.id === selectedQuotationId) ?? initialQuotation;

  const fmtIDR = (val?: number | null) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val ?? 0);

  const fmtDate = (val?: string | null) =>
    val ? new Date(val.includes("T") ? val : `${val}T00:00:00`).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }) : "—";

  const fields: FieldSchema[] = [
    {
      name: "quotation_id",
      label: language === "en" ? "Accepted Quotation *" : "Proposal Penawaran (ACCEPTED) *",
      type: "select",
      options: quotations.map((q) => ({
        value: q.id,
        label: `${q.quotation_no} — ${q.hotel_code ?? "HOTEL"} (${q.event_name ?? "Kegiatan"}) • ${fmtIDR(q.final_amount)}`,
      })),
      defaultValue: selectedQuotationId,
      validation: { required: true },
    },
    {
      name: "milestone_type",
      label: language === "en" ? "Document Milestone Type *" : "Jenis Dokumen Dinas *",
      type: "select",
      options: [
        { value: "SPK", label: "SPK (Surat Perintah Kerja)" },
        { value: "NPWP", label: "NPWP / Berkas Pajak Bendahara" },
        { value: "BAST", label: "BAST (Berita Acara Serah Terima)" },
        { value: "LPJ", label: "LPJ (Laporan Pertanggungjawaban)" },
      ],
      defaultValue: milestoneType,
      validation: { required: true },
    },
    {
      name: "due_date",
      label: language === "en" ? "Due Date (F-10 Auto-Reminder Target) *" : "Batas Waktu Penagihan (Jatuh Tempo) *",
      type: "date",
      defaultValue: dueDate,
      validation: { required: true },
    },
    {
      name: "amount",
      label: language === "en" ? "Billing Amount (IDR)" : "Nominal Tagihan Dokumen (IDR)",
      type: "number",
      defaultValue: amount,
    },
    {
      name: "doc_no",
      label: language === "en" ? "Official Document Number (Optional)" : "Nomor Surat/Dokumen Dinas (Opsional)",
      type: "text",
      defaultValue: docNo,
      placeholder: language === "en" ? "e.g. 027/SPK-MICE/KEMENKEU/2026" : "Contoh: 027/SPK-MICE/KEMENKEU/2026",
    },
  ];

  const handleSubmit = async (formData: Record<string, unknown>) => {
    setSubmitting(true);
    setErrorMessage(null);

    const payload = {
      quotation_id: String(formData.quotation_id || selectedQuotationId),
      milestone_type: String(formData.milestone_type || milestoneType) as "SPK" | "NPWP" | "BAST" | "LPJ",
      due_date: String(formData.due_date || dueDate),
      amount: formData.amount ? Number(formData.amount) : amount || null,
      doc_no: formData.doc_no ? String(formData.doc_no).trim() : docNo ? docNo.trim() : null,
    };

    if (!payload.quotation_id) {
      setErrorMessage(
        language === "en"
          ? "Please select an accepted quotation"
          : "Pilih proposal penawaran (ACCEPTED) terlebih dahulu"
      );
      setSubmitting(false);
      return;
    }

    const res = await crmCreateBillingMilestoneAction(payload);
    setSubmitting(false);

    if (res.ok) {
      router.push("/dashboard/crm/billing");
      router.refresh();
    } else {
      setErrorMessage(
        res.message ||
          (language === "en"
            ? "Failed to register billing milestone"
            : "Gagal mendaftarkan milestone penagihan dinas")
      );
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Kolom Kiri (8/12): Form Registrasi CavaForm */}
      <div className="space-y-6 lg:col-span-8">
        <div className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-elegant backdrop-blur-xl">
          <div className="mb-6 flex items-center justify-between border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  {language === "en" ? "Government Procurement Milestone Form" : "Formulir Milestone Dokumen Dinas"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {language === "en"
                    ? "PRD-F-10: Register SPK, NPWP, BAST, or LPJ requirements for accepted MICE quotations."
                    : "PRD-F-10: Registrasi kewajiban dokumen SPK, NPWP, BAST, atau LPJ per penawaran berstatus ACCEPTED."}
                </p>
              </div>
            </div>
            <span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] font-semibold text-primary">
              PRD-F-10
            </span>
          </div>

          {errorMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {quotations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              <AlertCircle className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
              <p className="font-semibold text-foreground">
                {language === "en" ? "No Accepted Quotations Found" : "Tidak Ada Proposal Berstatus ACCEPTED"}
              </p>
              <p className="mt-1">
                {language === "en"
                  ? "Milestones can only be created for winning quotations (status ACCEPTED). Please approve/accept a quotation first."
                  : "Dokumen penagihan hanya dapat dibuat untuk penawaran berstatus ACCEPTED (alur menang). Silakan setujui quotation terlebih dahulu."}
              </p>
            </div>
          ) : (
            <CavaForm
              fields={fields}
              onSubmit={handleSubmit}
              onChange={(vals) => {
                if (vals.quotation_id && String(vals.quotation_id) !== selectedQuotationId) {
                  const qid = String(vals.quotation_id);
                  setSelectedQuotationId(qid);
                  const match = quotations.find((q) => q.id === qid);
                  if (match?.final_amount) {
                    setAmount(match.final_amount);
                  }
                }
                if (vals.milestone_type && String(vals.milestone_type) !== milestoneType) {
                  setMilestoneType(String(vals.milestone_type));
                }
                if (vals.due_date && String(vals.due_date) !== dueDate) {
                  setDueDate(String(vals.due_date));
                }
                if (vals.amount !== undefined && Number(vals.amount) !== amount) {
                  setAmount(Number(vals.amount));
                }
                if (vals.doc_no !== undefined && String(vals.doc_no) !== docNo) {
                  setDocNo(String(vals.doc_no));
                }
              }}
              config={{
                columns: 1,
                submitLabel: submitting
                  ? (language === "en" ? "Saving Milestone..." : "Mendaftarkan Dokumen...")
                  : (language === "en" ? "Register Milestone" : "Daftarkan Dokumen Dinas"),
                locale: language,
              }}
            />
          )}
        </div>
      </div>

      {/* Kolom Kanan (4/12): Panel Informasi & Panduan Dinas */}
      <div className="space-y-6 lg:col-span-4">
        {/* Card 1: Quotation Ringkasan */}
        <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-elegant backdrop-blur-xl">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Building2 className="h-4 w-4 text-primary" />
            <span>{language === "en" ? "Selected Proposal Context" : "Konteks Proposal Terpilih"}</span>
          </h3>

          {activeQuotation ? (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">{language === "en" ? "Quotation No" : "Nomor Penawaran"}</span>
                <span className="font-mono font-semibold text-foreground">{activeQuotation.quotation_no}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">{language === "en" ? "Hotel Unit" : "Unit Hotel"}</span>
                <span className="font-medium text-foreground">{activeQuotation.hotel_code ?? activeQuotation.hotel_name ?? "—"}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">{language === "en" ? "Event / Activity" : "Nama Kegiatan"}</span>
                <span className="font-medium text-foreground text-right">{activeQuotation.event_name ?? "—"}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">{language === "en" ? "Event Date" : "Tanggal Acara"}</span>
                <span className="text-foreground">{fmtDate(activeQuotation.event_date)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">{language === "en" ? "Total Approved" : "Total Nilai Disetujui"}</span>
                <span className="font-mono text-sm font-bold text-primary">{fmtIDR(activeQuotation.final_amount)}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {language === "en" ? "Select a quotation to view commercial details." : "Pilih penawaran untuk melihat rincian komersial."}
            </p>
          )}
        </div>

        {/* Card 2: Panduan Dokumen Dinas */}
        <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-elegant backdrop-blur-xl">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <HelpCircle className="h-4 w-4 text-primary" />
            <span>{language === "en" ? "Document Type Standard" : "Standar Dokumen Dinas"}</span>
          </h3>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
            <span className="font-bold text-primary">{milestoneType}</span>
            <p className="mt-1 text-muted-foreground">
              {MILESTONE_DESCRIPTIONS[milestoneType]?.[language] ?? MILESTONE_DESCRIPTIONS[milestoneType]?.id}
            </p>
          </div>

          <div className="mt-4 space-y-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              <span>SPK & BAST wajib diverifikasi sebelum invoice diterbitkan.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              <span>Auto-reminder aktif 14 hari sebelum jatuh tempo ke Finance & GM.</span>
            </div>
          </div>
        </div>

        {/* Card 3: Kebijakan Imutabilitas Finansial */}
        <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-elegant backdrop-blur-xl">
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-success" />
            <span>{language === "en" ? "Financial Immutability (ERD v1.3)" : "Imutabilitas Finansial (ERD v1.3)"}</span>
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {language === "en"
              ? "Billing milestones represent legal accounting audit trails. Once recorded as PAID, status cannot be revoked. Deletions are strictly prohibited."
              : "Milestone penagihan dinas merupakan jejak audit akuntansi hukum. Setelah berstatus LUNAS (PAID), status tidak dapat ditarik mundur dan data dilarang dihapus."}
          </p>
        </div>
      </div>
    </div>
  );
}
