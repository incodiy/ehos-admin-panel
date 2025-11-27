import { cn } from "@/lib/utils";
import type { components } from "@/lib/api/openapi";

type RiskLevel = components["schemas"]["HeatmapPoint"]["risk_level"];

/** Kelas badge level risiko (konsisten dipakai indeks risiko + drilldown). */
export function riskBadgeClass(level: RiskLevel): string {
  switch (level) {
    case "CRITICAL":
      return "border-destructive/30 bg-destructive/15 text-destructive";
    case "HIGH":
      return "border-orange-500/30 bg-orange-500/15 text-orange-600 dark:text-orange-400";
    case "MEDIUM":
      return "border-yellow-500/30 bg-yellow-500/15 text-yellow-600 dark:text-yellow-400";
    case "LOW":
      return "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
    default:
      return "border-border/60 bg-muted/60 text-muted-foreground";
  }
}

/** Warna garis/dot level risiko (sinkron dengan risk-map). */
export function riskColor(level: RiskLevel): string {
  switch (level) {
    case "CRITICAL":
      return "#dc2626";
    case "HIGH":
      return "#f97316";
    case "MEDIUM":
      return "#eab308";
    case "LOW":
      return "#22c55e";
    default:
      return "#94a3b8";
  }
}

/** Radio (0..100) untuk bar SLA/pipeline — proporsional terhadap max. */
export function pct(value: number, max: number): string {
  return max > 0 ? `${Math.max(2, Math.round((value / max) * 100))}%` : "0%";
}

export function cx(...classes: (string | false | null | undefined)[]): string {
  return cn(...classes);
}