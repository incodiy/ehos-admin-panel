"use client";

import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  Shield,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Lock,
  KeyRound,
} from "lucide-react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ApiError } from "@/lib/api/client";
import type { RoleWithPermissions } from "@/app/actions/roles";
import { getRoleScopeCategory } from "../users/_components/user-role-badge";

export type RoleListResult = {
  success?: boolean;
  data?: RoleWithPermissions[];
};

export function RolesClient({
  result,
  error,
}: {
  result: RoleListResult | null;
  error: ApiError | null;
}) {
  const t = useTranslations("roles");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedScope, setSelectedScope] = useState<string>("ALL");

  // Filtering
  const filteredRoles = useMemo(() => {
    const allRoles = result?.data ?? [];
    return allRoles.filter((role) => {
      const matchesSearch =
        !searchTerm.trim() ||
        (role.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (role.code?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

      const matchesScope =
        selectedScope === "ALL" ||
        (selectedScope === "0" && role.scope_level === 0) ||
        (selectedScope === "1" && role.scope_level === 1) ||
        (selectedScope === "2" && role.scope_level === 2) ||
        (selectedScope === "3" && role.scope_level === 3) ||
        (selectedScope === "4" && role.scope_level === 4) ||
        (selectedScope === "5" && role.scope_level === 5);

      return matchesSearch && matchesScope;
    });
  }, [result?.data, searchTerm, selectedScope]);

  const columns: Column<RoleWithPermissions>[] = [
    {
      key: "code",
      label_id: "Peran & Identitas",
      label_en: "Role & Identity",
      render: (_, r) => {
        const isRoot = r.code === "ROOT_ADMIN";
        return (
          <div className="flex flex-col gap-1 py-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/dashboard/roles/${r.id ?? r.code}`}
                className="font-semibold text-sm text-neutral-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors inline-flex items-center gap-1.5"
              >
                <span>{r.name}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-40 hover:opacity-100 transition-opacity" />
              </Link>
              {isRoot && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                  <Lock className="w-2.5 h-2.5" />
                  Sovereign
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="font-mono text-[11px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                {r.code}
              </span>
              <span>•</span>
              <span className="text-[11px]">{t(`scope${r.scope_level ?? 0}` as never)}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: "scope_level",
      label_id: "Tingkat Cakupan",
      label_en: "Scope Level",
      render: (_, r) => {
        const scope = getRoleScopeCategory(r.code);
        return (
          <div className="flex flex-col gap-1">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border w-fit ${scope.bg} ${scope.text} ${scope.border}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${scope.dot}`} />
              <span>{scope.label}</span>
            </span>
            <span className="text-[11px] text-neutral-400">
              Level {r.scope_level ?? 0} ({r.scope_level === 0 ? "Global Sovereign" : r.scope_level === 1 ? "Corporate 106 Hotel" : r.scope_level === 2 ? "Regional Cluster" : "Property Unit"})
            </span>
          </div>
        );
      },
    },
    {
      key: "permissions",
      label_id: "Hak Akses (Izin Aktif)",
      label_en: "Active Permissions",
      render: (_, r) => {
        const count = r.permissions?.length ?? 0;
        const max = 38;
        const pct = Math.min(Math.round((count / max) * 100), 100);

        return (
          <div className="flex flex-col gap-1.5 min-w-[160px]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 inline-flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-amber-500" />
                {count} / {max} Izin
              </span>
              <span className="text-[10px] font-bold text-neutral-400">{pct}%</span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  r.code === "ROOT_ADMIN"
                    ? "bg-purple-500"
                    : pct > 40
                    ? "bg-indigo-500"
                    : pct > 20
                    ? "bg-amber-500"
                    : "bg-teal-500"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: "is_system",
      label_id: "Tipe Peran",
      label_en: "Role Type",
      render: (_, r) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${
            r.is_system
              ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700"
              : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60"
          }`}
        >
          {r.is_system ? t("systemYes") : t("systemNo")}
        </span>
      ),
    },
    {
      key: "actions",
      label_id: "Aksi",
      label_en: "Actions",
      render: (_, r) => (
        <div className="flex items-center justify-end">
          <Link
            href={`/dashboard/roles/${r.id ?? r.code}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 hover:bg-amber-50 dark:bg-neutral-800 dark:hover:bg-amber-950/40 text-neutral-700 hover:text-amber-700 dark:text-neutral-300 dark:hover:text-amber-300 border border-neutral-200 dark:border-neutral-700 hover:border-amber-300 dark:hover:border-amber-800 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{t("managePermissions")}</span>
          </Link>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="p-8 text-center rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-4">
        <Shield className="w-12 h-12 text-rose-500 mx-auto opacity-80" />
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-rose-900 dark:text-rose-200">
            {t("errorTitle")}
          </h3>
          <p className="text-xs text-rose-600 dark:text-rose-400 max-w-md mx-auto">
            {error.status === 0 ? t("errorNetwork") : t("errorServer")}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-xs"
        >
          {t("retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top filter toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs">
        <div className="flex items-center gap-2.5 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedScope}
            onChange={(e) => setSelectedScope(e.target.value)}
            className="px-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
          >
            <option value="ALL">{t("allScopes")}</option>
            <option value="0">Level 0: System Sovereign (ROOT_ADMIN)</option>
            <option value="1">Level 1: Corporate (Direksi & Auditor)</option>
            <option value="2">Level 2: Regional (ROM)</option>
            <option value="3">Level 3: Unit GM (General Manager)</option>
            <option value="4">Level 4: Unit Staff (HOD / Sales / Finance)</option>
            <option value="5">Level 5: Public Portal (Klien Eksternal)</option>
          </select>
        </div>
      </div>

      {/* Main Cavable Table */}
      <DataTable
        columns={columns}
        data={filteredRoles}
        emptyMessage={t("empty")}
      />
    </div>
  );
}