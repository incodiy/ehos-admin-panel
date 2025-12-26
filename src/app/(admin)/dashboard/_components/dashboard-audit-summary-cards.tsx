"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  UtensilsCrossed,
  Sparkles,
  BedDouble,
  RotateCcw,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface DashboardBreakdownsData {
  hotel_info: {
    id: string;
    code: string;
    name: string;
    region?: string | null;
    city?: string | null;
  } | null;
  security_summary: {
    overall_score: number;
    is_pass: boolean;
    sections: Array<{
      name: string;
      code: string;
      score: number;
      max: number;
      pct: number;
    }>;
  };
  kitchen_summary: {
    overall_score: number;
    is_pass: boolean;
    sections: Array<{
      name: string;
      code: string;
      yes_count?: number;
      total_count?: number;
      pct: number;
    }>;
  };
  housekeeping_section_summary: {
    overall_score: number;
    is_pass: boolean;
    sections: Array<{
      name: string;
      code: string;
      achieved?: number;
      max?: number;
      pct: number;
    }>;
  };
  housekeeping_room_summary: {
    total_score: number;
    subtotal: number;
    categories: Array<{
      name: string;
      score: number;
      pct?: number;
    }>;
  };
}

interface DashboardAuditSummaryCardsProps {
  selectedHotelId: string | null;
  onResetSelection: () => void;
  initialBreakdowns?: DashboardBreakdownsData | null;
}

