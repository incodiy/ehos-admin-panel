"use client";

import { useTranslations } from "next-intl";
import { Gauge, Layers, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { components } from "@/lib/api/openapi";
import { pct } from "./risk-styles";

type Overview = components["schemas"]["DashboardOverview"];

const PIPELINE_ORDER = ["OPEN", "AWAITING_GM", "AWAITING_QA", "CLOSED"] as const;
const PIPELINE_COLOR: Record<string, string> = {
  OPEN: "#f97316",
  AWAITING_GM: "#eab308",
  AWAITING_QA: "#3b82f6",
  CLOSED: "#22c55e",
};

const SLAS = ["on_time", "near_overdue", "overdue"] as const;

export function OperationPanels({ overview }: { overview: Overview }) {
  const t = useTranslations();
  const pipeline = overview.pipeline ?? {};
  const sla = overview.sla ?? {};
  const insights = overview.insights ?? [];

  const pipelineTotal = PIPELINE_ORDER.reduce((s, k) => s + (pipeline[k] ?? 0), 0);
  const slaTotal = SLAS.reduce((s, k) => s + (sla[k] ?? 0), 0);

  const insightMap: Record<string, number> = {};
  for (const i of insights) if (i.type && i.count != null) insightMap[i.type] = i.count;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card variant="glass">
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Gauge className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-lg">{t("dashboard.slaTitle")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {SLAS.map((key) => {
            const value = sla[key] ?? 0;
            const color =
              key === "on_time" ? "bg-emerald-500" : key === "near_overdue" ? "bg-amber-500" : "bg-destructive";
            return (
              <div key={key}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t(`dashboard.sla${key === "on_time" ? "OnTime" : key === "near_overdue" ? "NearOverdue" : "Overdue"}`)}</span>
                  <span className="font-mono font-semibold">{value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted/60">
                  <div className={`h-full rounded-full ${color}`} style={{ width: pct(value, slaTotal) }} />
                </div>
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground">
            {(sla.unknown ?? 0) > 0 ? `unknown: ${sla.unknown}` : ""}
          </p>
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Layers className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{t("dashboard.pipelineTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex h-4 overflow-hidden rounded-full bg-muted/60">
            {PIPELINE_ORDER.map((k) => {
              const value = pipeline[k] ?? 0;
              if (!value) return null;
              return (
                <div
                  key={k}
                  className="h-full first:rounded-l-full last:rounded-r-full"
                  style={{ width: pct(value, pipelineTotal), background: PIPELINE_COLOR[k] }}
                  title={k}
                />
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {PIPELINE_ORDER.map((k) => (
              <div key={k} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ background: PIPELINE_COLOR[k] }} />
                  {t("dashboard." + (k === "OPEN" ? "pipelineOpen" : k === "AWAITING_GM" ? "pipelineAwaitingGm" : k === "AWAITING_QA" ? "pipelineAwaitingQa" : "pipelineClosed"))}
                </span>
                <span className="font-mono font-semibold">{pipeline[k] ?? 0}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Lightbulb className="h-5 w-5 text-accent" />
          <CardTitle className="text-lg">{t("dashboard.insightsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {[
            { key: "high_risk_hotels", label: t("dashboard.insightHighRisk", { count: insightMap.high_risk_hotels ?? 0 }) },
            { key: "sla_overdue", label: t("dashboard.insightOverdue", { count: insightMap.sla_overdue ?? 0 }) },
            { key: "life_safety_open", label: t("dashboard.insightLifeSafety", { count: insightMap.life_safety_open ?? 0 }) },
            { key: "audits_today", label: t("dashboard.insightAuditsToday", { count: insightMap.audits_today ?? 0 }) },
          ].map((ins) => (
            <div key={ins.key} className="rounded-xl border border-border/50 bg-background/40 px-3 py-2.5 text-sm">
              {ins.label}
              {ins.key === "high_risk_hotels" && insightMap.high_risk_hotels ? (
                <span className="ml-1.5 inline-block h-2 w-2 animate-status-pulse rounded-full bg-destructive" />
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}