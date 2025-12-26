"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Gauge, Layers, Lightbulb, AlertTriangle, CheckCircle2, Clock, ShieldAlert, ArrowRight, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { components } from "@/lib/api/openapi";
import { pct } from "./risk-styles";

type Overview = components["schemas"]["DashboardOverview"];

const PIPELINE_ORDER = ["OPEN", "AWAITING_GM", "AWAITING_QA", "CLOSED"] as const;
const PIPELINE_CONFIG: Record<
  string,
  { color: string; bg: string; border: string; text: string; step: string }
> = {
  OPEN: {
    color: "#f97316",
    bg: "bg-orange-500/15",
    border: "border-orange-500/30",
    text: "text-orange-600 dark:text-orange-400",
    step: "01",
  },
  AWAITING_GM: {
    color: "#f59e0b",
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
    text: "text-amber-600 dark:text-amber-400",
    step: "02",
  },
  AWAITING_QA: {
    color: "#3b82f6",
    bg: "bg-blue-500/15",
    border: "border-blue-500/30",
    text: "text-blue-600 dark:text-blue-400",
    step: "03",
  },
  CLOSED: {
    color: "#10b981",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    text: "text-emerald-600 dark:text-emerald-400",
    step: "04",
  },
};

export function OperationPanels({ overview }: { overview: Overview }) {
  const t = useTranslations();
  const pipeline = overview.pipeline ?? {};
  const sla = overview.sla ?? {};
  const insights = overview.insights ?? [];

  const pipelineTotal = PIPELINE_ORDER.reduce((s, k) => s + (pipeline[k] ?? 0), 0);

  const onTime = sla.on_time ?? 0;
  const nearOverdue = sla.near_overdue ?? 0;
  const overdue = sla.overdue ?? 0;
  const slaTotal = onTime + nearOverdue + overdue;
  const complianceRate = slaTotal > 0 ? Math.round((onTime / slaTotal) * 100) : 100;

  // Insight mapping
  const insightMap = insights.reduce<Record<string, number>>((acc, curr) => {
    if (curr.type) acc[curr.type] = curr.count ?? 0;
    return acc;
  }, {});

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* 1. STATUS SLA */}
      <Card variant="glass" className="flex flex-col justify-between border-border/60 shadow-xl">
        <CardHeader className="flex-row items-center justify-between pb-3 pt-5 px-5 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <Gauge className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-lg">{t("dashboard.slaTitle")}</CardTitle>
              <p className="text-xs text-muted-foreground">{t("dashboard.slaRateHint")}</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={
              complianceRate >= 80
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : complianceRate >= 50
                ? "border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "border-rose-500/40 bg-rose-500/15 text-rose-600 dark:text-rose-400"
            }
          >
            {complianceRate}% {t("dashboard.slaOnTime")}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4 pt-4 px-5 pb-5">
          {/* Main Compliance Rate Gauge Bar */}
          <div className="rounded-xl border border-border/50 bg-muted/40 dark:bg-slate-900/60 p-3.5">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-foreground/85 dark:text-slate-300">{t("dashboard.slaRate")}</span>
              <span className="font-mono font-bold text-foreground text-sm">{complianceRate}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted dark:bg-slate-800 flex">
              <div
                className="h-full bg-emerald-500 transition-all duration-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                style={{ width: `${complianceRate}%` }}
                title={`${t("dashboard.slaOnTime")}: ${onTime}`}
              />
              <div
                className="h-full bg-amber-500 transition-all duration-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                style={{ width: `${pct(nearOverdue, slaTotal)}` }}
                title={`${t("dashboard.slaNearOverdue")}: ${nearOverdue}`}
              />
              <div
                className="h-full bg-rose-500 transition-all duration-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]"
                style={{ width: `${pct(overdue, slaTotal)}` }}
                title={`${t("dashboard.slaOverdue")}: ${overdue}`}
              />
            </div>
          </div>

          {/* SLA Breakdown Rows */}
          <div className="space-y-2.5">
            {[
              {
                label: t("dashboard.slaOnTime"),
                count: onTime,
                icon: CheckCircle2,
                color: "text-emerald-600 dark:text-emerald-400",
                barColor: "bg-emerald-500",
                bg: "bg-emerald-500/10",
                border: "border-emerald-500/20",
              },
              {
                label: t("dashboard.slaNearOverdue"),
                count: nearOverdue,
                icon: Clock,
                color: "text-amber-600 dark:text-amber-400",
                barColor: "bg-amber-500",
                bg: "bg-amber-500/10",
                border: "border-amber-500/20",
              },
              {
                label: t("dashboard.slaOverdue"),
                count: overdue,
                icon: AlertTriangle,
                color: "text-rose-600 dark:text-rose-400",
                barColor: "bg-rose-500",
                bg: "bg-rose-500/10",
                border: "border-rose-500/20",
              },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center justify-between rounded-xl border ${item.border} ${item.bg} p-2.5 text-xs transition-all hover:bg-muted/60 dark:hover:bg-slate-800/40`}
              >
                <div className="flex items-center gap-2">
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  <span className="font-medium text-foreground/85 dark:text-slate-300">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-foreground">{item.count}</span>
                  <span className="text-[11px] text-muted-foreground">
                    ({pct(item.count, slaTotal)})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 2. PIPELINE CAPA */}
      <Card variant="glass" className="flex flex-col justify-between border-border/60 shadow-xl">
        <CardHeader className="flex-row items-center justify-between pb-3 pt-5 px-5 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30">
              <Layers className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-lg">{t("dashboard.pipelineTitle")}</CardTitle>
              <p className="text-xs text-muted-foreground">{t("dashboard.pipelineTotal", { count: pipelineTotal })}</p>
            </div>
          </div>
          <Link
            href="/dashboard/capa"
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            {t("common.all")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>

        <CardContent className="space-y-4 pt-4 px-5 pb-5">
          {/* Multi-segment Progress Track */}
          <div className="rounded-xl border border-border/50 bg-muted/40 dark:bg-slate-900/60 p-3.5">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-foreground/85 dark:text-slate-300">Siklus Remediasi</span>
              <span className="font-mono text-xs text-muted-foreground">{pipelineTotal} Tiket</span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-muted dark:bg-slate-800">
              {PIPELINE_ORDER.map((k) => {
                const value = pipeline[k] ?? 0;
                if (!value) return null;
                return (
                  <div
                    key={k}
                    className="h-full transition-all duration-500"
                    style={{
                      width: pct(value, pipelineTotal),
                      background: PIPELINE_CONFIG[k]?.color ?? "#94a3b8",
                    }}
                    title={`${k}: ${value}`}
                  />
                );
              })}
            </div>
          </div>

          {/* 4-Stage Breakdown Grid */}
          <div className="grid grid-cols-2 gap-2">
            {PIPELINE_ORDER.map((k) => {
              const cfg = PIPELINE_CONFIG[k] ?? {
                color: "#94a3b8",
                bg: "bg-muted/40",
                border: "border-border",
                text: "text-foreground",
                step: "00",
              };
              const label =
                k === "OPEN"
                  ? t("dashboard.pipelineOpen")
                  : k === "AWAITING_GM"
                  ? t("dashboard.pipelineAwaitingGm")
                  : k === "AWAITING_QA"
                  ? t("dashboard.pipelineAwaitingQa")
                  : t("dashboard.pipelineClosed");
              const count = pipeline[k] ?? 0;

              return (
                <Link
                  key={k}
                  href={`/dashboard/capa?status=${k}`}
                  className={`flex flex-col justify-between rounded-xl border ${cfg.border} ${cfg.bg} p-2.5 transition-all hover:scale-[1.02] cursor-pointer`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-muted-foreground">
                      STAGE {cfg.step}
                    </span>
                    <span
                      className="h-2 w-2 rounded-full ring-2 ring-white/20 dark:ring-white/10"
                      style={{ background: cfg.color }}
                    />
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className={`text-xs font-semibold ${cfg.text}`}>{label}</span>
                    <span className="font-mono text-sm font-bold text-foreground">{count}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 3. INSIGHT & REKOMENDASI CERDAS */}
      <Card variant="glass" className="flex flex-col justify-between border-border/60 shadow-xl">
        <CardHeader className="flex-row items-center justify-between pb-3 pt-5 px-5 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <Lightbulb className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-lg">{t("dashboard.insightsTitle")}</CardTitle>
              <p className="text-xs text-muted-foreground">Peringatan otomatis & prioritas tindakan</p>
            </div>
          </div>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>

        <CardContent className="space-y-2.5 pt-4 px-5 pb-5">
          {[
            {
              key: "high_risk_hotels",
              label: t("dashboard.insightHighRisk", { count: insightMap.high_risk_hotels ?? 0 }),
              count: insightMap.high_risk_hotels ?? 0,
              icon: ShieldAlert,
              href: "/dashboard/hotel",
              color: "text-rose-600 dark:text-rose-400",
              border: "border-rose-500/30",
              bg: "bg-rose-500/10",
              priority: "CRITICAL",
            },
            {
              key: "sla_overdue",
              label: t("dashboard.insightOverdue", { count: insightMap.sla_overdue ?? 0 }),
              count: insightMap.sla_overdue ?? 0,
              icon: AlertTriangle,
              href: "/dashboard/capa",
              color: "text-amber-600 dark:text-amber-400",
              border: "border-amber-500/30",
              bg: "bg-amber-500/10",
              priority: "HIGH",
            },
            {
              key: "life_safety_open",
              label: t("dashboard.insightLifeSafety", { count: insightMap.life_safety_open ?? 0 }),
              count: insightMap.life_safety_open ?? 0,
              icon: ShieldAlert,
              href: "/dashboard/audits",
              color: "text-rose-600 dark:text-rose-400",
              border: "border-rose-500/30",
              bg: "bg-rose-500/10",
              priority: "LIFE-SAFETY",
            },
            {
              key: "audits_today",
              label: t("dashboard.insightAuditsToday", { count: insightMap.audits_today ?? 0 }),
              count: insightMap.audits_today ?? 0,
              icon: CheckCircle2,
              href: "/dashboard/audits",
              color: "text-emerald-600 dark:text-emerald-400",
              border: "border-emerald-500/30",
              bg: "bg-emerald-500/10",
              priority: "INFO",
            },
          ].map((ins) => (
            <Link
              key={ins.key}
              href={ins.href}
              className={`group flex items-start gap-3 rounded-xl border ${ins.border} ${ins.bg} p-2.5 text-xs transition-all hover:bg-muted/70 dark:hover:bg-slate-800/60 hover:scale-[1.01]`}
            >
              <ins.icon className={`mt-0.5 h-4 w-4 shrink-0 ${ins.color}`} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground/90 dark:text-slate-200 leading-snug">{ins.label}</p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}