"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CavaForm, type FieldSchema } from "@incodiy/cavaform";
import {
  Building2,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { createAuditSessionAction } from "@/app/actions/audit";
import { useLanguage } from "@/context/LanguageContext";
import type { HotelDetailOption } from "./page";

const DEPT_OPTIONS = [
  { value: "GM", labelKey: "cfg.dept.GM" },
  { value: "HOUSEKEEPING", labelKey: "cfg.dept.HOUSEKEEPING" },
  { value: "KITCHEN_FB", labelKey: "cfg.dept.KITCHEN_FB" },
  { value: "SECURITY_RISK", labelKey: "cfg.dept.SECURITY_RISK" },
];

export function AuditCreateClient({
  hotels,
  activeHotelId,
}: {
  hotels: HotelDetailOption[];
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
  const [selectedDept, setSelectedDept] = useState<string>("HOUSEKEEPING");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedHotel =
    hotels.find((h) => h.id === selectedHotelId) ?? initialHotel;

  const fields: FieldSchema[] = [
    {
      name: "hotel_id",
      type: "select",
      label: t("audit.form.hotel"),
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
      label: t("audit.form.department"),
      defaultValue: selectedDept,
      options: DEPT_OPTIONS.map((d) => ({
        label: t(d.labelKey as never),
        value: d.value,
      })),
      validation: { required: true },
    },
    {
      name: "audit_type",
      type: "select",
      label: t("audit.form.auditType"),
      defaultValue: "FULL",
      options: [
        { label: t("audit.type.FULL"), value: "FULL" },
        { label: t("audit.type.MICRO"), value: "MICRO" },
        { label: t("audit.type.FOLLOWUP"), value: "FOLLOWUP" },
      ],
      validation: { required: true },
    },
    {
      name: "date_start",
      type: "date",
      label: t("audit.form.startDate"),
      defaultValue: new Date().toISOString().slice(0, 10),
      validation: { required: true },
    },
  ];

  async function handleCreate(values: Record<string, unknown>) {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await createAuditSessionAction({
        hotel_id: String(values.hotel_id ?? selectedHotelId),
        department: String(values.department ?? selectedDept),
        audit_type: String(values.audit_type ?? "FULL"),
        date_start: String(values.date_start ?? new Date().toISOString().slice(0, 10)),
      });

      if (!res.ok) {
        const msg = res.message || t("audit.createError");
        setErrorMessage(msg);
        return;
      }

      if (res.session?.id) {
        router.push(`/dashboard/audits/${res.session.id}`);
      } else {
        router.push("/dashboard/audits");
      }
    } catch {
      setErrorMessage(t("audit.createError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Kolom Kiri (Primary): Form Terstruktur CavaForm (7 / 12) */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-elegant backdrop-blur-xl lg:col-span-7">
        <div className="mb-5 flex items-center justify-between border-b border-border/40 pb-4">
          <div>
            <h2 className="text-base font-bold text-foreground">
              {t("audit.createTitle")}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("audit.createSubtitle")}
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            DRAFT
          </span>
        </div>

        <CavaForm
          fields={fields}
          onChange={(vals) => {
            if (vals.hotel_id && String(vals.hotel_id) !== selectedHotelId) {
              setSelectedHotelId(String(vals.hotel_id));
            }
            if (vals.department && String(vals.department) !== selectedDept) {
              setSelectedDept(String(vals.department));
            }
          }}
          config={{
            columns: 1,
            submitLabel: submitting
              ? t("audit.creating")
              : t("audit.createSession"),
            locale: language,
          }}
          locale={language}
          onSubmit={handleCreate}
        />

        {errorMessage && (
          <div
            role="alert"
            className="mt-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Kolom Kanan (Secondary/Context): Contextual & Rule Metadata (5 / 12) */}
      <div className="space-y-4 lg:col-span-5">
        {/* Context Card 1: Property Metadata */}
        <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Building2 className="h-4 w-4 text-primary" />
            <span>{t("audit.context.propertyInfo")}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("audit.context.propertySubtitle")}
          </p>

          <div className="mt-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-muted-foreground">{t("audit.cols.hotel")}:</span>
              <span className="font-semibold text-foreground">
                {selectedHotel ? `${selectedHotel.code} — ${selectedHotel.name}` : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-muted-foreground">Brand Tier:</span>
              <span className="rounded-md bg-secondary px-2 py-0.5 font-medium uppercase text-secondary-foreground">
                {selectedHotel?.brand_tier ?? "Midscale"}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-muted-foreground">Kota / Lokasi:</span>
              <span className="flex items-center gap-1 font-medium text-foreground">
                <MapPin className="h-3 w-3 text-primary" />
                {selectedHotel?.city ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-muted-foreground">Radius Geofence:</span>
              <span className="font-mono font-medium text-foreground">
                {selectedHotel?.geofence_radius_meters ?? 200} m
              </span>
            </div>
          </div>
        </div>

        {/* Context Card 2: Locked Template Rule (Constraint B3) */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold text-primary">
            <ShieldCheck className="h-4 w-4" />
            <span>{t("audit.context.templateRuleTitle")}</span>
          </div>
          <p className="mt-2 leading-relaxed">
            Sistem secara otomatis mengikat versi Checklist Template berstatus{" "}
            <strong className="text-foreground">LOCKED</strong> yang sesuai dengan
            departemen <strong className="text-foreground">{selectedDept}</strong> dan tier brand properti{" "}
            <strong className="text-foreground">{selectedHotel?.brand_tier ?? "Midscale"}</strong> (Constraint B3).
          </p>

          <div className="mt-4 space-y-2 rounded-xl border border-primary/15 bg-background/50 p-3">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Standar Kelulusan PASS ≥ 80.0%</span>
            </div>
            <div className="flex items-center gap-2 text-foreground font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />
              <span>Temuan Life-Safety Otomatis Masuk CAPA Priority 1 (24h)</span>
            </div>
          </div>
        </div>

        {/* Action Link to cancel */}
        <div className="flex justify-end">
          <Link
            href="/dashboard/audits"
            className="text-xs text-muted-foreground transition-smooth hover:text-foreground hover:underline"
          >
            {t("common.cancel")}
          </Link>
        </div>
      </div>
    </div>
  );
}
