"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CavaForm, type FieldSchema } from "@incodiy/cavaform";
import {
  Building2,
  Clock,
  AlertCircle,
  Eye,
} from "lucide-react";
import { createCapaTicketAction } from "@/app/actions/capa";
import { useLanguage } from "@/context/LanguageContext";
import type { HotelOption, UserOption } from "./page";

const DEPT_OPTIONS = [
  { value: "GM", labelKey: "cfg.dept.GM" },
  { value: "HOUSEKEEPING", labelKey: "cfg.dept.HOUSEKEEPING" },
  { value: "KITCHEN_FB", labelKey: "cfg.dept.KITCHEN_FB" },
  { value: "SECURITY_RISK", labelKey: "cfg.dept.SECURITY_RISK" },
];

const PRIORITY_OPTIONS = [
  { value: "1", label: "P1 — Kritis / Life Safety (SLA: 1x24 Jam)" },
  { value: "2", label: "P2 — Major Operational (SLA: 2x24 Jam)" },
  { value: "3", label: "P3 — Minor Standard (SLA: 7 Hari)" },
];

export function CapaCreateClient({
  hotels,
  users,
  activeHotelId,
}: {
  hotels: HotelOption[];
  users: UserOption[];
  activeHotelId?: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const { language } = useLanguage();

  const initialHotel =
    hotels.find((h) => h.id === activeHotelId) ?? hotels[0] ?? null;
  const [selectedHotelId, setSelectedHotelId] = useState<string>(
    initialHotel?.id ?? ""
  );
  const [selectedPriority, setSelectedPriority] = useState<string>("2");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedHotel =
    hotels.find((h) => h.id === selectedHotelId) ?? initialHotel;

  const fields: FieldSchema[] = [
    {
      name: "hotel_id",
      type: "select",
      label: language === "en" ? "Target Hotel Property" : "Properti Hotel Target",
      defaultValue: selectedHotelId,
      options: hotels.map((h) => ({
        label: `${h.code} — ${h.name}`,
        value: h.id,
      })),
      validation: { required: true },
    },
    {
      name: "department",
      type: "select",
      label: language === "en" ? "Department" : "Departemen Operasional",
      defaultValue: "HOUSEKEEPING",
      options: DEPT_OPTIONS.map((d) => ({
        label: t(d.labelKey as never),
        value: d.value,
      })),
      validation: { required: true },
    },
    {
      name: "priority",
      type: "select",
      label: language === "en" ? "Priority & SLA Class" : "Prioritas & Kelas SLA",
      defaultValue: selectedPriority,
      options: PRIORITY_OPTIONS,
      validation: { required: true },
    },
    {
      name: "title",
      type: "text",
      label: language === "en" ? "Corrective Action Title" : "Judul Temuan / Tindakan Korektif",
      placeholder: language === "en" ? "e.g. Broken Fire Extinguisher Pin in Hallway B" : "Contoh: Kerusakan Pin APAR Koridor B",
      validation: { required: true, minLength: 5 },
    },
    {
      name: "description",
      type: "textarea",
      label: language === "en" ? "Issue Description & Context" : "Deskripsi Masalah & Rekomendasi",
      placeholder: language === "en" ? "Detail the hazard or non-compliance observed..." : "Jelaskan secara rinci kondisi temuan dan tindakan yang diperlukan...",
      validation: { required: true, minLength: 10 },
    },
    {
      name: "assigned_to",
      type: "select",
      label: language === "en" ? "Assign to Resolver (Optional)" : "Tugaskan ke Teknisi / Resolver (Opsional)",
      defaultValue: "",
      options: [
        { label: language === "en" ? "— Assign later (Status: OPEN) —" : "— Tugaskan Nanti (Status: OPEN) —", value: "" },
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

    const payload = {
      hotel_id: String(values.hotel_id || selectedHotelId),
      department: String(values.department || "HOUSEKEEPING"),
      priority: Number(values.priority || selectedPriority || 2),
      title: String(values.title || "").trim(),
      description: String(values.description || "").trim(),
      assigned_to: values.assigned_to ? String(values.assigned_to) : null,
    };

    const res = await createCapaTicketAction(payload);
    setSubmitting(false);

    if (res.ok) {
      router.push("/dashboard/capa");
      router.refresh();
    } else {
      setErrorMessage(
        res.message || (language === "en" ? "Failed to create CAPA ticket" : "Gagal membuat tiket CAPA")
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
              {language === "en" ? "New CAPA Ticket Registration" : "Pendaftaran Tiket CAPA Baru"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {language === "en"
                ? "Register a corrective and preventive action ticket for property operations (Whistleblower / Ad-hoc Intake)."
                : "Daftarkan tiket tindakan korektif & preventif untuk operasional properti (Laporan Bebas / Ad-hoc Intake)."}
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
              if (vals.priority && String(vals.priority) !== selectedPriority) {
                setSelectedPriority(String(vals.priority));
              }
            }}
            config={{
              columns: 1,
              submitLabel: submitting
                ? (language === "en" ? "Saving Ticket..." : "Menyimpan Tiket...")
                : (language === "en" ? "Create CAPA Ticket" : "Buat Tiket CAPA"),
              locale: language,
            }}
            locale={language}
          />
        </div>
      </div>

      {/* Kolom Kanan (4/12): Panel Konteks SLA & Four-Eyes Principle */}
      <div className="space-y-6 lg:col-span-4">
        {/* Card Properti Terpilih */}
        <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-elegant backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {language === "en" ? "Selected Property" : "Properti Terpilih"}
              </p>
              <h3 className="text-sm font-semibold text-foreground">
                {selectedHotel ? `${selectedHotel.code} — ${selectedHotel.name}` : "—"}
              </h3>
            </div>
          </div>

          {selectedHotel && (
            <div className="mt-4 space-y-2 border-t border-border/40 pt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === "en" ? "City" : "Kota"}:</span>
                <span className="font-medium text-foreground">{selectedHotel.city || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === "en" ? "Brand Tier" : "Tier Brand"}:</span>
                <span className="font-medium text-foreground">{selectedHotel.brand_tier || "Midscale"}</span>
              </div>
            </div>
          )}
        </div>

        {/* Card Matriks SLA */}
        <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-elegant backdrop-blur-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Clock className="h-4 w-4 text-primary" />
            <span>{language === "en" ? "SLA Resolution Deadlines" : "Ketentuan Batas Waktu SLA"}</span>
          </div>
          <div className="mt-4 space-y-3 text-xs">
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3">
              <span className="font-semibold text-destructive">Priority 1 (P1) — 1x24 Jam</span>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Khusus bahaya keselamatan jiwa (*Life-Safety*), kerusakan darurat, atau temuan audit kritis.
              </p>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
              <span className="font-semibold text-amber-500">Priority 2 (P2) — 2x24 Jam</span>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Kerusakan operasional utama yang berdampak pada kenyamanan tamu hotel.
              </p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
              <span className="font-semibold text-primary">Priority 3 (P3) — 7–14 Hari</span>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Ketidaksesuaian minor, perbaikan estetika berkala, dan pemeliharaan umum.
              </p>
            </div>
          </div>
        </div>

        {/* Card Alur Four-Eyes Verification */}
        <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-elegant backdrop-blur-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Eye className="h-4 w-4 text-primary" />
            <span>{language === "en" ? "Four-Eyes Principle Workflow" : "Alur Verifikasi Four-Eyes"}</span>
          </div>
          <ol className="mt-3 space-y-2.5 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">1</span>
              <span><strong>Penugasan:</strong> HOD/Teknisi ditugaskan (Status: <code className="text-primary">IN_PROGRESS</code>).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">2</span>
              <span><strong>Resolusi:</strong> Teknisi submit tindakan + foto bukti *AFTER* (Status: <code className="text-amber-500">AWAITING_GM</code>).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">3</span>
              <span><strong>Review GM:</strong> General Manager memverifikasi bukti perbaikan (Status: <code className="text-amber-500">AWAITING_QA</code>).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">4</span>
              <span><strong>Penutupan QA:</strong> Corporate QA menutup tiket resmi (Status: <code className="text-emerald-500">CLOSED</code>).</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
