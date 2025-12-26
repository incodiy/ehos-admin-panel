import { ApiError, serverApiFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi";
import { DashboardView } from "./_components/dashboard-view";
import type { DashboardBreakdownsData } from "./_components/dashboard-audit-summary-cards";

type Overview = components["schemas"]["DashboardOverview"];
type HeatmapPoint = components["schemas"]["HeatmapPoint"];

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const settled = await Promise.allSettled([
    serverApiFetch<{ data?: Overview }>("/dashboard/overview"),
    serverApiFetch<{ data?: HeatmapPoint[] }>("/dashboard/heatmap"),
    serverApiFetch<{ data?: HeatmapPoint[] }>("/dashboard/risk-index"),
    serverApiFetch<{ data?: DashboardBreakdownsData }>("/audit/sessions/dashboard-breakdowns"),
  ]);

  const [overviewRes, heatmapRes, riskRes, breakdownsRes] = settled;

  let error: ApiError | null = null;

  const overview =
    overviewRes.status === "fulfilled" ? (overviewRes.value.data ?? null) : null;
  const heatmap =
    heatmapRes.status === "fulfilled" ? (heatmapRes.value.data ?? []) : [];
  const riskIndex =
    riskRes.status === "fulfilled" ? (riskRes.value.data ?? []) : [];
  const breakdowns =
    breakdownsRes.status === "fulfilled" ? (breakdownsRes.value.data ?? null) : null;

  const rejected = settled.find((r) => r.status === "rejected");
  if (rejected && rejected.status === "rejected") {
    error = rejected.reason instanceof ApiError ? rejected.reason : new ApiError(0, null, "unknown_error");
  }

  return <DashboardView payload={{ overview, heatmap, riskIndex, breakdowns, error }} />;
}