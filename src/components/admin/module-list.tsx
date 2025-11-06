"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { DataTable, type Column } from "./data-table";

export interface ModuleListMeta {
  total?: number;
  last_page?: number | null;
}

interface ModuleListProps<T extends object> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  error: ApiError | null;
  meta?: ModuleListMeta;
  page: number;
  icon: LucideIcon;
  onRowClick?: (row: T) => void;
  pageHref?: (page: number) => string;
  headerSlot?: React.ReactNode;
  errorTitleKey: string;
  errorNetworkKey: string;
  errorServerKey: string;
  retryKey: string;
  emptyKey: string;
  totalKey: string;
}

/**
 * Kotak list modul admin seragam (G2 3b): kartu + DataTable + footer paginasi
 * + state error jujur (G4). Dipakai semua halaman CRUD singkat (users, roles,
 * hotels, regions, brands, quotations, billing, audit log).
 */
export function ModuleList<T extends object>({
  columns,
  rows,
  rowKey,
  error,
  meta,
  page,
  icon: Icon,
  onRowClick,
  pageHref,
  headerSlot,
  errorTitleKey,
  errorNetworkKey,
  errorServerKey,
  retryKey,
  emptyKey,
  totalKey,
}: ModuleListProps<T>) {
  const t = useTranslations();
  const pathname = usePathname();

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center">
        <Icon className="mx-auto h-10 w-10 text-destructive" />
        <p className="mt-3 font-semibold">{t(errorTitleKey)}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {error.status === 0 ? t(errorNetworkKey) : t(errorServerKey, { status: error.status })}
        </p>
        <Link
          href={pathname}
          className="mt-4 inline-block rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:opacity-90"
        >
          {t(retryKey)}
        </Link>
      </div>
    );
  }

  const href = pageHref ?? ((p: number) => `${pathname}${p > 1 ? `?page=${p}` : ""}`);

  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-elegant backdrop-blur-xl">
      {headerSlot && <div className="mb-4">{headerSlot}</div>}
      <DataTable<T>
        columns={columns}
        data={rows}
        rowKey={rowKey}
        isLoading={false}
        emptyMessage={t(emptyKey)}
        enableExport
        enableColumnToggle
        enableColumnResizing
        enableFullscreen
        onRowClick={onRowClick}
      />
      {meta && meta.total !== undefined && meta.last_page != null && (
        <div className="mt-2 flex items-center justify-between gap-2 px-2">
          <p className="text-xs text-muted-foreground">{t(totalKey, { total: meta.total })}</p>
          {meta.last_page > 1 && (
            <div className="flex items-center gap-1 text-xs">
              <Link
                href={href(Math.max(1, page - 1))}
                className={`rounded-lg border border-border px-2.5 py-1 transition-smooth hover:border-primary/50 ${
                  page <= 1 ? "pointer-events-none opacity-40" : ""
                }`}
              >
                {t("common.previous")}
              </Link>
              <span className="px-2 text-muted-foreground">
                {page} / {meta.last_page}
              </span>
              <Link
                href={href(page + 1)}
                className={`rounded-lg border border-border px-2.5 py-1 transition-smooth hover:border-primary/50 ${
                  page >= (meta.last_page ?? 1) ? "pointer-events-none opacity-40" : ""
                }`}
              >
                {t("common.next")}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}