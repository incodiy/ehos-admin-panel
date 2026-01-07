"use client";

import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Lock,
  Search,
  KeyRound,
  Users,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  ExternalLink,
} from "lucide-react";
import type { RoleWithPermissions, Permission } from "@/app/actions/roles";
import { updateRolePermissionsAction } from "@/app/actions/roles";
import type { components } from "@/lib/api/openapi";
import { getRoleScopeCategory } from "../../users/_components/user-role-badge";

type User = components["schemas"]["User"];

interface RoleDetailClientProps {
  role: RoleWithPermissions;
  permissionsCatalog: Record<string, Permission[]>;
  assignedUsers: User[];
}

export function RoleDetailClient({
  role,
  permissionsCatalog,
  assignedUsers,
}: RoleDetailClientProps) {
  const t = useTranslations("roles");
  const router = useRouter();

  const isRootAdmin = role.code === "ROOT_ADMIN";
  const scope = getRoleScopeCategory(role.code);

  // Set of active permission codes
  const initialCodes = useMemo(
    () => (role.permissions || []).map((p) => p.code).filter(Boolean) as string[],
    [role.permissions]
  );
  const [selectedCodes, setSelectedCodes] = useState<string[]>(initialCodes);

  // Module filter and search
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModuleFilter, setActiveModuleFilter] = useState<string>("ALL");
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});

  // Submitting state & Feedback
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const modulesList = useMemo(() => Object.keys(permissionsCatalog).sort(), [permissionsCatalog]);

  const getModuleLabel = (modName: string) => {
    try {
      if (t.has(`modules.${modName}`)) {
        return t(`modules.${modName}`);
      }
    } catch {
      // fallback
    }
    return modName.replace(/_/g, " ").toUpperCase();
  };

  const toggleModuleCollapse = (moduleName: string) => {
    setCollapsedModules((prev) => ({
      ...prev,
      [moduleName]: !prev[moduleName],
    }));
  };

  const handleTogglePermission = (code: string) => {
    if (isRootAdmin) return;
    setFeedback(null);
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleBulkModuleToggle = (moduleName: string, selectAll: boolean) => {
    if (isRootAdmin) return;
    setFeedback(null);
    const modulePermCodes = (permissionsCatalog[moduleName] || [])
      .map((p) => p.code)
      .filter(Boolean) as string[];

    setSelectedCodes((prev) => {
      if (selectAll) {
        return Array.from(new Set([...prev, ...modulePermCodes]));
      } else {
        return prev.filter((c) => !modulePermCodes.includes(c));
      }
    });
  };

  const handleSavePermissions = async () => {
    if (isRootAdmin) return;
    setSaving(true);
    setFeedback(null);

    const res = await updateRolePermissionsAction(role.id ?? role.code ?? "", selectedCodes);
    setSaving(false);

    if (res.ok) {
      setFeedback({
        type: "success",
        message: t("matrix.saveSuccess"),
      });
      router.refresh();
    } else {
      setFeedback({
        type: "error",
        message: res.message || t("matrix.saveError"),
      });
    }
  };

  // Filtered module catalog
  const filteredCatalog = useMemo(() => {
    const result: Record<string, Permission[]> = {};
    for (const [moduleName, perms] of Object.entries(permissionsCatalog)) {
      if (activeModuleFilter !== "ALL" && activeModuleFilter !== moduleName) {
        continue;
      }
      const filtered = perms.filter((p) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          (p.code?.toLowerCase().includes(q) ?? false) ||
          (p.action?.toLowerCase().includes(q) ?? false) ||
          (p.description?.toLowerCase().includes(q) ?? false)
        );
      });
      if (filtered.length > 0) {
        result[moduleName] = filtered;
      }
    }
    return result;
  }, [permissionsCatalog, activeModuleFilter, searchQuery]);

  // Authority descriptions per role (PRD §2.3)
  const getRoleAuthorityGuide = (code?: string) => {
    switch (code) {
      case "ROOT_ADMIN":
        return "Root / Sovereign Super Admin memegang kedaulatan penuh atas seluruh sistem dan seluruh 106 properti hotel. Memiliki hak mutlak mengelola akun, mendelegasikan hak GM, dan mencabut wewenang role mana pun di bawahnya tanpa batasan.";
      case "CORP_EXEC":
        return "Direksi, VP Operations, dan Owner memiliki akses eksekutif tingkat nasional (View Only) mencakup Heatmap 106 Hotel, Laporan Audit Terbit, SLA CAPA Kritis, dan Total Omset Pipeline MICE.";
      case "CORP_AUDITOR":
        return "Corporate QA Lead & Auditor memegang otoritas penuh operasional audit (Membuat sesi audit, menilai checklist, menerbitkan laporan resmi) dan merupakan satu-satunya verifikator akhir penyelesaian tiket CAPA.";
      case "REGIONAL_ROM":
        return "Regional Operations Manager mengawasi kluster hotel dalam regionalnya (View Only), menerima alert eskalasi jika ada tiket CAPA yang melewati batas waktu SLA.";
      case "HOTEL_GM":
        return "General Manager memegang wewenang delegasi admin untuk mengelola staf hotel unitnya, menjadi First Approver pemeriksaan perbaikan teknisi sebelum verifikasi QA, dan menyetujui proposal diskon dinas.";
      case "HOTEL_HOD_TECH":
        return "HOD, Chief Engineer, EHK, dan Teknisi bertanggung jawab menerima tiket temuan audit (CAPA Resolver), melaksanakan perbaikan fisik, dan mengunggah foto bukti After.";
      case "HOTEL_SALES":
        return "Sales Champion mengelola pipeline leads CRM MICE unit, permohonan proposal instansi berbasis pagu SBM, dan pencatatan komisi cross-property referral.";
      case "HOTEL_FINANCE":
        return "Finance Unit bertanggung jawab mengelola dokumen dinas (SPK, NPWP, BAST, LPJ) dan memantau milestone pelunasan tagihan kementerian/APBD menjelang tutup tahun anggaran.";
      case "PUBLIC_CLIENT":
      default:
        return "Klien instansi atau publik yang hanya memiliki hak mengirimkan formulir permintaan penawaran paket MICE (RFP) melalui frontpage portal publik.";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4">
        <Link
          href="/dashboard/roles"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t("detail.backToList")}</span>
        </Link>

        {!isRootAdmin && (
          <button
            type="button"
            onClick={handleSavePermissions}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 active:bg-primary/95 text-primary-foreground shadow-sm disabled:opacity-50 transition-all cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{t("matrix.saving")}</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{t("matrix.savePermissions")}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-start gap-3 p-4 rounded-xl border text-sm animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-destructive" />
          )}
          <div className="flex-1 font-medium">{feedback.message}</div>
        </div>
      )}

      {/* Sovereign Root Notice Banner */}
      {isRootAdmin && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-700 dark:text-purple-300 text-xs shadow-sm">
          <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-sm block">
              {t("detail.sovereignTitle")}
            </span>
            <p className="text-purple-600/90 dark:text-purple-300/90">
              {t("detail.sovereignDesc")}
            </p>
          </div>
        </div>
      )}

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Permission Matrix (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Matrix Header & Filter Box */}
          <div className="p-6 bg-card border border-border/60 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-primary" />
                  <span>{t("matrix.title")}</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("matrix.subtitle")} ({selectedCodes.length} izin aktif)
                </p>
              </div>

              {!isRootAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allCodes = Object.values(permissionsCatalog)
                        .flat()
                        .map((p) => p.code)
                        .filter(Boolean) as string[];
                      setSelectedCodes(allCodes);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border/60 transition-colors cursor-pointer"
                  >
                    {t("matrix.selectAll")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCodes([])}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border/60 transition-colors cursor-pointer"
                  >
                    {t("matrix.deselectAll")}
                  </button>
                </div>
              )}
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("matrix.searchPermission")}
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <select
                value={activeModuleFilter}
                onChange={(e) => setActiveModuleFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="ALL">Semua Modul ({modulesList.length})</option>
                {modulesList.map((m) => (
                  <option key={m} value={m}>
                    {getModuleLabel(m)} ({permissionsCatalog[m]?.length ?? 0})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Module Accordions */}
          <div className="space-y-4">
            {Object.entries(filteredCatalog).map(([moduleName, perms]) => {
              const isCollapsed = collapsedModules[moduleName] ?? false;
              const modulePermCodes = perms.map((p) => p.code).filter(Boolean) as string[];
              const activeCount = modulePermCodes.filter((c) => selectedCodes.includes(c)).length;
              const isAllModuleActive = activeCount === modulePermCodes.length && modulePermCodes.length > 0;

              return (
                <div
                  key={moduleName}
                  className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm"
                >
                  {/* Module Header */}
                  <div className="flex items-center justify-between p-4 bg-muted/30 border-b border-border/40 gap-3">
                    <button
                      type="button"
                      onClick={() => toggleModuleCollapse(moduleName)}
                      className="flex items-center gap-2.5 text-left flex-1 hover:text-primary transition-colors cursor-pointer"
                    >
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <div>
                        <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                          {getModuleLabel(moduleName)}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-normal">
                          {activeCount} dari {modulePermCodes.length} izin diizinkan
                        </span>
                      </div>
                    </button>

                    {!isRootAdmin && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleBulkModuleToggle(moduleName, !isAllModuleActive)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border/60 transition-colors cursor-pointer"
                        >
                          {isAllModuleActive ? "Matikan Modul" : "Pilih Modul"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Permissions List */}
                  {!isCollapsed && (
                    <div className="p-3 space-y-2">
                      {perms.map((p) => {
                        const isGranted = selectedCodes.includes(p.code ?? "");
                        return (
                          <div
                            key={p.code}
                            onClick={() => p.code && handleTogglePermission(p.code)}
                            className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border border-border/40 text-xs transition-all ${
                              isRootAdmin
                                ? "cursor-default opacity-90 bg-muted/20"
                                : "cursor-pointer bg-muted/20 hover:bg-muted/40"
                            }`}
                          >
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-muted border border-border/60 text-foreground">
                                  {p.code}
                                </span>
                                <span className="text-muted-foreground/60">•</span>
                                <span className="font-semibold text-foreground">
                                  {p.action}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">
                                {p.description || "Aksi modul terverifikasi"}
                              </p>
                            </div>

                            {/* Switch Toggle */}
                            <div className="pt-0.5 shrink-0">
                              <div
                                className={`w-9 h-5 rounded-full transition-colors relative ${
                                  isGranted
                                    ? isRootAdmin
                                      ? "bg-purple-600"
                                      : "bg-primary"
                                    : "bg-muted-foreground/30"
                                }`}
                              >
                                <span
                                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                                    isGranted ? "translate-x-4" : "translate-x-0"
                                  }`}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Role Metadata & Contextual Authority (5 cols, Sticky) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24 self-start">
          {/* Role Identity Card */}
          <div className="p-6 bg-card border border-border/60 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span>{t("detail.identityCard")}</span>
              </h3>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${scope.bg} ${scope.text} ${scope.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${scope.dot}`} />
                {scope.label}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] text-muted-foreground block">Nama Peran</span>
                <span className="text-sm font-semibold text-foreground">
                  {role.name}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                  <span className="text-[10px] text-muted-foreground block">Kode Peran</span>
                  <span className="font-mono font-bold text-foreground">
                    {role.code}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                  <span className="text-[10px] text-muted-foreground block">Scope Level</span>
                  <span className="font-bold text-foreground">
                    Level {role.scope_level ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Architectural Authority Box */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
              <Shield className="w-4 h-4 text-primary" />
              <span>{t("detail.authorityTitle")}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {getRoleAuthorityGuide(role.code)}
            </p>
          </div>

          {/* Assigned Users Widget */}
          <div className="p-6 bg-card border border-border/60 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  {t("detail.assignedUsersTitle")} ({assignedUsers.length})
                </h3>
              </div>
              <Link
                href="/dashboard/users"
                className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>{t("detail.viewAllUsers")}</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {assignedUsers.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">
                {t("detail.noUsers")}
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {assignedUsers.map((u) => (
                  <Link
                    key={u.id}
                    href={`/dashboard/users/${u.id}/edit`}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 hover:bg-muted/40 border border-border/40 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <span className="text-xs font-semibold text-foreground block truncate">
                        {u.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground block truncate">
                        {u.email}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 border ${
                        u.is_active
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                          : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25"
                      }`}
                    >
                      {u.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
