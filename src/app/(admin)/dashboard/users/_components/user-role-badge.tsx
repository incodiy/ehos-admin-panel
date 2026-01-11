import React from "react";
import { Shield } from "lucide-react";

interface UserRoleBadgeProps {
  roleCode?: string;
  roleName?: string;
}

export function getRoleScopeCategory(roleCode?: string): {
  category: "corporate" | "regional" | "unit" | "public";
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (roleCode?.toUpperCase()) {
    case "ROOT_ADMIN":
      return {
        category: "corporate",
        label: "Corporate (Root)",
        bg: "bg-purple-50 dark:bg-purple-950/40",
        text: "text-purple-700 dark:text-purple-300",
        border: "border-purple-200 dark:border-purple-800/60",
        dot: "bg-purple-500",
      };
    case "CORP_EXEC":
    case "CORP_AUDITOR":
      return {
        category: "corporate",
        label: "Corporate",
        bg: "bg-indigo-50 dark:bg-indigo-950/40",
        text: "text-indigo-700 dark:text-indigo-300",
        border: "border-indigo-200 dark:border-indigo-800/60",
        dot: "bg-indigo-500",
      };
    case "REGIONAL_ROM":
      return {
        category: "regional",
        label: "Regional",
        bg: "bg-sky-50 dark:bg-sky-950/40",
        text: "text-sky-700 dark:text-sky-300",
        border: "border-sky-200 dark:border-sky-800/60",
        dot: "bg-sky-500",
      };
    case "HOTEL_GM":
      return {
        category: "unit",
        label: "Unit GM",
        bg: "bg-emerald-50 dark:bg-emerald-950/40",
        text: "text-emerald-700 dark:text-emerald-300",
        border: "border-emerald-200 dark:border-emerald-800/60",
        dot: "bg-emerald-500",
      };
    case "HOTEL_HOD_TECH":
    case "HOTEL_SALES":
    case "HOTEL_FINANCE":
      return {
        category: "unit",
        label: "Unit Staff",
        bg: "bg-teal-50 dark:bg-teal-950/40",
        text: "text-teal-700 dark:text-teal-300",
        border: "border-teal-200 dark:border-teal-800/60",
        dot: "bg-teal-500",
      };
    case "PUBLIC_CLIENT":
    default:
      return {
        category: "public",
        label: "Public / External",
        bg: "bg-neutral-100 dark:bg-neutral-800/50",
        text: "text-neutral-700 dark:text-neutral-300",
        border: "border-neutral-200 dark:border-neutral-700",
        dot: "bg-neutral-400",
      };
  }
}

export function UserRoleBadge({ roleCode, roleName }: UserRoleBadgeProps) {
  const scope = getRoleScopeCategory(roleCode);
  const displayName = roleName || roleCode || "No Role";

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${scope.bg} ${scope.text} ${scope.border}`}
      >
        <Shield className="w-3.5 h-3.5 shrink-0 opacity-80" />
        <span>{displayName}</span>
      </span>
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700/60"
        title={`Scope level: ${scope.label}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${scope.dot}`} />
        {scope.label}
      </span>
    </div>
  );
}
