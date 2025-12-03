"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusPill } from "@/components/admin/data-table";
import {
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileCheck,
  Download,
  ExternalLink,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { crmUpdateBillingMilestoneAction, type BillingMilestone } from "@/app/actions/billing";
import { useLanguage } from "@/context/LanguageContext";

export function BillingDetailClient({
  milestone: initialMilestone,
}: {
  milestone: BillingMilestone;
}) {
  const router = useRouter();
  const { language } = useLanguage();
  const [milestone, setMilestone] = useState<BillingMilestone>(initialMilestone);
  const [docNo, setDocNo] = useState<string>(milestone.doc_no ?? "");
  const [docKey, setDocKey] = useState<string>(milestone.doc_key ?? "");
  const [saving, setSaving] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [showPaidConfirm, setShowPaidConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isPaid = milestone.status === "PAID";
  const isOverdue = milestone.status === "OVERDUE";

  const fmtIDR = (val?: number | null) =>
    val == null
      ? "—"
      : new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(val);

  const fmtDate = (val?: string | null) =>
    val
      ? new Date(val.includes("T") ? val : `${val}T00:00:00`).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "—";

  const fmtDateTime = (val?: string | null) =>
    val
      ? new Date(val).toLocaleString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const handleSaveDocument = async () => {
    setSaving(true);
    setMessage(null);

    const trimmedDocKey = docKey.trim() || null;
    const trimmedDocNo = docNo.trim() || null;

    // FSM rule: transisi ke UPLOADED bila doc_key baru diisi pada status EXPECTED/OVERDUE
    let targetStatus = milestone.status;
    if (trimmedDocKey && (milestone.status === "EXPECTED" || milestone.status === "OVERDUE")) {
      targetStatus = "UPLOADED";
    }

    const payload = {
      doc_no: trimmedDocNo,
      doc_key: trimmedDocKey,
      status: targetStatus,
    };

    if (!milestone.id) return;
    const res = await crmUpdateBillingMilestoneAction(milestone.id, payload);
    setSaving(false);

    if (res.ok && res.data) {
      setMilestone(res.data);
      setMessage({
        type: "success",
        text: language === "en" ? "Document details updated successfully" : "Dokumen dinas berhasil disimpan",
      });
      router.refresh();
    } else {
      setMessage({
        type: "error",
        text: res.message || (language === "en" ? "Failed to update document" : "Gagal memperbarui dokumen dinas"),
      });
    }
  };

  const handleMarkPaid = async () => {
    if (!milestone.id) return;
    setMarkingPaid(true);
    setMessage(null);

    const res = await crmUpdateBillingMilestoneAction(milestone.id, {
      status: "PAID",
      paid_at: new Date().toISOString(),
      doc_no: docNo.trim() || milestone.doc_no,
      doc_key: docKey.trim() || milestone.doc_key,
    });

    setMarkingPaid(false);
    setShowPaidConfirm(false);

    if (res.ok && res.data) {
      setMilestone(res.data);
      setMessage({
        type: "success",
        text: language === "en" ? "Milestone marked as PAID (terminal status)" : "Milestone berhasil ditandai LUNAS (PAID)",
      });
      router.refresh();
    } else {
      setMessage({
        type: "error",
        text: res.message || (language === "en" ? "Failed to mark as paid" : "Gagal menandai lunas"),
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Feedback */}
      {message && (
        <div
          className={`flex items-start gap-3 rounded-2xl border p-4 text-xs font-medium ${
            message.type === "success"
              ? "border-success/30 bg-success/10 text-success"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Kolom Kiri (8/12): Form Dokumen & Aksi FSM */}
        <div className="space-y-6 lg:col-span-8">
          {/* Card 1: Status Banner */}
          <div className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-elegant backdrop-blur-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-foreground">
                      {milestone.milestone_type} — {milestone.quotation_no ?? "Quotation"}
                    </h2>
                    <StatusPill tone={isPaid ? "on" : isOverdue ? "off" : "wait"}>
                      {milestone.status}
                    </StatusPill>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {milestone.hotel_name ?? milestone.hotel_code ?? "Swiss-Belhotel"} • {milestone.event_name ?? "Kegiatan MICE"}
                  </p>
                </div>
              </div>

              {isPaid && (
                <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
                  <Lock className="h-3.5 w-3.5" />
                  <span>{language === "en" ? "Terminal (Paid)" : "Status Terminal (Lunas)"}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Pengelolaan Dokumen & Lampiran */}
          <div className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-elegant backdrop-blur-xl">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span>{language === "en" ? "Document Attachment & Physical Filing" : "Berkas & Nomor Dokumen Resmi"}</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  {language === "en" ? "Official Document Number" : "Nomor Surat/Dokumen Resmi"}
                </label>
                <input
                  type="text"
                  disabled={isPaid}
                  value={docNo}
                  onChange={(e) => setDocNo(e.target.value)}
                  placeholder={language === "en" ? "e.g. 027/SPK-MICE/KEMENKEU/2026" : "Contoh: 027/SPK-MICE/KEMENKEU/2026"}
                  className="w-full rounded-xl border border-border/70 bg-background/80 px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Nomor register fisik yang tertera pada lembar dokumen bertandatangan basah/elektronik.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  {language === "en" ? "Storage Object Key (doc_key)" : "Kunci Berkas Object Storage (doc_key)"}
                </label>
                <input
                  type="text"
                  disabled={isPaid}
                  value={docKey}
                  onChange={(e) => setDocKey(e.target.value)}
                  placeholder="billing/Q-8D-SQYO-03/SPK.pdf"
                  className="w-full font-mono rounded-xl border border-border/70 bg-background/80 px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Path penyimpanan dokumen PDF/scan pada MinIO/S3 private bucket. Wajib diisi untuk status UPLOADED.
                </p>
              </div>

              {!isPaid && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveDocument}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-smooth hover:opacity-90 disabled:opacity-50"
                  >
                    <FileCheck className="h-4 w-4" />
                    <span>{saving ? (language === "en" ? "Saving..." : "Menyimpan...") : (language === "en" ? "Save Document Changes" : "Simpan Perubahan Dokumen")}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Aksi Pelunasan (PAID Terminal) */}
          <div className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-elegant backdrop-blur-xl">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>{language === "en" ? "Financial Settlement Action" : "Aksi Pelunasan Finansial"}</span>
            </h3>

            {isPaid ? (
              <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-xs">
                <div className="flex items-center gap-2 font-bold text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{language === "en" ? "Payment Settled & Closed" : "Tagihan Telah Dilunasi"}</span>
                </div>
                <p className="mt-1 text-muted-foreground">
                  Pembayaran resmi tercatat pada <strong>{fmtDateTime(milestone.paid_at)}</strong>. Berdasarkan aturan imutabilitas finansial PRD-F-10, transaksi yang telah lunas tidak dapat diubah kembali.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Setelah dana SP2D / transfer instansi pemerintah efektif masuk ke rekening hotel, tandai milestone ini sebagai <strong>LUNAS (PAID)</strong>.
                </p>

                {showPaidConfirm ? (
                  <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-xs space-y-3">
                    <p className="font-semibold text-foreground">
                      {language === "en"
                        ? "Are you sure you want to mark this milestone as PAID?"
                        : "Konfirmasi: Anda yakin ingin menandai milestone ini sebagai LUNAS (PAID)?"}
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      Aksi ini bersifat <strong>terminal dan permanen</strong>. Status tidak dapat ditarik mundur atau dibatalkan pasca-konfirmasi.
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={handleMarkPaid}
                        disabled={markingPaid}
                        className="rounded-xl bg-success px-4 py-2 text-xs font-bold text-success-foreground shadow-sm transition-smooth hover:opacity-90 disabled:opacity-50"
                      >
                        {markingPaid ? "Memproses..." : "Ya, Tandai LUNAS (PAID)"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPaidConfirm(false)}
                        className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-background/80"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPaidConfirm(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-success px-5 py-2.5 text-xs font-bold text-success-foreground shadow-sm transition-smooth hover:opacity-90"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{language === "en" ? "Mark as PAID (Finalize)" : "Tandai LUNAS (PAID)"}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan (4/12): Ringkasan Finansial & Link Dokumen */}
        <div className="space-y-6 lg:col-span-4">
          {/* Card 1: Ringkasan Nilai */}
          <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-elegant backdrop-blur-xl">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {language === "en" ? "Milestone Valuation" : "Nilai Nominal Tagihan"}
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">{language === "en" ? "Document Type" : "Jenis Dokumen"}</span>
                <span className="font-bold text-foreground">{milestone.milestone_type}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">{language === "en" ? "Due Date" : "Jatuh Tempo"}</span>
                <span className={`font-medium ${isOverdue ? "text-destructive font-bold" : "text-foreground"}`}>
                  {fmtDate(milestone.due_date)} {isOverdue && "(OVERDUE)"}
                </span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">{language === "en" ? "Settled At" : "Tanggal Lunas"}</span>
                <span className="text-foreground">{fmtDateTime(milestone.paid_at)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">{language === "en" ? "Milestone Amount" : "Nominal"}</span>
                <span className="font-mono text-sm font-bold text-primary">{fmtIDR(milestone.amount)}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Parent Quotation Link */}
          <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-elegant backdrop-blur-xl">
            <h3 className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>{language === "en" ? "Parent Quotation" : "Proposal Penawaran Induk"}</span>
              <Building2 className="h-4 w-4 text-primary" />
            </h3>

            <div className="space-y-2 text-xs">
              <p className="font-mono font-bold text-foreground">{milestone.quotation_no ?? "—"}</p>
              <p className="text-muted-foreground">{milestone.hotel_name ?? milestone.hotel_code ?? "—"}</p>
              <p className="text-muted-foreground">{milestone.event_name ?? "—"}</p>

              <div className="pt-2">
                <Link
                  href={`/dashboard/crm/quotations/${milestone.quotation_id}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-xs font-semibold text-primary transition-smooth hover:bg-background"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>{language === "en" ? "View Quotation Detail" : "Buka Detail Quotation"}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Card 3: Dokumen Resmi Terlampir */}
          <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-elegant backdrop-blur-xl">
            <h3 className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>{language === "en" ? "Attached Physical File" : "Berkas Lampiran Resmi"}</span>
              <FileText className="h-4 w-4 text-primary" />
            </h3>

            {milestone.doc_url ? (
              <div className="space-y-3 text-xs">
                <p className="text-muted-foreground text-[11px]">
                  Berkas lampiran aktif tersedia di object storage.
                </p>
                <a
                  href={milestone.doc_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-smooth hover:opacity-90"
                >
                  <Download className="h-4 w-4" />
                  <span>{language === "en" ? "Open / Download Document" : "Buka / Unduh Berkas Lampiran"}</span>
                </a>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                <p>Belum ada berkas terunggah.</p>
                <p className="text-[11px] mt-1">Isi Kunci Berkas (doc_key) untuk melampirkan berkas resmi.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
