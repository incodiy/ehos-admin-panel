"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  CheckCircle2,
  XCircle,
  Send,
  ShieldCheck,
  DollarSign,
  AlertTriangle,
  Receipt,
  FileCheck,
  Clock,
} from "lucide-react";
import { StatusPill } from "@/components/admin/data-table";
import {
  crmUpdateQuotationAction,
  crmGenerateQuotationPdfAction,
  type QuotationDetail,
} from "@/app/actions/quotations";
import { useLanguage } from "@/context/LanguageContext";

export function QuotationDetailClient({
  quotation,
}: {
  quotation: QuotationDetail;
}) {
  const router = useRouter();
  const { language } = useLanguage();

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(quotation.pdf_url ?? null);

  const fmtIDR = (n?: number | null) =>
    n == null
      ? "—"
      : new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(n);

  const fmtDate = (v?: string | null) =>
    v ? new Date(`${v}T00:00:00`).toLocaleDateString("id-ID", { dateStyle: "medium" }) : "—";

  const isPendingDiscount = quotation.discount_approval_status === "PENDING";
  const isDraft = quotation.status === "DRAFT";
  const isSent = quotation.status === "SENT";
  const isTerminal = quotation.status === "ACCEPTED" || quotation.status === "DECLINED";

  async function handleStatusChange(targetStatus: "SENT" | "ACCEPTED" | "DECLINED") {
    setErrorMessage(null);
    setLoadingAction(targetStatus);

    const res = await crmUpdateQuotationAction(quotation.id ?? "", {
      status: targetStatus,
    });
    setLoadingAction(null);

    if (res.ok) {
      router.refresh();
    } else {
      setErrorMessage(res.message || "Gagal memperbarui status penawaran");
    }
  }

  async function handleDiscountReview(decision: "APPROVED" | "REJECTED") {
    setErrorMessage(null);
    setLoadingAction(decision);

    const res = await crmUpdateQuotationAction(quotation.id ?? "", {
      discount_approval_status: decision,
    });
    setLoadingAction(null);

    if (res.ok) {
      router.refresh();
    } else {
      setErrorMessage(res.message || "Gagal memproses persetujuan diskon");
    }
  }

  async function handleGeneratePdf() {
    setErrorMessage(null);
    setLoadingAction("PDF");

    const res = await crmGenerateQuotationPdfAction(quotation.id ?? "");
    setLoadingAction(null);

    if (res.ok) {
      const data = res.data as { pdf_url?: string } | undefined;
      if (data?.pdf_url) {
        setPdfUrl(data.pdf_url);
        window.open(data.pdf_url, "_blank");
      }
      router.refresh();
    } else {
      setErrorMessage(res.message || "Gagal menerbitkan PDF proposal ber-barcode");
    }
  }

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-xs font-medium text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Header Info Bar */}
      <div className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-elegant backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-primary">
                {quotation.quotation_no}
              </span>
              <StatusPill tone={quotation.status === "ACCEPTED" ? "on" : quotation.status === "DECLINED" ? "off" : "wait"}>
                {quotation.status}
              </StatusPill>
              {isPendingDiscount && (
                <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  {language === "en" ? "GM Discount Pending" : "Diskon Menunggu Approval GM"}
                </span>
              )}
            </div>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-foreground">
              {quotation.event_name ?? "Proposal Penawaran MICE"}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {quotation.company_name} • Paket {quotation.package_type} • Tanggal Acara: {fmtDate(quotation.event_date)}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-muted-foreground">{language === "en" ? "Net Final Proposal" : "Total Nilai Penawaran"}</span>
            <div className="text-2xl font-black text-foreground">
              {fmtIDR(quotation.final_amount)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Kolom Kiri (8/12): Rincian Komersial, SBM Snapshot & Billing Milestones */}
        <div className="space-y-6 lg:col-span-8">
          {/* Card 1: Rincian Komersial & Pax */}
          <div className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-elegant backdrop-blur-xl">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <DollarSign className="h-4 w-4 text-primary" />
              <span>{language === "en" ? "Commercial Breakdown" : "Rincian Struktur Biaya"}</span>
            </h2>

            <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
              <div className="rounded-xl border border-border/40 bg-background/50 p-3">
                <span className="text-muted-foreground">{language === "en" ? "Gross Amount" : "Nilai Kotor"}</span>
                <p className="mt-1 font-mono font-bold text-foreground">{fmtIDR(quotation.gross_amount)}</p>
              </div>
              <div className="rounded-xl border border-border/40 bg-background/50 p-3">
                <span className="text-muted-foreground">{language === "en" ? "Discount Given" : "Diskon Diberikan"}</span>
                <p className="mt-1 font-mono font-bold text-destructive">
                  {quotation.discount_amount ? `-${fmtIDR(quotation.discount_amount)}` : "Rp 0"}
                </p>
              </div>
              <div className="rounded-xl border border-border/40 bg-background/50 p-3">
                <span className="text-muted-foreground">{language === "en" ? "Pax Count" : "Jumlah Peserta"}</span>
                <p className="mt-1 font-bold text-foreground">{quotation.pax_count ?? "—"} Pax</p>
              </div>
              <div className="rounded-xl border border-border/40 bg-background/50 p-3">
                <span className="text-muted-foreground">{language === "en" ? "Effective / Pax" : "Tarif / Pax"}</span>
                <p className="mt-1 font-mono font-bold text-primary">
                  {quotation.pax_count && quotation.gross_amount
                    ? fmtIDR(quotation.gross_amount / quotation.pax_count)
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: SBM Kemenkeu Snapshot (Constraint E3) */}
          <div className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-elegant backdrop-blur-xl">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>{language === "en" ? "SBM Snapshot Rate (Constraint E3)" : "Snapshot Pagu SBM Kemenkeu (E3)"}</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">{language === "en" ? "Budget Fiscal Year" : "Tahun Anggaran PMK"}</span>
                <span className="font-semibold text-foreground">{quotation.sbm_fiscal_year ?? "—"}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">{language === "en" ? "Locked SBM Rate / Pax" : "Pagu Terkunci per Pax"}</span>
                <span className="font-mono font-semibold text-foreground">
                  {quotation.sbm_rate_value ? `${fmtIDR(quotation.sbm_rate_value)} / pax` : "— (Bebas Pagu / Swasta)"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {language === "en"
                  ? "Snapshot E3 locks historical government rate permanently so future PMK revisions do not alter historical legal proposals."
                  : "Nilai tarif SBM Kemenkeu di-snapshot permanen pada proposal ini sehingga revisi PMK tahun depan tidak akan merusak konsistensi penawaran historis."}
              </p>
            </div>
          </div>

          {/* Card 3: Billing Milestones Linkage (PRD-F-10) */}
          <div className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-elegant backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Receipt className="h-4 w-4 text-primary" />
                <span>{language === "en" ? "Linked Billing Milestones (F-10)" : "Dokumen Dinas & Milestone Penagihan (F-10)"}</span>
              </h2>
              <span className="text-xs text-muted-foreground">
                {quotation.milestones?.length ?? 0} {language === "en" ? "milestones" : "dokumen"}
              </span>
            </div>

            {quotation.status !== "ACCEPTED" ? (
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-4 text-xs text-muted-foreground">
                <Clock className="h-5 w-5 shrink-0 text-muted-foreground" />
                <span>
                  {language === "en"
                    ? "Billing milestones (SPK, NPWP, BAST, LPJ) will unlock once this quotation is marked as ACCEPTED by the client."
                    : "Milestone penagihan dinas (SPK, NPWP, BAST, LPJ) akan otomatis aktif setelah proposal penawaran disetujui (ACCEPTED) oleh instansi pemesan."}
                </span>
              </div>
            ) : quotation.milestones && quotation.milestones.length > 0 ? (
              <div className="divide-y divide-border/40 text-xs">
                {quotation.milestones.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-3">
                    <div>
                      <span className="font-bold text-foreground">{m.milestone_type}</span>
                      <p className="text-[11px] text-muted-foreground">
                        {m.doc_no ? `No: ${m.doc_no}` : "Belum ada nomor dokumen"} • Jatuh Tempo: {fmtDate(m.due_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-medium text-foreground">{fmtIDR(m.amount)}</span>
                      <StatusPill tone={m.status === "PAID" ? "on" : m.status === "OVERDUE" ? "off" : "wait"}>
                        {m.status}
                      </StatusPill>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                {language === "en"
                  ? "Quotation is ACCEPTED. You can now register government documentation (SPK/BAST) from the Billing portal."
                  : "Penawaran telah ACCEPTED. Anda dapat mengunggah dokumen SPK/BAST pada portal Billing."}
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan (4/12): Action Hub, PDF Proposal & GM Approval */}
        <div className="space-y-6 lg:col-span-4">
          {/* Action Card 1: Official PDF Proposal */}
          <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-elegant backdrop-blur-xl">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {language === "en" ? "Official Proposal Document" : "Dokumen Proposal Ber-Kop"}
            </h3>

            <p className="mb-4 text-xs text-muted-foreground">
              {language === "en"
                ? "Generate official letterhead PDF with embedded Code39 Barcode for physical and digital verification (PRD-F-09)."
                : "Cetak dokumen resmi penawaran ber-kop hotel lengkap dengan barcode Code39 untuk verifikasi dinas (PRD-F-09)."}
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGeneratePdf}
                disabled={loadingAction === "PDF"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-smooth hover:opacity-90 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>
                  {loadingAction === "PDF"
                    ? (language === "en" ? "Rendering PDF..." : "Menerbitkan PDF...")
                    : pdfUrl
                    ? (language === "en" ? "Regenerate PDF" : "Cetak Ulang PDF")
                    : (language === "en" ? "Generate Official PDF" : "Terbitkan PDF Ber-Kop")}
                </span>
              </button>

              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border/80 bg-background/60 px-4 py-2 text-xs font-medium text-foreground transition-smooth hover:border-primary/50"
                >
                  <FileCheck className="h-4 w-4 text-emerald-500" />
                  <span>{language === "en" ? "Open PDF Document" : "Buka Berkas PDF"}</span>
                </a>
              )}
            </div>
          </div>

          {/* Action Card 2: GM Discount Review */}
          {isPendingDiscount && (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 shadow-elegant backdrop-blur-xl">
              <h3 className="mb-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                {language === "en" ? "General Manager Approval Required" : "Persetujuan Diskon GM Diperlukan"}
              </h3>
              <p className="mb-4 text-xs text-muted-foreground">
                {language === "en"
                  ? "Government MICE proposal offers commercial discount. General Manager authorization is required before sending to client."
                  : "Penawaran instansi pemerintah memuat diskon komersial. Memerlukan otorisasi GM sebelum dapat dikirimkan ke pemesan."}
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDiscountReview("APPROVED")}
                  disabled={loadingAction === "APPROVED"}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-smooth hover:bg-emerald-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{language === "en" ? "Approve" : "Setujui Diskon"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDiscountReview("REJECTED")}
                  disabled={loadingAction === "REJECTED"}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground shadow-sm transition-smooth hover:opacity-90 disabled:opacity-50"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>{language === "en" ? "Reject" : "Tolak"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Card 3: FSM Workflow Transitions */}
          {!isTerminal && (
            <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-elegant backdrop-blur-xl">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {language === "en" ? "Quotation Lifecycle (FSM)" : "Tahapan Alur Penawaran"}
              </h3>

              <div className="space-y-2">
                {isDraft && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange("SENT")}
                    disabled={loadingAction === "SENT" || isPendingDiscount}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition-smooth hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>
                      {isPendingDiscount
                        ? (language === "en" ? "Waiting GM Approval" : "Menunggu Approval GM")
                        : (language === "en" ? "Mark as Sent (SENT)" : "Kirim ke Klien (SENT)")}
                    </span>
                  </button>
                )}

                {isSent && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStatusChange("ACCEPTED")}
                      disabled={loadingAction === "ACCEPTED"}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-smooth hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{language === "en" ? "Client Accepted (ACCEPTED)" : "Tandai Disetujui Klien (ACCEPTED)"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange("DECLINED")}
                      disabled={loadingAction === "DECLINED"}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs font-semibold text-destructive transition-smooth hover:bg-destructive/20 disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>{language === "en" ? "Client Declined (DECLINED)" : "Tandai Ditolak Klien (DECLINED)"}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
