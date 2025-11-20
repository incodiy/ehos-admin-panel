"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function ConfigTiles() {
  const t = useTranslations("cfg");
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Link
        href="/dashboard/config/checklist"
        data-no-link-hover
        className="group rounded-2xl border border-border bg-card p-6 transition-smooth hover:border-primary/40 hover:shadow-glow"
      >
        <span className="text-lg font-display font-semibold">{t("checklistTitle")}</span>
        <p className="mt-2 text-sm text-muted-foreground">{t("tileChecklist")}</p>
      </Link>
      <Link
        href="/dashboard/config/brand-tiers"
        data-no-link-hover
        className="group rounded-2xl border border-border bg-card p-6 transition-smooth hover:border-primary/40 hover:shadow-glow"
      >
        <span className="text-lg font-display font-semibold">{t("brandsTitle")}</span>
        <p className="mt-2 text-sm text-muted-foreground">{t("tileBrands")}</p>
      </Link>
    </div>
  );
}