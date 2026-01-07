"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Plus,
  ShieldAlert,
  Handshake,
  ListChecks,
  Building2,
  Users,
  Shield,
  MapPin,
  Hotel,
  FileText,
  CreditCard,
  Database,
} from "lucide-react";

/* Icon registry utk lintas RSC→client (komponen tak bisa dikirim Server→Client). */
const ICON_REGISTRY: Record<string, LucideIcon> = {
  "shield-alert": ShieldAlert,
  handshake: Handshake,
  "list-checks": ListChecks,
  building: Building2,
  users: Users,
  shield: Shield,
  "map-pin": MapPin,
  hotel: Hotel,
  "file-text": FileText,
  "credit-card": CreditCard,
  database: Database,
};

/* ─── AdminPageHeader ─── */
/* Consistent page header. Semua teks via kunci i18n (Constraint F2 — zero hardcode). */

interface AdminPageHeaderProps {
  titleKey: string;
  titleValues?: Record<string, string | number>;
  subtitleKey?: string;
  subtitleValues?: Record<string, string | number>;
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
  titleValues,
  subtitleKey,
  subtitleValues,
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
          <h1 className="font-display text-3xl leading-none tracking-wide md:text-4xl">
            {titleValues ? t(titleKey, titleValues) : t(titleKey)}
          </h1>
          {subtitleKey && (
            <p className="mt-1 text-sm text-muted-foreground">
              {subtitleValues ? t(subtitleKey, subtitleValues) : t(subtitleKey)}
            </p>
          )}
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