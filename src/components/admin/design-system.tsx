"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Plus, ShieldAlert } from "lucide-react";

/* Icon registry utk lintas RSC→client (komponen tak bisa dikirim Server→Client). */
const ICON_REGISTRY: Record<string, LucideIcon> = {
  "shield-alert": ShieldAlert,
};

/* ─── AdminPageHeader ─── */
/* Consistent page header. Semua teks via kunci i18n (Constraint F2 — zero hardcode). */

interface AdminPageHeaderProps {
  titleKey: string;
  subtitleKey?: string;
  icon?: LucideIcon;
  /** Alternatif lintas RSC: resolve icon di sisi client dari registry. */
  iconKey?: string;
  addLabelKey?: string;
  addHref?: string;
  onAdd?: () => void;
  actions?: ReactNode;
}

export function AdminPageHeader({
  titleKey,
  subtitleKey,
  icon,
  iconKey,
  addLabelKey,
  addHref,
  onAdd,
  actions,
}: AdminPageHeaderProps) {
  const t = useTranslations();
  const Icon = icon || (iconKey ? ICON_REGISTRY[iconKey] : undefined);

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3.5">
        {Icon && (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-gradient text-primary-foreground shadow-glow">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div>
          <h1 className="font-display text-3xl leading-none tracking-wide md:text-4xl">{t(titleKey)}</h1>
          {subtitleKey && <p className="mt-1 text-sm text-muted-foreground">{t(subtitleKey)}</p>}
        </div>
      </div>

      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : addLabelKey ? (
        addHref ? (
          <Link href={addHref} data-no-link-hover>
            <Button className="h-10 rounded-lg bg-brand-gradient shadow-glow transition-smooth hover:opacity-90 cursor-pointer">
              <Plus className="h-4 w-4" />
              {t(addLabelKey)}
            </Button>
          </Link>
        ) : (
          <Button
            onClick={onAdd}
            className="h-10 rounded-lg bg-brand-gradient shadow-glow transition-smooth hover:opacity-90 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            {t(addLabelKey)}
          </Button>
        )
      ) : null}
    </div>
  );
}