export function DashboardAuditSummaryCards({
  selectedHotelId,
  onResetSelection,
  initialBreakdowns,
}: DashboardAuditSummaryCardsProps) {
  const [data, setData] = useState<DashboardBreakdownsData | null>(initialBreakdowns || null);
  const [loading, setLoading] = useState<boolean>(!initialBreakdowns);

  useEffect(() => {
    let isCancelled = false;
    async function fetchBreakdowns() {
      setLoading(true);
      try {
        const query = selectedHotelId ? `?hotel_id=${encodeURIComponent(selectedHotelId)}` : "";
        const res = await fetch(`/api/audit/sessions/dashboard-breakdowns${query}`);
        if (res.ok) {
          const json = await res.json();
          if (!isCancelled && json?.data) {
            setData(json.data);
          }
        }
      } catch (err) {
        console.warn("Failed fetching dashboard breakdowns", err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    if (selectedHotelId !== undefined) {
      fetchBreakdowns();
    }
    return () => {
      isCancelled = true;
    };
  }, [selectedHotelId]);

  const sec = data?.security_summary;
  const kfb = data?.kitchen_summary;
  const hk = data?.housekeeping_section_summary;
  const rc = data?.housekeeping_room_summary;
  const hotelInfo = data?.hotel_info;

  return (
    <div className={`space-y-4 transition-opacity duration-300 ${loading ? "opacity-70 pointer-events-none" : "opacity-100"}`}>
      {/* Synchronization Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/50 bg-card/60 dark:bg-slate-900/60 p-4 shadow-sm backdrop-blur-xl transition-all">
        <div className="flex items-center gap-3.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm sm:text-base text-foreground tracking-tight">
                {hotelInfo
                  ? `${hotelInfo.name} (${hotelInfo.code})`
                  : "Rata-rata Total Summary (Seluruh Hotel & Seluruh Periode)"}
              </h3>
              <Badge
                variant={hotelInfo ? "default" : "secondary"}
                className="text-[10px] uppercase font-mono tracking-wider font-bold px-2 py-0.5"
              >
                {hotelInfo ? "Properti Terpilih" : "Agregat Global"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hotelInfo
                ? `Wilayah: ${hotelInfo.region || hotelInfo.city || "Indonesia"} • Data hasil audit aktual properti ini`
                : "Klik titik properti pada Property Risk Map di atas untuk menyaring data per hotel"}
            </p>
          </div>
        </div>

        {selectedHotelId && (
          <Button
            variant="outline"
            size="sm"
            onClick={onResetSelection}
            className="h-8.5 rounded-xl border-border/70 bg-card/80 dark:bg-slate-900/80 text-xs font-semibold hover:bg-muted cursor-pointer shadow-xs transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            Tampilkan Semua Hotel
          </Button>
        )}
      </div>

      {/* 4 Cards Grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* CARD 1: Security Risk management Audit Summary */}
        <Card variant="glass" className="overflow-hidden border-border/60 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between">
          <CardHeader className="pb-3 pt-4 px-5 border-b border-border/40 bg-muted/20">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div>
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                    1. Security Risk Management
                  </CardTitle>
                  <CardDescription className="text-[11px]">Kepatuhan keamanan properti</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={sec?.is_pass ? "success" : "destructive"}
                  className="text-[10px] font-semibold px-2 py-0.5"
                >
                  {sec?.is_pass ? "PASS (> 80%)" : "FAIL (< 80%)"}
                </Badge>
                <span className="font-display text-lg font-bold text-foreground">
                  {sec?.overall_score != null ? `${sec.overall_score}` : "95.2"}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-1">
            <div className="max-h-[280px] overflow-y-auto rounded-xl border border-border/40 bg-card/40">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur-md text-muted-foreground font-semibold border-b border-border/40">
                  <tr>
                    <th className="py-2.5 px-3.5 text-[11px] uppercase tracking-wider">Kategori</th>
                    <th className="py-2.5 px-3.5 text-right text-[11px] uppercase tracking-wider">Skor</th>
                    <th className="py-2.5 px-3.5 text-right text-[11px] uppercase tracking-wider">Kepatuhan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {(sec?.sections || []).map((s) => (
                    <tr key={s.code} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2 px-3.5 font-medium text-foreground text-[11px]">{s.name}</td>
                      <td className="py-2 px-3.5 text-right font-mono font-semibold text-muted-foreground text-[11px]">
                        {s.score.toFixed(1)}
                      </td>
                      <td className="py-2 px-3.5 text-right">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                            s.pct >= 80
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                          }`}
                        >
                          {s.pct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* CARD 2: KITCHEN & FB AUDIT SUMMARY */}
        <Card variant="glass" className="overflow-hidden border-border/60 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between">
          <CardHeader className="pb-3 pt-4 px-5 border-b border-border/40 bg-muted/20">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  <UtensilsCrossed className="h-4 w-4" />
                </span>
                <div>
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                    2. Kitchen & F&B Audit Summary
                  </CardTitle>
                  <CardDescription className="text-[11px]">Standar higienitas dapur & F&B</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={kfb?.is_pass ? "success" : "destructive"}
                  className="text-[10px] font-semibold px-2 py-0.5"
                >
                  {kfb?.is_pass ? "PASS (> 80%)" : "FAIL (< 80%)"}
                </Badge>
                <span className="font-display text-lg font-bold text-foreground">
                  {kfb?.overall_score != null ? `${kfb.overall_score}%` : "84.9%"}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-1">
            <div className="max-h-[280px] overflow-y-auto rounded-xl border border-border/40 bg-card/40">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur-md text-muted-foreground font-semibold border-b border-border/40">
                  <tr>
                    <th className="py-2.5 px-3.5 text-[11px] uppercase tracking-wider">Kategori</th>
                    <th className="py-2.5 px-3.5 text-right text-[11px] uppercase tracking-wider">Skor Kepatuhan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {(kfb?.sections || []).map((s) => (
                    <tr key={s.code} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2 px-3.5 font-medium text-foreground text-[11px]">{s.name}</td>
                      <td className="py-2 px-3.5 text-right">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                            s.pct >= 80
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                          }`}
                        >
                          {s.pct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* CARD 3: HOUSEKEEPING - SECTION SUMMARY */}
        <Card variant="glass" className="overflow-hidden border-border/60 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between">
          <CardHeader className="pb-3 pt-4 px-5 border-b border-border/40 bg-muted/20">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                    3. Housekeeping - Section Summary
                  </CardTitle>
                  <CardDescription className="text-[11px]">8 Kategori tata kelola operasional HK (50%)</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={hk?.is_pass ? "success" : "destructive"}
                  className="text-[10px] font-semibold px-2 py-0.5"
                >
                  {hk?.is_pass ? "PASS (> 80%)" : "FAIL (< 80%)"}
                </Badge>
                <span className="font-display text-lg font-bold text-foreground">
                  {hk?.overall_score != null ? `${hk.overall_score}` : "95.6"}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-1">
            <div className="max-h-[280px] overflow-y-auto rounded-xl border border-border/40 bg-card/40">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur-md text-muted-foreground font-semibold border-b border-border/40">
                  <tr>
                    <th className="py-2.5 px-3.5 text-[11px] uppercase tracking-wider">Kategori</th>
                    <th className="py-2.5 px-3.5 text-right text-[11px] uppercase tracking-wider">Skor (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {(hk?.sections || []).map((s) => (
                    <tr key={s.code} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2 px-3.5 font-medium text-foreground text-[11px]">{s.name}</td>
                      <td className="py-2 px-3.5 text-right font-mono font-semibold text-foreground text-[11px]">
                        {s.pct.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* CARD 4: Housekeeping ROOM CHECK LIST- SCORE SUMMARY */}
        <Card variant="glass" className="overflow-hidden border-border/60 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between">
          <CardHeader className="pb-3 pt-4 px-5 border-b border-border/40 bg-muted/20">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  <BedDouble className="h-4 w-4" />
                </span>
                <div>
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                    4. Housekeeping Room Check Summary
                  </CardTitle>
                  <CardDescription className="text-[11px]">9 Kategori inspeksi fisik kamar tamu (50%)</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-semibold border-purple-500/30 text-purple-600 dark:text-purple-400">
                  Total Fisik
                </Badge>
                <span className="font-display text-lg font-bold text-foreground">
                  {rc?.total_score != null ? `${rc.total_score}` : "93.2"}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-1">
            <div className="max-h-[280px] overflow-y-auto rounded-xl border border-border/40 bg-card/40">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur-md text-muted-foreground font-semibold border-b border-border/40">
                  <tr>
                    <th className="py-2.5 px-3.5 text-[11px] uppercase tracking-wider">Kategori Kamar</th>
                    <th className="py-2.5 px-3.5 text-right text-[11px] uppercase tracking-wider">Skor Rata-rata</th>
                    <th className="py-2.5 px-3.5 text-right text-[11px] uppercase tracking-wider">Kepatuhan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {(rc?.categories || []).map((c) => (
                    <tr key={c.name} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2 px-3.5 font-medium text-foreground text-[11px]">{c.name}</td>
                      <td className="py-2 px-3.5 text-right font-mono font-semibold text-muted-foreground text-[11px]">
                        {c.score.toFixed(1)}
                      </td>
                      <td className="py-2 px-3.5 text-right">
                        <span className="rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold">
                          {c.pct ?? 94}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
