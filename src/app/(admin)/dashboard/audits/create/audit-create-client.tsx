"use client";

import { useState, useMemo } from "react";
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
  Calendar,
  Clock,
  Sparkles,
  Layers,
} from "lucide-react";
import {
  createAuditSessionAction,
  createIntegratedAuditCycleAction,
} from "@/app/actions/audit";
import { useLanguage } from "@/context/LanguageContext";
import type { HotelDetailOption } from "./page";

interface AuditCreateClientProps {
  hotels: HotelDetailOption[];
  activeHotelId?: string;
}

function formatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseYMD(str: string): Date {
  const parts = str.split("-").map(Number);
  return new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
}

const ALL_DEPTS = ["SECURITY_RISK", "KITCHEN_FB", "HOUSEKEEPING"] as const;

export function AuditCreateClient({
  hotels,
  activeHotelId,
}: AuditCreateClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const { language } = useLanguage();

  const initialHotel =
    hotels.find((h) => h.id === activeHotelId) ?? hotels[0] ?? null;

  const [selectedHotelId, setSelectedHotelId] = useState<string>(
    initialHotel?.id ?? ""
  );
  // Default to all 3 departments (Audit Lengkap)
  const [selectedDepts, setSelectedDepts] = useState<string[]>([
    "SECURITY_RISK",
    "KITCHEN_FB",
    "HOUSEKEEPING",
  ]);
  const [selectedAuditType, setSelectedAuditType] = useState<string>("FULL");

  // Scope status flags
  const isAllDepts =
    selectedDepts.length === 3 &&
    ALL_DEPTS.every((d) => selectedDepts.includes(d));

  const isOnlySec =
    selectedDepts.length === 1 && selectedDepts.includes("SECURITY_RISK");

  const isOnlyKitchen =
    selectedDepts.length === 1 && selectedDepts.includes("KITCHEN_FB");

  const isOnlyHK =
    selectedDepts.length === 1 && selectedDepts.includes("HOUSEKEEPING");

  const isCustomMix =
    !isAllDepts && !isOnlySec && !isOnlyKitchen && !isOnlyHK && selectedDepts.length > 0;

  // Date Range state with local timezone safety
  const todayStr = useMemo(() => formatYMD(new Date()), []);
  const defaultEndStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2); // Standar siklus 3 hari
    return formatYMD(d);
  }, []);

  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(defaultEndStr);
  const [formKey, setFormKey] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedHotel =
    hotels.find((h) => h.id === selectedHotelId) ?? initialHotel;

  // Calculate day duration accurately
  const durationDays = useMemo(() => {
    try {
      const d1 = parseYMD(startDate);
      const d2 = parseYMD(endDate);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? diffDays : 1;
    } catch {
      return 1;
    }
  }, [startDate, endDate]);

  // Quick preset handlers
  const applyPreset = (days: number) => {
    const start = parseYMD(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + (days - 1));
    setEndDate(formatYMD(end));
    setFormKey((k) => k + 1);
  };

  // Quick scope preset handlers
  const applyScopePreset = (depts: string[]) => {
    setSelectedDepts(depts);
    setFormKey((k) => k + 1);
  };

  // CavaForm Field Schema definition adhering to Constraint I (@incodiy/cavaform)
  const fields: FieldSchema[] = useMemo(
    () => [
      {
        name: "hotel_id",
        type: "select",
        label: t("audit.form.hotel"),
        defaultValue: selectedHotelId,
        colSpan: 2,
        options: hotels.map((h) => ({
          label: `${h.code} — ${h.name} (${h.city || "Indonesia"})`,
          value: h.id,
        })),
        validation: { required: true },
        helperText: "Pilih properti hotel yang akan diaudit",
      },
      {
        name: "departments",
        type: "multiselect",
        label: t("audit.form.department"),
        defaultValue: selectedDepts,
        colSpan: 2,
        options: [
          {
            value: "SECURITY_RISK",
            label: "Security & Risk Department (15 Seksi, 167 Butir)",
          },
          {
            value: "KITCHEN_FB",
            label: "Kitchen & F&B Department (9 Seksi, 86 Butir)",
          },
          {
            value: "HOUSEKEEPING",
            label: "Housekeeping & Room Check Department (8 Seksi Umum + Multi-Room)",
          },
        ],
        validation: { required: true },
        helperText: isAllDepts
          ? "Audit Lengkap aktif: 3 sesi departemen resmi MasterData.xlsx akan dibuat serentak."
          : isCustomMix
          ? `Audit Mix aktif: ${selectedDepts.length} departemen terpilih akan dibuat serentak.`
          : "Audit Parsial aktif: 1 departemen terpilih akan dibuat.",
      },
      {
        name: "audit_type",
        type: "select",
        label: t("audit.form.auditType"),
        defaultValue: selectedAuditType,
        colSpan: 2,
        options: [
          {
            value: "FULL",
            label: `${t("audit.type.FULL")} — ${t("audit.type.FULL_DESC")}`,
          },
          {
            value: "FOLLOWUP",
            label: `${t("audit.type.FOLLOWUP")} — ${t("audit.type.FOLLOWUP_DESC")}`,
          },
          {
            value: "MICRO",
            label: `${t("audit.type.MICRO")} — ${t("audit.type.MICRO_DESC")}`,
          },
        ],
        validation: { required: true },
        helperText:
          "Pilih Full Comprehensive untuk inspeksi rutin standar berkala",
      },
      {
        name: "date_start",
        type: "date",
        label: t("audit.form.startDate"),
        defaultValue: startDate,
        colSpan: 1,
        validation: { required: true },
        helperText: "Hari pertama dimulainya inspeksi",
      },
      {
        name: "date_end",
        type: "date",
        label: t("audit.form.endDate"),
        defaultValue: endDate,
        colSpan: 1,
        validation: { required: true },
        helperText: "Hari penutupan sesi inspeksi",
      },
    ],
    [
      t,
      hotels,
      selectedHotelId,
      selectedDepts,
      isAllDepts,
      isCustomMix,
      selectedAuditType,
      startDate,
      endDate,
    ]
  );

  async function handleCreate(values: Record<string, unknown>) {
    setSubmitting(true);
    setErrorMessage(null);

    const hotelId = String(values.hotel_id ?? selectedHotelId);
    const deptsRaw = values.departments ?? selectedDepts;
    const deptList: string[] = Array.isArray(deptsRaw)
      ? deptsRaw.map(String).filter(Boolean)
      : typeof deptsRaw === "string" && deptsRaw
      ? [deptsRaw]
      : [];
    const auditType = String(values.audit_type ?? selectedAuditType);
    const dStart = String(values.date_start ?? startDate);
    const dEnd = String(values.date_end ?? endDate);

    if (!hotelId) {
      setErrorMessage("Silakan pilih hotel target terlebih dahulu.");
      setSubmitting(false);
      return;
    }

    if (deptList.length === 0) {
      setErrorMessage("Silakan pilih minimal satu departemen untuk diaudit.");
      setSubmitting(false);
      return;
    }

    if (dStart && dEnd && dEnd < dStart) {
      setErrorMessage("Tanggal selesai tidak boleh lebih awal dari tanggal mulai.");
      setSubmitting(false);
      return;
    }

    try {
      if (deptList.length > 1) {
        // Buat Siklus Audit Terpadu untuk kombinasi departemen terpilih (2 atau 3 departemen)
        const res = await createIntegratedAuditCycleAction({
          hotel_id: hotelId,
          audit_type: auditType,
          date_start: dStart,
          date_end: dEnd,
          departments: deptList,
        });

        if (!res.ok || !res.result) {
          setErrorMessage(res.message || t("audit.createError"));
          return;
        }

        // Arahkan langsung ke lembar kerja primer
        router.push(`/dashboard/audits/${res.result.primary_session_id}`);
      } else {
        // Buat Sesi Audit Tunggal untuk 1 Departemen
        const res = await createAuditSessionAction({
          hotel_id: hotelId,
          department: deptList[0],
          audit_type: auditType,
          date_start: dStart,
          date_end: dEnd,
        });

        if (!res.ok || !res.session) {
          setErrorMessage(res.message || t("audit.createError"));
          return;
        }

        router.push(`/dashboard/audits/${res.session.id}`);
      }
    } catch {
      setErrorMessage(t("audit.createError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Kolom Kiri: Form Terstruktur CavaForm (@incodiy/cavaform) (7 / 12) */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-elegant backdrop-blur-xl lg:col-span-7">
        <div className="mb-6 flex items-center justify-between border-b border-border/40 pb-4">
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

        {/* Quick Scope Presets & Department Mix Indicator */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/20 p-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground mr-1 flex items-center gap-1">
              <Layers className="h-3 w-3 text-primary" />
              Cakupan Dept:
            </span>
            <button
              type="button"
              onClick={() => applyScopePreset([...ALL_DEPTS])}
              className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] transition-all ${
                isAllDepts
                  ? "border border-primary bg-primary/20 text-primary font-bold shadow-sm ring-1 ring-primary/40"
                  : "border border-border/70 bg-background/80 text-muted-foreground font-medium hover:border-primary/40 hover:text-foreground hover:bg-muted/40"
              }`}
            >
              Audit Lengkap (3 Dept)
            </button>
            <button
              type="button"
              onClick={() => applyScopePreset(["SECURITY_RISK"])}
              className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] transition-all ${
                isOnlySec
                  ? "border border-primary bg-primary/20 text-primary font-bold shadow-sm ring-1 ring-primary/40"
                  : "border border-border/70 bg-background/80 text-muted-foreground font-medium hover:border-primary/40 hover:text-foreground hover:bg-muted/40"
              }`}
            >
              Security
            </button>
            <button
              type="button"
              onClick={() => applyScopePreset(["KITCHEN_FB"])}
              className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] transition-all ${
                isOnlyKitchen
                  ? "border border-primary bg-primary/20 text-primary font-bold shadow-sm ring-1 ring-primary/40"
                  : "border border-border/70 bg-background/80 text-muted-foreground font-medium hover:border-primary/40 hover:text-foreground hover:bg-muted/40"
              }`}
            >
              Kitchen & F&B
            </button>
            <button
              type="button"
              onClick={() => applyScopePreset(["HOUSEKEEPING"])}
              className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] transition-all ${
                isOnlyHK
                  ? "border border-primary bg-primary/20 text-primary font-bold shadow-sm ring-1 ring-primary/40"
                  : "border border-border/70 bg-background/80 text-muted-foreground font-medium hover:border-primary/40 hover:text-foreground hover:bg-muted/40"
              }`}
            >
              Housekeeping
            </button>
            {isCustomMix && (
              <span className="rounded-lg border border-primary bg-primary/20 px-2.5 py-1 text-[11px] font-bold text-primary shadow-sm ring-1 ring-primary/40">
                Mix ({selectedDepts.length} Dept)
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/25 px-2.5 py-0.5 text-[11px] font-bold text-primary">
            <Sparkles className="h-3 w-3" />
            {isAllDepts
              ? "Audit Lengkap (3 Dept)"
              : isCustomMix
              ? `${selectedDepts.length} Dept Kombinasi`
              : `${selectedDepts.length} Dept Tunggal`}
          </span>
        </div>

        {/* Quick Date Presets & Live Duration Indicator */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/20 p-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground mr-1 flex items-center gap-1">
              <Calendar className="h-3 w-3 text-primary" />
              Preset Tanggal:
            </span>
            {[
              { days: 1, label: "1 Hari" },
              { days: 3, label: "3 Hari (Standar)" },
              { days: 5, label: "5 Hari" },
              { days: 7, label: "1 Minggu" },
            ].map((p) => {
              const isActive = durationDays === p.days;
              return (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => applyPreset(p.days)}
                  className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] transition-all ${
                    isActive
                      ? "border border-primary bg-primary/20 text-primary font-bold shadow-sm ring-1 ring-primary/40"
                      : "border border-border/70 bg-background/80 text-muted-foreground font-medium hover:border-primary/40 hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/25 px-2.5 py-0.5 text-[11px] font-bold text-primary">
            <Clock className="h-3 w-3" />
            {t("audit.form.duration", { days: durationDays })}
          </span>
        </div>

        {/* Standard CavaForm Component from @incodiy/cavaform */}
        <CavaForm
          key={`${formKey}_${selectedHotelId}`}
          fields={fields}
          initialValues={{
            hotel_id: selectedHotelId,
            departments: selectedDepts,
            audit_type: selectedAuditType,
            date_start: startDate,
            date_end: endDate,
          }}
          onChange={(vals) => {
            if (vals.hotel_id && String(vals.hotel_id) !== selectedHotelId) {
              setSelectedHotelId(String(vals.hotel_id));
            }
            if (vals.departments !== undefined) {
              const raw = vals.departments;
              const arr = Array.isArray(raw)
                ? (raw as string[])
                : typeof raw === "string" && raw
                ? [raw]
                : [];
              setSelectedDepts(arr);
            }
            if (vals.audit_type && String(vals.audit_type) !== selectedAuditType) {
              setSelectedAuditType(String(vals.audit_type));
            }
            if (vals.date_start && String(vals.date_start) !== startDate) {
              setStartDate(String(vals.date_start));
            }
            if (vals.date_end && String(vals.date_end) !== endDate) {
              setEndDate(String(vals.date_end));
            }
          }}
          config={{
            columns: 2,
            submitLabel: submitting ? t("audit.creating") : t("audit.createSession"),
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

      {/* Kolom Kanan: Contextual & Rule Metadata (5 / 12) */}
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
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-xs text-muted-foreground space-y-3">
          <div className="flex items-center gap-2 font-semibold text-primary">
            <ShieldCheck className="h-4 w-4" />
            <span>{t("audit.context.templateRuleTitle")}</span>
          </div>
          <p className="leading-relaxed">
            Sistem secara otomatis mengikat versi Checklist Template berstatus{" "}
            <strong className="text-foreground">LOCKED</strong> yang sesuai dengan
            lingkup{" "}
            <strong className="text-foreground">
              {isAllDepts
                ? "Semua 3 Departemen (Audit Lengkap)"
                : selectedDepts.length > 0
                ? selectedDepts.map((d) => d.replace("_", " ")).join(", ")
                : "Belum dipilih"}
            </strong>{" "}
            dan tier brand properti{" "}
            <strong className="text-foreground">{selectedHotel?.brand_tier ?? "Midscale"}</strong> (Constraint B3).
          </p>

          <div className="space-y-2 rounded-xl border border-primary/15 bg-background/60 p-3">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>Standar Kelulusan Passing Grade ≥ 80.0%</span>
            </div>
            <div className="flex items-center gap-2 text-foreground font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>Temuan Life-Safety Otomatis Masuk CAPA Priority 1 (24h)</span>
            </div>
            <div className="flex items-center gap-2 text-foreground font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span>Penyimpanan Terpadu Kolom Start Date & End Date (PostgreSQL)</span>
            </div>
          </div>
        </div>

        {/* Cancel Link */}
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
