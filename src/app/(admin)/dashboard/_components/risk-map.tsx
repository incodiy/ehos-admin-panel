"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { CommandCenterMap, type CommandCenterPoint } from "@incodiy/cavaloc";
import type { components } from "@/lib/api/openapi";
import { useTheme } from "@/context/ThemeContext";

type HeatmapPoint = components["schemas"]["HeatmapPoint"];

interface RiskMapProps {
  points: HeatmapPoint[];
  selectedHotelId?: string | null;
  onSelectHotel?: (hotelId: string | null) => void;
}

export function RiskMap({ points, selectedHotelId, onSelectHotel }: RiskMapProps) {
  const t = useTranslations();
  const { theme } = useTheme();

  const centerPoints = useMemo<CommandCenterPoint[]>(() => {
    return points.map((p) => {
      const scoreVal = p.score != null ? p.score.toFixed(1) : "—";
      const pId = String(p.hotel_id ?? p.code ?? "");
      const isSelected = selectedHotelId && pId === selectedHotelId;

      return {
        id: pId,
        name: p.name ?? "",
        code: p.code,
        lat: p.lat ?? 0,
        lng: p.lng ?? 0,
        category: p.brand_tier || p.region || undefined,
        severity: p.risk_level?.toLowerCase() || "default",
        isPulsing: Boolean(p.has_life_safety || isSelected),
        metrics: [
          {
            label: t("dashboard.mapScore"),
            value: scoreVal,
          },
          {
            label: t("dashboard.mapCapa"),
            value: p.open_capa ?? 0,
          },
        ],
        action: p.hotel_id
          ? {
              label: t("dashboard.viewDetail"),
              href: `/dashboard/hotel/${p.hotel_id}`,
            }
          : undefined,
      };
    });
  }, [points, t, selectedHotelId]);

  return (
    <CommandCenterMap
      points={centerPoints}
      height="480px"
      theme={theme === "dark" ? "dark" : "light"}
      mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      locale="id"
      showFilterChips={true}
      showResetButton={true}
      showLegend={true}
      enableScrollZoom={true}
      onPointClick={(pt: CommandCenterPoint) => {
        const idStr = String(pt.id);
        if (selectedHotelId === idStr) {
          onSelectHotel?.(null);
        } else {
          onSelectHotel?.(idStr);
        }
      }}
    />
  );
}