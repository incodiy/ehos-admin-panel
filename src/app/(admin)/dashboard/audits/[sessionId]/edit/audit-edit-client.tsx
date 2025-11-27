"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CavaForm, type FieldSchema } from "@incodiy/cavaform";
import {
  Building2,
  ShieldCheck,
  AlertCircle,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  updateAuditSessionAction,
  deleteAuditSessionAction,
  type AuditSessionRow,
} from "@/app/actions/audit";
import { useLanguage } from "@/context/LanguageContext";

const DEPT_OPTIONS = [
  { value: "GM", labelKey: "cfg.dept.GM" },
  { value: "HOUSEKEEPING", labelKey: "cfg.dept.HOUSEKEEPING" },
  { value: "KITCHEN_FB", labelKey: "cfg.dept.KITCHEN_FB" },
  { value: "SECURITY_RISK", labelKey: "cfg.dept.SECURITY_RISK" },
];

export function AuditEditClient({ session }: { session: AuditSessionRow }) {
  const t = useTranslations();
  const router = useRouter();
  const { language } = useLanguage();

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fields: FieldSchema[] = [
    {
      name: "department",
      type: "select",
      label: t("audit.form.department"),
      defaultValue: session.department ?? "HOUSEKEEPING",
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
      defaultValue: session.audit_type ?? "FULL",
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
      defaultValue: session.date_start ? session.date_start.slice(0, 10) : "",
      validation: { required: true },
    },
    {
      name: "date_end",
      type: "date",
      label: t("audit.form.endDate"),
      defaultValue: session.date_end ? session.date_end.slice(0, 10) : "",
    },
  ];

  async function handleUpdate(values: Record<string, unknown>) {
    if (!session.id) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await updateAuditSessionAction(session.id, {
        department: String(values.department ?? session.department),
        audit_type: String(values.audit_type ?? session.audit_type),
        date_start: String(values.date_start ?? session.date_start),
        date_end: values.date_end ? String(values.date_end) : undefined,
      });

      if (!res.ok) {
        setErrorMessage(
          res.message ? t(res.message as never) : t("audit.updateError")
        );
        return;
      }

      router.push(`/dashboard/audits/${session.id}`);
      router.refresh();
    } catch {
      setErrorMessage(t("audit.updateError"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!session.id) return;
    setDeleting(true);
    setErrorMessage(null);
    try {
      const res = await deleteAuditSessionAction(session.id);
      if (!res.ok) {
        setErrorMessage(
          res.message ? t(res.message as never) : t("audit.deleteError")
        );
        return;
      }
      router.push("/dashboard/audits");
      router.refresh();
    } catch {
      setErrorMessage(t("audit.deleteError"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Kolom Kiri (Primary): Form Terstruktur CavaForm (7 / 12) */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-elegant backdrop-blur-xl lg:col-span-7">
        <div className="mb-5 flex items-center justify-between border-b border-border/40 pb-4">
          <div>
            <h2 className="text-base font-bold text-foreground">
              {t("audit.editTitle")}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("audit.editSubtitle")}
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            DRAFT
          </span>
        </div>

        <CavaForm
          fields={fields}
          config={{
            columns: 1,
            submitLabel: submitting
              ? t("audit.updating")
              : t("audit.updateSession"),
            locale: language,
          }}
          locale={language}
          onSubmit={handleUpdate}
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

      {/* Kolom Kanan (Secondary/Context): Contextual & FSM Rules (5 / 12) */}
      <div className="space-y-4 lg:col-span-5">
        {/* Context Card 1: Property Info */}
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
                {session.hotel_name} ({session.hotel_code})
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-muted-foreground">{t("audit.cols.auditor")}:</span>
              <span className="font-medium text-foreground">
                {session.auditor_name ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-muted-foreground">{t("audit.kv.origin")}:</span>
              <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[11px] text-secondary-foreground">
                {session.origin ?? "SYSTEM"}
              </span>
            </div>
          </div>
        </div>

        {/* Context Card 2: FSM Rules */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold text-primary">
            <ShieldCheck className="h-4 w-4" />
            <span>{t("audit.context.fsmRulesTitle")}</span>
          </div>
          <p className="mt-2 leading-relaxed">
            {t("audit.context.fsmRulesDesc")}
          </p>

          <div className="mt-4 space-y-2 rounded-xl border border-primary/15 bg-background/50 p-3">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>DRAFT: Parameter dapat diedit atau dibatalkan</span>
            </div>
            <div className="flex items-center gap-2 text-foreground font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />
              <span>IN_PROGRESS: Pengisian skor aktif, parameter terkunci</span>
            </div>
          </div>
        </div>

        {/* Context Card 3: Danger Zone */}
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-xs">
          <div className="flex items-center gap-2 font-semibold text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>{t("audit.context.dangerZone")}</span>
          </div>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            {t("audit.context.dangerZoneDesc")}
          </p>

          <div className="mt-4">
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-xs font-semibold text-destructive transition-smooth hover:bg-destructive hover:text-white"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t("audit.deleteSession")}
              </button>
            ) : (
              <div className="space-y-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3">
                <p className="text-center font-medium text-destructive">
                  {t("audit.deleteConfirm")}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="rounded-lg bg-destructive px-3 py-1.5 font-semibold text-white transition-smooth hover:opacity-90 disabled:opacity-50"
                  >
                    {deleting ? t("audit.deleting") : t("common.confirm")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleting}
                    className="rounded-lg border border-border bg-card px-3 py-1.5 font-medium text-muted-foreground transition-smooth hover:text-foreground"
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back Link */}
        <div className="flex justify-end">
          <Link
            href={`/dashboard/audits/${session.id}`}
            className="text-xs text-muted-foreground transition-smooth hover:text-foreground hover:underline"
          >
            {t("common.cancel")}
          </Link>
        </div>
      </div>
    </div>
  );
}
