import { API_BASE_URL } from "@/lib/api/client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface SystemStats {
  total_hotels: number;
  system_uptime_pct: number;
  total_departments: number;
  system_version: string;
  ticker_items: string[];
}

const CANONICAL_STATS: SystemStats = {
  total_hotels: 92,
  system_uptime_pct: 99.2,
  total_departments: 3,
  system_version: "2.0",
  ticker_items: [
    "EHOS v2.0 • Audit & CAPA Module Aktif",
    "92 Hotel Tersinkronisasi di Jaringan",
    "Four-Eyes Compliance Workflow Aktif",
    "Manajemen Perbaikan & Temuan Terintegrasi",
    "Platform Operasional Hospitality Enterprise",
    "Checklist Multi-Departemen & Scoring Otomatis",
  ],
};

export async function GET() {
  try {
    const upstream = await fetch(`${API_BASE_URL}/frontpage/system/stats`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });

    if (upstream.ok) {
      const json = await upstream.json();
      return NextResponse.json(json);
    }
  } catch {
    // Upstream unreachable or container running older image
  }

  // Fallback to canonical data
  return NextResponse.json({
    status: "success",
    data: CANONICAL_STATS,
  });
}
