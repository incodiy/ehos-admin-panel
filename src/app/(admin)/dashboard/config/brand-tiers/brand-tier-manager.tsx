"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  Filter,
  Layers,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import {
  configUpdateBrandTierAction,
  type Brand,
  type BrandTier,
} from "@/app/actions/config";
import { StatusPill } from "@/components/admin/data-table";

export const BRAND_TIERS = [
  "Luxury",
  "Upscale",
  "Boutique",
  "Midscale",
  "Budget",
  "Eco-Resort",
] as const;

type BrandTierName = (typeof BRAND_TIERS)[number];

const TIER_META: Record<
  BrandTierName,
  {
    bg: string;
    border: string;
    badge: string;
    description: string;
  }
> = {
  Luxury: {
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
    badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    description: "Standar 5-bintang+ dengan layanan bespoke dan audit Life-Safety ketat.",
  },
  Upscale: {
    bg: "bg-violet-500/5",
    border: "border-violet-500/20",
    badge: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
    description: "Hotel bisnis & MICE bintang 4-5 dengan operasional standar internasional.",
  },
  Boutique: {
    bg: "bg-pink-500/5",
    border: "border-pink-500/20",
    badge: "bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30",
    description: "Hotel berkarakter tematik/heritage dengan estetika arsitektur khas.",
  },
  Midscale: {
    bg: "bg-sky-500/5",
    border: "border-sky-500/20",
    badge: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
    description: "Akomodasi dinamis bintang 3 untuk pelancong bisnis dan keluarga.",
  },
  Budget: {
    bg: "bg-zinc-500/5",
    border: "border-zinc-500/20",
    badge: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30",
    description: "Hotel esensial bintang 2 yang mengutamakan kenyamanan dasar dan efisiensi.",
  },
  "Eco-Resort": {
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/20",
    badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    description: "Resor alam berkelanjutan dengan standar audit lingkungan khusus.",
  },
};

const STATUS_TONE_MAP: Record<string, "on" | "wait" | "off"> = {
  ACTIVE: "on",
  INACTIVE: "wait",
  RETIRED: "off",
};

type ToastKind = "error" | "success";
type Toast = { kind: ToastKind; message: string } | null;

interface Props {
  brands: Brand[];
  error: ApiError | null;
}

