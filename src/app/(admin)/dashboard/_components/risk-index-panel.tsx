"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ShieldAlert, ArrowRight, Search, Flame, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { components } from "@/lib/api/openapi";
import { riskBadgeClass, scoreColor } from "./risk-styles";

type HeatmapPoint = components["schemas"]["HeatmapPoint"];

export function RiskIndexPanel({
  items,
}: {
  items: HeatmapPoint[];
}) {
  const t = useTranslations();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "CRITICAL" | "LIFE_SAFETY">("ALL");

  const filteredItems = useMemo(() => {
    let list = items;
    if (filter === "CRITICAL") {
      list = list.filter((p) => p.risk_level === "CRITICAL");
    } else if (filter === "LIFE_SAFETY") {
      list = list.filter((p) => p.has_life_safety);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.code?.toLowerCase().includes(q) ||
          p.name?.toLowerCase().includes(q) ||
          p.brand_tier?.toLowerCase().includes(q) ||
          p.region?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, filter, search]);

  const criticalCount = useMemo(() => items.filter((p) => p.risk_level === "CRITICAL").length, [items]);
  const lifeSafetyCount = useMemo(() => items.filter((p) => p.has_life_safety).length, [items]);

  if (!items.length) {
    return (
      <Card variant="glass" className="h-full">
        <CardContent className="flex h-64 flex-col items-center justify-center gap-3 text-center">
          <ShieldAlert className="h-10 w-10 text-muted-foreground/60" />
          <p className="font-semibold text-foreground">{t("dashboard.riskNoData")}</p>
          <p className="text-xs text-muted-foreground max-w-xs">{t("dashboard.riskIndexSubtitle")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="flex h-full flex-col overflow-hidden border-border/60 shadow-2xl">
      {/* Header */}
      <CardHeader className="pb-3 pt-5 px-5 border-b border-border/40 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500 animate-status-pulse shadow-[0_0_10px_rgba(244,63,94,0.6)]" />
              {t("dashboard.riskIndexTitle")}
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">{t("dashboard.riskIndexSubtitle")}</CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-xs border-rose-500/30 bg-rose-500/10 text-rose-400">
            {items.length} {t("dashboard.filterAll")}
          </Badge>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("dashboard.filterSearchPlaceholder")}
            className="h-8 pl-8 text-xs bg-muted/50 dark:bg-slate-900/60 border-border/60 rounded-lg text-foreground focus-visible:ring-primary/50"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
              filter === "ALL"
                ? "bg-primary/15 text-primary border border-primary/30 shadow-xs"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            {t("dashboard.filterAll")} ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("CRITICAL")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
              filter === "CRITICAL"
                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/40 font-semibold"
                : "text-rose-600/80 dark:text-rose-400/80 hover:bg-rose-500/10"
            }`}
          >
            <AlertCircle className="h-3 w-3" />
            {t("dashboard.filterCritical")} ({criticalCount})
          </button>
          {lifeSafetyCount > 0 && (
            <button
              type="button"
              onClick={() => setFilter("LIFE_SAFETY")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                filter === "LIFE_SAFETY"
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40 font-semibold"
                  : "text-amber-600/80 dark:text-amber-400/80 hover:bg-amber-500/10"
              }`}
            >
              <Flame className="h-3 w-3" />
              {t("dashboard.filterLifeSafety")} ({lifeSafetyCount})
            </button>
          )}
        </div>
      </CardHeader>

      {/* Scrollable Ranked List */}
      <CardContent className="flex-1 overflow-y-auto p-0 divide-y divide-border/30 max-h-[480px]">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            {t("common.noData")}
          </div>
        ) : (
          filteredItems.map((p, idx) => {
            const sc = scoreColor(p.score);
            const scoreVal = p.score != null ? p.score.toFixed(1) : "—";
            const rankBg =
              idx === 0
                ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40 font-bold"
                : idx === 1
                ? "bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-400/20 dark:text-slate-200 dark:border-slate-400/40 font-bold"
                : idx === 2
                ? "bg-amber-700/15 text-amber-700 dark:text-amber-400 border-amber-700/40 font-bold"
                : "bg-muted text-muted-foreground border-border/50 font-mono";

            return (
              <Link
                key={p.hotel_id ?? `${p.code}-${idx}`}
                href={p.hotel_id ? `/dashboard/hotel/${p.hotel_id}` : "#"}
                className="group flex items-center gap-3.5 p-3.5 hover:bg-muted/50 dark:hover:bg-slate-800/40 transition-all duration-200 cursor-pointer"
              >
                {/* Rank Badge */}
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[11px]",
                    rankBg
                  )}
                >
                  {idx + 1}
                </span>

                {/* Hotel Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground bg-muted dark:bg-slate-800 px-1.5 py-0.5 rounded border border-border/60">
                      {p.code}
                    </span>
                    <p className="font-semibold text-sm leading-snug text-foreground truncate group-hover:text-primary transition-colors">
                      {p.name}
                    </p>
                    {p.has_life_safety && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 border border-rose-500/40 animate-pulse"
                        title="Life-Safety Finding Open"
                      >
                        <Flame className="h-2.5 w-2.5" />
                        LS
                      </span>
                    )}
                  </div>

                  {/* Subtitle / Location / Score Bar */}
                  <div className="mt-1.5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {p.open_capa ?? 0} CAPA
                      </span>
                      {p.brand_tier && (
                        <>
                          <span className="text-border">&bull;</span>
                          <span className="truncate text-[11px] text-muted-foreground max-w-[120px]">
                            {p.brand_tier}
                          </span>
                        </>
                      )}
                      {p.region && (
                        <>
                          <span className="text-border">&bull;</span>
                          <span className="truncate text-[11px] text-muted-foreground max-w-[120px]">
                            {p.region}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Mini Score Gauge */}
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted dark:bg-slate-800">
                        <div
                          className={cn("h-full rounded-full transition-all", sc.bg)}
                          style={{ width: `${Math.min(100, Math.max(0, p.score ?? 0))}%` }}
                        />
                      </div>
                      <span className={cn("font-mono text-xs font-bold", sc.text)}>
                        {scoreVal}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Risk Level Badge */}
                <Badge className={cn("capitalize shrink-0 text-[10px] px-2 py-0.5", riskBadgeClass(p.risk_level))}>
                  {p.risk_level ? p.risk_level : t("dashboard.riskLegendNoData")}
                </Badge>

                {/* Arrow Action */}
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}