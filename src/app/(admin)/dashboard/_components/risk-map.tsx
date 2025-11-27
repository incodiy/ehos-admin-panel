"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Map as LeafletMap } from "leaflet";
import type { components } from "@/lib/api/openapi";
import "leaflet/dist/leaflet.css";

type HeatmapPoint = components["schemas"]["HeatmapPoint"];

const RISK_COLOR: Record<string, string> = {
  LOW: "#22c55e",
  MEDIUM: "#eab308",
  HIGH: "#f97316",
  CRITICAL: "#dc2626",
};

const RISK_RADIUS: Record<string, number> = {
  LOW: 8,
  MEDIUM: 11,
  HIGH: 14,
  CRITICAL: 17,
};

const NO_DATA_COLOR = "#94a3b8";

function riskColor(level: HeatmapPoint["risk_level"]): string {
  return level ? RISK_COLOR[level] ?? NO_DATA_COLOR : NO_DATA_COLOR;
}

function popupHtml(
  p: HeatmapPoint,
  labels: { capa: string; score: string; lifeSafety: string },
): string {
  const risk = p.risk_level ?? "—";
  const life = p.has_life_safety
    ? ' <span style="color:#dc2626;font-weight:700">&#9679;</span> ' + labels.lifeSafety
    : "";
  return (
    `<div style="font-family:inherit;font-size:12px;min-width:180px">` +
    `<div style="font-weight:700;font-size:14px">${p.code}${life}</div>` +
    `<div style="color:var(--muted-foreground,#666);margin:2px 0 6px">${p.name ?? ""}</div>` +
    `<div style="display:flex;gap:10px;align-items:center">` +
    `<span style="display:inline-block;width:10px;height:10px;border-radius:9999px;background:${riskColor(p.risk_level)}"></span>` +
    `<b>${risk}</b>` +
    `</div>` +
    `<div style="margin-top:6px;color:var(--muted-foreground,#666)">${labels.capa} <b>${p.open_capa ?? 0}</b> &middot; ${labels.score} <b>${p.score ?? "—"}</b></div>` +
    `</div>`
  );
}

export function RiskMap({ points }: { points: HeatmapPoint[] }) {
  const router = useRouter();
  const t = useTranslations();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || points.length === 0) return;

    const labels = {
      capa: t("dashboard.mapCapa"),
      score: t("dashboard.mapScore"),
      lifeSafety: t("audit.lifeSafety"),
    };

    let disposed = false;
    const timers: number[] = [];

    void (async () => {
      const mod = await import("leaflet");
      if (disposed) return;
      const L = mod.default ?? mod;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(el, {
        center: [-2, 118],
        zoom: 5,
        scrollWheelZoom: false,
        attributionControl: true,
      });
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const bounds = L.latLngBounds([] as [number, number][]);
      for (const p of points) {
        if (typeof p.lat !== "number" || typeof p.lng !== "number") continue;
        bounds.extend([p.lat, p.lng]);

        const color = riskColor(p.risk_level);
        const radius = p.risk_level ? (RISK_RADIUS[p.risk_level] ?? 8) : 6;
        const marker = L.circleMarker([p.lat, p.lng], {
          radius,
          color: "#ffffff",
          weight: 1.5,
          fillColor: color,
          fillOpacity: p.risk_level ? 0.85 : 0.35,
        });
        marker.addTo(map);
        marker.bindPopup(popupHtml(p, labels), { closeButton: true });
        marker.on("click", () => {
          if (p.hotel_id) router.push(`/dashboard/hotel/${p.hotel_id}`);
        });

        if (p.has_life_safety && p.risk_level) {
          const ring = L.circleMarker([p.lat, p.lng], {
            radius: radius + 6,
            color: "#dc2626",
            weight: 2,
            fill: false,
            opacity: 0.9,
          });
          ring.addTo(map);
          timers.push(
            window.setInterval(() => {
              if (disposed) return;
              const o = ring.options.opacity ?? 0.9;
              ring.setStyle({ opacity: o > 0.5 ? 0.15 : 0.9 });
            }, 800),
          );
        }
      }

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 8 });
      } else {
        map.setView([-2, 118], 5);
      }
    })();

    return () => {
      disposed = true;
      for (const timer of timers) window.clearInterval(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [points, router, t]);

  if (points.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60">
      <div ref={containerRef} className="h-[420px] w-full" />
      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] flex flex-wrap gap-1.5 rounded-2xl border border-border/60 bg-card/90 p-2 backdrop-blur-md">
        {(
          [
            ["LOW", "#22c55e"],
            ["MEDIUM", "#eab308"],
            ["HIGH", "#f97316"],
            ["CRITICAL", "#dc2626"],
            ["NO_DATA", "#94a3b8"],
          ] as const
        ).map(([key, color]) => (
          <span key={key} className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: color, opacity: key === "NO_DATA" ? 0.45 : 1 }}
            />
            {key === "LOW" && t("dashboard.riskLegendLow")}
            {key === "MEDIUM" && t("dashboard.riskLegendMedium")}
            {key === "HIGH" && t("dashboard.riskLegendHigh")}
            {key === "CRITICAL" && t("dashboard.riskLegendCritical")}
            {key === "NO_DATA" && t("dashboard.riskLegendNoData")}
          </span>
        ))}
      </div>
    </div>
  );
}