export function BrandTierManager({ brands, error }: Props) {
  const t = useTranslations();
  const router = useRouter();

  const [selectedTiers, setSelectedTiers] = useState<Record<string, string>>(() =>
    Object.fromEntries(brands.map((b) => [b.code, b.tier])),
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const [toast, setToast] = useState<Toast>(null);
  const [savingCode, setSavingCode] = useState<string | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);

  function flash(kind: ToastKind, message: string) {
    setToast({ kind, message });
    setTimeout(() => setToast(null), 5000);
  }

  // Ringkasan Telemetri Global
  const telemetry = useMemo(() => {
    const totalBrands = brands.length;
    const activeBrands = brands.filter((b) => b.status === "ACTIVE").length;
    const totalHotels = brands.reduce((acc, b) => acc + (b.hotels_count ?? 0), 0);

    const tierBreakdown: Record<BrandTierName, { brands: number; hotels: number }> = {
      Luxury: { brands: 0, hotels: 0 },
      Upscale: { brands: 0, hotels: 0 },
      Boutique: { brands: 0, hotels: 0 },
      Midscale: { brands: 0, hotels: 0 },
      Budget: { brands: 0, hotels: 0 },
      "Eco-Resort": { brands: 0, hotels: 0 },
    };

    brands.forEach((b) => {
      const tierName = (selectedTiers[b.code] ?? b.tier) as BrandTierName;
      if (tierBreakdown[tierName]) {
        tierBreakdown[tierName].brands += 1;
        tierBreakdown[tierName].hotels += b.hotels_count ?? 0;
      }
    });

    return { totalBrands, activeBrands, totalHotels, tierBreakdown };
  }, [brands, selectedTiers]);

  // Filter List Brand
  const filteredBrands = useMemo(() => {
    return brands.filter((b) => {
      const currentTier = selectedTiers[b.code] ?? b.tier;

      // Filter search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = b.code.toLowerCase().includes(q);
        const matchName = b.name.toLowerCase().includes(q);
        if (!matchCode && !matchName) return false;
      }

      // Filter tier
      if (filterTier !== "ALL" && currentTier !== filterTier) {
        return false;
      }

      // Filter status
      if (filterStatus !== "ALL" && b.status !== filterStatus) {
        return false;
      }

      return true;
    });
  }, [brands, selectedTiers, searchQuery, filterTier, filterStatus]);

  // Daftar brand yang diubah (dirty state)
  const modifiedCodes = useMemo(() => {
    return brands
      .filter((b) => (selectedTiers[b.code] ?? b.tier) !== b.tier)
      .map((b) => b.code);
  }, [brands, selectedTiers]);

  async function handleSaveRow(code: string) {
    if (savingCode || bulkSaving) return;
    const targetTier = selectedTiers[code] as BrandTier;
    if (!targetTier) return;

    setSavingCode(code);
    const res = await configUpdateBrandTierAction(code, targetTier);
    setSavingCode(null);

    if (res.ok) {
      flash("success", t("cfg.saved"));
      router.refresh();
    } else {
      const orig = brands.find((b) => b.code === code);
      if (orig) {
        setSelectedTiers((prev) => ({ ...prev, [code]: orig.tier }));
      }
      flash("error", res.message ?? t("cfg.actionFailed"));
    }
  }

  async function handleSaveAll() {
    if (modifiedCodes.length === 0 || bulkSaving || savingCode) return;
    setBulkSaving(true);

    let successCount = 0;
    let failCount = 0;

    for (const code of modifiedCodes) {
      const targetTier = selectedTiers[code] as BrandTier;
      const res = await configUpdateBrandTierAction(code, targetTier);
      if (res.ok) {
        successCount++;
      } else {
        failCount++;
      }
    }

    setBulkSaving(false);
    if (failCount === 0) {
      flash("success", `${successCount} tier brand berhasil diperbarui.`);
    } else {
      flash("error", `${successCount} berhasil, ${failCount} gagal diperbarui.`);
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toast && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm transition-all",
            toast.kind === "error"
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          )}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {t("cfg.loadError")} — {error.message ?? `${error.status ?? ""}`}
        </div>
      )}

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("cfg.totalBrands")}
            </span>
            <Layers className="w-4 h-4 text-primary/70" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {telemetry.totalBrands}
            </span>
            <span className="text-xs text-muted-foreground">brand terdaftar</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("cfg.activeBrands")}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {telemetry.activeBrands}
            </span>
            <span className="text-xs text-muted-foreground">
              dari {telemetry.totalBrands} brand
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("cfg.totalHotels")}
            </span>
            <Building2 className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {telemetry.totalHotels}
            </span>
            <span className="text-xs text-muted-foreground">unit hotel beroperasi</span>
          </div>
        </div>
      </div>

      {/* 6-Grid Tier Distribution Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {BRAND_TIERS.map((tierName) => {
          const meta = TIER_META[tierName];
          const stat = telemetry.tierBreakdown[tierName];
          const isSelected = filterTier === tierName;

          return (
            <button
              key={tierName}
              type="button"
              onClick={() => setFilterTier(isSelected ? "ALL" : tierName)}
              className={cn(
                "flex flex-col text-left p-3.5 rounded-2xl border transition-all cursor-pointer",
                meta.bg,
                meta.border,
                isSelected
                  ? "ring-2 ring-primary shadow-sm scale-[1.02]"
                  : "hover:border-primary/40 hover:shadow-xs",
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-[0.68rem] font-semibold border",
                    meta.badge,
                  )}
                >
                  {t(`cfg.tiers.${tierName}`)}
                </span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </div>
              <div className="mt-2 text-xs font-medium text-muted-foreground">
                <span className="text-sm font-bold text-foreground">
                  {stat.brands}
                </span>{" "}
                brand •{" "}
                <span className="font-semibold text-foreground">
                  {stat.hotels}
                </span>{" "}
                hotel
              </div>
              <p className="mt-1 text-[0.65rem] text-muted-foreground/80 line-clamp-2 leading-tight">
                {meta.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filter & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl border border-border bg-card">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("cfg.searchPlaceholder")}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Tier */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="ALL">{t("cfg.filterTier")}</option>
              {BRAND_TIERS.map((tier) => (
                <option key={tier} value={tier}>
                  {t(`cfg.tiers.${tier}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">{t("cfg.filterStatus")}</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="RETIRED">RETIRED</option>
          </select>
        </div>

        {/* Batch Save Action */}
        {modifiedCodes.length > 0 && (
          <button
            type="button"
            disabled={bulkSaving}
            onClick={handleSaveAll}
            className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {bulkSaving
              ? "Menyimpan..."
              : `Simpan Semua Perubahan (${modifiedCodes.length})`}
          </button>
        )}
      </div>

      {/* Main Interactive Matrix Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-left text-[0.7rem] uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="px-4 py-3.5">{t("cfg.brand")}</th>
                <th className="px-4 py-3.5">{t("cfg.status")}</th>
                <th className="px-4 py-3.5">{t("cfg.hotelsCount")}</th>
                <th className="px-4 py-3.5 min-w-[200px]">{t("cfg.tier")}</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredBrands.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-xs text-muted-foreground"
                  >
                    {t("cfg.noBrands")}
                  </td>
                </tr>
              ) : (
                filteredBrands.map((b) => {
                  const currentTier = selectedTiers[b.code] ?? b.tier;
                  const isDirty = currentTier !== b.tier;
                  const isSavingThis = savingCode === b.code;
                  const tone = STATUS_TONE_MAP[b.status] ?? "off";
                  const tierMeta = TIER_META[currentTier as BrandTierName] ?? TIER_META.Midscale;

                  return (
                    <tr
                      key={b.code}
                      className={cn(
                        "transition-colors hover:bg-muted/20",
                        isDirty && "bg-amber-500/5",
                      )}
                    >
                      {/* Brand Code & Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-lg border border-border bg-muted/60 text-foreground">
                            {b.code}
                          </span>
                          <div>
                            <div className="font-medium text-foreground text-xs sm:text-sm">
                              {b.name}
                            </div>
                            <span
                              className={cn(
                                "inline-flex items-center px-1.5 py-0.2 text-[0.62rem] rounded font-medium border mt-0.5",
                                tierMeta.badge,
                              )}
                            >
                              {t(`cfg.tiers.${currentTier}`)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Brand Status */}
                      <td className="px-4 py-3.5">
                        <StatusPill tone={tone}>{b.status}</StatusPill>
                      </td>

                      {/* Hotels Count */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground/70" />
                          <span>{b.hotels_count ?? 0} hotel</span>
                        </div>
                      </td>

                      {/* Tier Select Dropdown */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <select
                            value={currentTier}
                            onChange={(e) =>
                              setSelectedTiers((prev) => ({
                                ...prev,
                                [b.code]: e.target.value,
                              }))
                            }
                            className={cn(
                              "w-full px-3 py-1.5 text-xs rounded-xl border bg-background font-medium focus:outline-none focus:ring-2 focus:ring-ring transition-all",
                              isDirty
                                ? "border-amber-500 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30"
                                : "border-input text-foreground",
                            )}
                          >
                            {BRAND_TIERS.map((tier) => (
                              <option key={tier} value={tier}>
                                {t(`cfg.tiers.${tier}`)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Row Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isDirty ? (
                            <button
                              type="button"
                              disabled={isSavingThis || bulkSaving}
                              onClick={() => handleSaveRow(b.code)}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs transition-all disabled:opacity-50"
                            >
                              {isSavingThis ? "Menyimpan..." : t("cfg.saveChanges")}
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[0.68rem] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 rounded-lg">
                              <CheckCircle2 className="w-3 h-3" />
                              {t("cfg.savedBadge")}
                            </span>
                          )}

                          {/* Quick Link to Brand Edit */}
                          <Link
                            href={`/dashboard/hotels/brands/${b.code}/edit`}
                            title={t("cfg.editBrand")}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default BrandTierManager;