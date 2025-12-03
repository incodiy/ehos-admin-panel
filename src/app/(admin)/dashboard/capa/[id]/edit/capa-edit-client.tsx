"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CavaForm, type FieldSchema } from "@incodiy/cavaform";
import {
  Clock,
  AlertCircle,
  Hash,
} from "lucide-react";
import { updateCapaTicketAction, type CapaTicketDetail } from "@/app/actions/capa";
import { useLanguage } from "@/context/LanguageContext";
import type { UserOption } from "./page";

const PRIORITY_OPTIONS = [
  { value: "1", label: "P1 — Kritis / Life Safety (SLA: 1x24 Jam)" },
  { value: "2", label: "P2 — Major Operational (SLA: 2x24 Jam)" },
  { value: "3", label: "P3 — Minor Standard (SLA: 7 Hari)" },
];

export function CapaEditClient({
  ticket,
  users,
}: {
  ticket: CapaTicketDetail;
  users: UserOption[];
}) {
  const router = useRouter();
  const { language } = useLanguage();

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fields: FieldSchema[] = [
    {
      name: "title",
      type: "text",
      label: language === "en" ? "Ticket Title" : "Judul Tiket CAPA",
      defaultValue: ticket.title || "",
      validation: { required: true, minLength: 5 },
    },
    {
      name: "priority",
      type: "select",
      label: language === "en" ? "Priority & SLA Class" : "Prioritas & Kelas SLA",
      defaultValue: String(ticket.priority || "2"),
      options: PRIORITY_OPTIONS,
      validation: { required: true },
    },
    {
      name: "description",
      type: "textarea",
      label: language === "en" ? "Issue Description" : "Deskripsi Masalah",
      defaultValue: ticket.description || "",
      validation: { required: true, minLength: 10 },
    },
    {
      name: "assigned_to",
      type: "select",
      label: language === "en" ? "Assignee / Resolver" : "Penugasan Teknisi / Resolver",
      defaultValue: ticket.assigned_to ? String(ticket.assigned_to) : "",
      options: [
        { label: language === "en" ? "— Unassigned —" : "— Belum Ditugaskan —", value: "" },
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
      title: String(values.title || "").trim(),
      description: String(values.description || "").trim(),
      priority: Number(values.priority || 2),
      assigned_to: values.assigned_to ? String(values.assigned_to) : null,
    };

    const res = await updateCapaTicketAction(String(ticket.id), payload);
    setSubmitting(false);

    if (res.ok) {
      router.push(`/dashboard/capa/${ticket.id}`);
      router.refresh();
    } else {
      setErrorMessage(
        res.message || (language === "en" ? "Failed to update CAPA ticket" : "Gagal memperbarui tiket CAPA")
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
              {language === "en" ? "Edit CAPA Ticket Metadata" : "Ubah Metadata Tiket CAPA"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {language === "en"
                ? "Update problem description, operational priority, or assignee for this active ticket."
                : "Perbarui deskripsi temuan, tingkat prioritas, atau penugasan teknisi untuk tiket aktif ini."}
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
            config={{
              columns: 1,
              submitLabel: submitting
                ? (language === "en" ? "Saving Changes..." : "Menyimpan Perubahan...")
                : (language === "en" ? "Update Ticket" : "Simpan Perubahan"),
              locale: language,
            }}
            locale={language}
          />
        </div>
      </div>

      {/* Kolom Kanan (4/12): Panel Metadata Kontekstual */}
      <div className="space-y-6 lg:col-span-4">
        <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-elegant backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Hash className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {language === "en" ? "Ticket Receipt ID" : "ID Tanda Terima"}
              </p>
              <h3 className="text-sm font-semibold text-foreground">
                {ticket.receipt_id || "—"}
              </h3>
            </div>
          </div>

          <div className="mt-4 space-y-2.5 border-t border-border/40 pt-3 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{language === "en" ? "Origin" : "Asal Tiket"}:</span>
              <span className="font-semibold text-foreground">{ticket.origin || "MANUAL"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{language === "en" ? "Current Status" : "Status Saat Ini"}:</span>
              <span className="font-semibold text-primary">{ticket.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{language === "en" ? "SLA Window" : "Batas SLA"}:</span>
              <span className="font-medium text-foreground">{ticket.sla_hours} jam</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{language === "en" ? "Hotel Code" : "Kode Hotel"}:</span>
              <span className="font-medium text-foreground">{ticket.hotel_code || "—"}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-elegant backdrop-blur-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Clock className="h-4 w-4 text-primary" />
            <span>{language === "en" ? "SLA Adjustment Warning" : "Peringatan Penyesuaian SLA"}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {language === "en"
              ? "Modifying ticket priority will recalculate the due date based on corporate SLA thresholds. Escalation alerts will be dispatched accordingly."
              : "Mengubah prioritas tiket akan menyesuaikan target waktu penyelesaian sesuai matriks korporat. Peringatan eskalasi akan otomatis diselaraskan."}
          </p>
        </div>
      </div>
    </div>
  );
}
