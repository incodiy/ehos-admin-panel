"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ShieldAlert, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { components } from "@/lib/api/openapi";
import { riskBadgeClass } from "./risk-styles";

type HeatmapPoint = components["schemas"]["HeatmapPoint"];

export function RiskIndexPanel({
  items,
  limit = 12,
}: {
  items: HeatmapPoint[];
  limit?: number;
}) {
  const t = useTranslations();

  if (!items.length) {
    return (
      <Card variant="glass" className="h-full">
        <CardContent className="flex h-40 flex-col items-center justify-center gap-2 text-center">
          <ShieldAlert className="h-8 w-8 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">{t("dashboard.riskNoData")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="h-full">
      <CardHeader>
        <CardTitle>{t("dashboard.riskIndexTitle")}</CardTitle>
        <CardDescription>{t("dashboard.riskIndexSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border/40">
        {items.slice(0, limit).map((p, i) => (
          <Link
            key={p.hotel_id}
            href={`/dashboard/hotel/${p.hotel_id}`}
            className="group flex items-center gap-3 py-2.5 hover:bg-muted/40"
          >
            <span className="w-5 shrink-0 text-right font-mono text-xs text-muted-foreground">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold leading-tight">{p.code}</p>
                {p.has_life_safety && (
                  <span
                    className="inline-block h-2 w-2 shrink-0 animate-status-pulse rounded-full bg-destructive"
                    title="life-safety"
                  />
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">{p.name}</p>
            </div>
            <div className="hidden shrink-0 items-center gap-2 text-xs text-muted-foreground sm:flex">
              <span>{t("dashboard.riskOpenCapa", { count: p.open_capa ?? 0 })}</span>
              <span className="font-mono">{p.score?.toFixed(1) ?? "—"}</span>
            </div>
            <Badge className={cn("capitalize", riskBadgeClass(p.risk_level))}>
              {p.risk_level ? p.risk_level : t("dashboard.riskLegendNoData")}
            </Badge>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}