import { cn } from "@/lib/utils";
import type { components } from "@/lib/api/openapi";

type RiskLevel = components["schemas"]["HeatmapPoint"]["risk_level"];

/** Kelas badge level risiko (konsisten dipakai indeks risiko + drilldown). */
export function riskBadgeClass(level: RiskLevel): string {
  switch (level) {
    case "CRITICAL":
      return "border-rose-500/40 bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold shadow-xs";
    case "HIGH":
      return "border-orange-500/40 bg-orange-500/15 text-orange-600 dark:text-orange-400 font-semibold shadow-xs";
    case "MEDIUM":
      return "border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold shadow-xs";
    case "LOW":
      return "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs";
    default:
      return "border-border/60 bg-muted/60 text-muted-foreground";
  }
}

/** Warna garis/dot level risiko (sinkron dengan risk-map). */
export function riskColor(level: RiskLevel): string {
  switch (level) {
    case "CRITICAL":
      return "#f43f5e";
    case "HIGH":
      return "#f97316";
    case "MEDIUM":
      return "#f59e0b";
    case "LOW":
      return "#10b981";
    default:
      return "#64748b";
  }
}

/** Warna text dan progress bar berdasarkan skor risiko numerik (0-100). */
export function scoreColor(score: number | null | undefined): { text: string; bg: string; border: string } {
  if (score == null) return { text: "text-muted-foreground", bg: "bg-muted", border: "border-border/40" };
  if (score < 60) return { text: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500", border: "border-rose-500/40" };
  if (score < 75) return { text: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500", border: "border-orange-500/40" };
  if (score < 85) return { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500", border: "border-amber-500/40" };
  return { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500", border: "border-emerald-500/40" };
}

/** Radio (0..100) untuk bar SLA/pipeline — proporsional terhadap max. */
export function pct(value: number, max: number): string {
  return max > 0 ? `${Math.max(2, Math.round((value / max) * 100))}%` : "0%";
}

export function cx(...classes: (string | false | null | undefined)[]): string {
  return cn(...classes);
}