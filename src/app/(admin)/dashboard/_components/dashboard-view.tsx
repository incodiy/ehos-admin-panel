"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { LayoutDashboard, ClipboardCheck, ShieldAlert, Building2, ArrowRight } from "lucide-react";
import { PageHero } from "@/components/admin/page-hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/context/SessionContext";
import { isCorporate } from "@/lib/auth/session";
import { ApiError } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi";
import { RiskMap } from "./risk-map";
import { RiskIndexPanel } from "./risk-index-panel";
import { OperationPanels } from "./operation-panels";

type Overview = components["schemas"]["DashboardOverview"];
type HeatmapPoint = components["schemas"]["HeatmapPoint"];

export interface DashboardPayload {
  overview: Overview | null;
  heatmap: HeatmapPoint[];
  riskIndex: HeatmapPoint[];
  error: ApiError | null;
}

function DashboardError({ error }: { error: ApiError }) {
  const t = useTranslations();
  return (
    <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-8 text-center">
      <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
      <p className="mt-4 font-semibold">{t("dashboard.errorTitle")}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        {error.status === 0 ? t("dashboard.errorNetwork") : t("dashboard.errorServer", { status: error.status })}
      </p>
      <Link href="/dashboard" className="mt-4 inline-block rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:opacity-90 cursor-pointer">
        {t("dashboard.retry")}
      </Link>
    </div>
  );
}

export function DashboardView({ payload }: { payload: DashboardPayload }) {
  const t = useTranslations();
  const { overview, heatmap, riskIndex, error } = payload;

  if (error) return <DashboardError error={error} />;

  const sla = overview?.sla ?? {};
  const capaActive = overview?.capa_active ?? 0;

  return (
    <>
      <PageHero
        title={t("dashboard.title")}
        subtitle={t("dashboard.subtitle")}
        icon={LayoutDashboard}
        stats={[
          {
            label: t("dashboard.statHotels"),
            value: String(overview?.hotels_total ?? heatmap.length),
            hint: t("dashboard.statHotelsHint", { count: overview?.hotels_with_risk ?? 0 }),
          },
          {
            label: t("dashboard.statAudits"),
            value: String(overview?.audits_ytd ?? 0),
            hint: t("dashboard.statAuditsHint", { count: overview?.audits_today ?? 0 }),
          },
          {
            label: t("dashboard.statCapaActive"),
            value: String(capaActive),
            hint: t("dashboard.statCapaActiveHint", { count: sla.overdue ?? 0 }),
          },
          {
            label: t("dashboard.statLifeSafety"),
            value: String(overview?.life_safety_open ?? 0),
            hint: t("dashboard.statLifeSafetyHint", { count: overview?.findings_total ?? 0 }),
          },
        ]}
        actions={
          <Link href="/dashboard/capa" data-no-link-hover>
            <Button className="h-10 cursor-pointer rounded-lg bg-brand-gradient shadow-glow transition-smooth hover:opacity-90">
              <ClipboardCheck className="h-4 w-4" />
              {t("dashboard.startAudit")}
            </Button>
          </Link>
        }
      />

      {/* Peta Risiko + Indeks Risiko */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card variant="glass" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("dashboard.riskMapTitle")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("dashboard.riskMapSubtitle")}</p>
          </CardHeader>
          <CardContent>
            <RiskMap points={heatmap} />
          </CardContent>
        </Card>
        <RiskIndexPanel items={riskIndex} />
      </div>

      {/* SLA + Pipeline + Insights */}
      <OperationPanels overview={overview ?? {}} />

      {/* Lingkup & akses cepat */}
      <ScopeAndQuick />
    </>
  );
}

function ScopeAndQuick() {
  const t = useTranslations();
  const { session, hotels, roleCodes: codes } = useSession();

  const moduleLinks = [
    {
      href: "/dashboard/capa",
      icon: ShieldAlert,
      title: t("dashboard.moduleCapa"),
      desc: t("dashboard.moduleCapaDesc"),
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card variant="glass" className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {t("dashboard.scopeTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {session ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/50 bg-background/40 p-4">
                  <p className="text-[0.66rem] uppercase tracking-[0.18em] text-muted-foreground">{t("dashboard.scopeUser")}</p>
                  <p className="mt-1 font-semibold">{session.user.name || "—"}</p>
                  <p className="text-sm text-muted-foreground">{session.user.email || "—"}</p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-background/40 p-4">
                  <p className="text-[0.66rem] uppercase tracking-[0.18em] text-muted-foreground">{t("dashboard.scopeRoles")}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {codes.length > 0 ? (
                      codes.map((code) => (
                        <Badge key={code} variant="secondary">
                          {code}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">—</p>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-border/50 bg-background/40 p-4">
                  <p className="text-[0.66rem] uppercase tracking-[0.18em] text-muted-foreground">{t("dashboard.scopeHotel")}</p>
                  <p className="mt-1 font-semibold">{session.activeHotel?.name ?? t("dashboard.scopeAllHotels")}</p>
                  <p className="text-sm text-muted-foreground">
                    {isCorporate(session)
                      ? t("dashboard.scopeCorporate")
                      : t("dashboard.scopeAssigned", { count: hotels.length })}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-background/40 p-4">
                  <p className="text-[0.66rem] uppercase tracking-[0.18em] text-muted-foreground">{t("dashboard.scopeAssignedHotels")}</p>
                  <p className="mt-1 font-display text-3xl leading-none">{hotels.length}</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t("dashboard.noSession")}</p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {moduleLinks.map((module) => (
          <Link key={module.href} href={module.href} data-no-link-hover>
            <Card variant="glass" className="hover-lift cursor-pointer">
              <CardContent className="flex items-start gap-4 p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-gradient text-primary-foreground shadow-glow">
                  <module.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xl leading-none">{module.title}</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">{module.desc}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}