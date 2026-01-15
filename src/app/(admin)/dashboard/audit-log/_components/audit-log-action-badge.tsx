"use client";

import {
  PlusCircle,
  Edit3,
  CheckCircle2,
  KeyRound,
  LogIn,
  ShieldCheck,
  AlertTriangle,
  UserX,
  CreditCard,
  FileCheck,
  Sparkles,
} from "lucide-react";

interface AuditLogActionBadgeProps {
  action: string;
}

export function AuditLogActionBadge({ action }: AuditLogActionBadgeProps) {
  const act = action.toUpperCase();

  // Color & Icon mapping based on semantic domain action
  if (act.includes("CREATE") || act.includes("REGISTER") || act.includes("START")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs font-mono">
        <PlusCircle className="w-3 h-3 text-emerald-500 shrink-0" />
        {action}
      </span>
    );
  }

  if (act.includes("UPDATE") || act.includes("EDIT") || act.includes("CHANGE")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-2xs font-mono">
        <Edit3 className="w-3 h-3 text-amber-500 shrink-0" />
        {action}
      </span>
    );
  }

  if (act.includes("PUBLISH") || act.includes("SUBMIT") || act.includes("VERIF") || act.includes("APPROVE")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 shadow-2xs font-mono">
        <ShieldCheck className="w-3 h-3 text-sky-500 shrink-0" />
        {action}
      </span>
    );
  }

  if (act.includes("PAID") || act.includes("BILLING") || act.includes("INVOICE")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 shadow-2xs font-mono">
        <CreditCard className="w-3 h-3 text-teal-500 shrink-0" />
        {action}
      </span>
    );
  }

  if (act.includes("PASSWORD") || act.includes("RESET")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 shadow-2xs font-mono">
        <KeyRound className="w-3 h-3 text-rose-500 shrink-0" />
        {action}
      </span>
    );
  }

  if (act.includes("DEACTIVATE") || act.includes("DELETE") || act.includes("SUSPEND")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 shadow-2xs font-mono">
        <UserX className="w-3 h-3 text-rose-500 shrink-0" />
        {action}
      </span>
    );
  }

  if (act.includes("LOGIN") || act.includes("LOGOUT") || act.includes("AUTH")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60 shadow-2xs font-mono">
        <LogIn className="w-3 h-3 text-violet-500 shrink-0" />
        {action}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 shadow-2xs font-mono">
      <Sparkles className="w-3 h-3 opacity-60 shrink-0" />
      {action}
    </span>
  );
}
