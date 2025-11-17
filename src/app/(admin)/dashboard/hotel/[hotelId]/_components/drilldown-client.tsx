"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, MapPin, ClipboardList, Activity } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApiError } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi";
import { riskBadgeClass, riskColor } from "../../../_components/risk-styles";

type RiskLevel = components["schemas"]["HeatmapPoint"]["risk_level"];

interface DrilldownData {
  hotel_id?: string;
  code?: string;
  name?: string;
  score_history?: { year?: number; score?: number | null }[];
  open_capa_count?: number;
  risk_level?: RiskLevel;
}

export function DrilldownClient({
  data,
  error,
}: {
  data: DrilldownData | null;
  error: ApiError | null;
}) {
  const t = useTranslations();

  if (error) {
    return (
      <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-8 text-center">
        <p className="font-semibold">
          {error.status === 404 ? t("dashboard.notFound") : error.status === 403 ? t("dashboard.accessDenied") : t("dashboard.errorTitle")}
        </p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {error.status === 0 ? t("dashboard.errorNetwork") : t("dashboard.errorServer", { status: error.status })}
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:opacity-90 cursor-pointer"
        >
          {t("dashboard.drillBack")}
        </Link>
      </div>
    );
  }

  const history = data?.score_history ?? [];
  const level = data?.risk_level ?? null;

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("dashboard.drillBack")}
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card variant="glass" className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="flex items-center gap-3">
                <MapPin className="h-6 w-6 text-primary" />
                <span className="font-display text-3xl">{data?.code}</span>
                <span className="text-base font-normal text-muted-foreground">{data?.name}</span>
              </CardTitle>
              <CardDescription className="mt-1">{data?.hotel_id}</CardDescription>
            </div>
            <Badge className={level ? riskBadgeClass(level) : riskBadgeClass(null)}>
              {level ?? t("dashboard.riskLegendNoData")}
            </Badge>
          </CardHeader>
          <CardContent>
            {history.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                    <XAxis
                      dataKey="year"
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      labelFormatter={(label) => `${t("dashboard.drillYear")}: ${label}`}
                      formatter={(value) => [
                        `${typeof value === "number" ? value.toFixed(1) : value} / 100`,
                        t("dashboard.drillScore"),
                      ]}
                    />
                    <ReferenceLine y={60} stroke="var(--warning)" strokeDasharray="4 4" />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke={riskColor(level)}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: riskColor(level), strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">{t("dashboard.drillHistoryEmpty")}</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card variant="glass">
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <ClipboardList className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{t("dashboard.drillOpenCapa")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-4xl">{data?.open_capa_count ?? 0}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("dashboard.riskOpenCapa", { count: data?.open_capa_count ?? 0 })}</p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{t("dashboard.drillRiskLevel")}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <span className="h-4 w-4 rounded-full" style={{ background: riskColor(level) }} />
              <p className="font-semibold">{level ?? t("dashboard.riskLegendNoData")}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}