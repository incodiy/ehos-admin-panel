"use client";

import { useTranslations } from "next-intl";
import { Users } from "lucide-react";
import { StatusPill, type Column } from "@/components/admin/data-table";
import { ModuleList } from "@/components/admin/module-list";
import { ApiError } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi.d";

type User = components["schemas"]["User"];

export type UserListResult = {
  success?: boolean;
  data?: User[];
  meta?: components["schemas"]["PaginationMeta"];
};

const fmtDateTime = (v?: string | null) =>
  v ? new Date(v).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "—";

export function UsersClient({
  result,
  error,
  page,
}: {
  result: UserListResult | null;
  error: ApiError | null;
  page: number;
}) {
  const t = useTranslations();
  const rows: User[] = result?.data ?? [];

  const columns: Column<User>[] = [
    {
      key: "name",
      label_id: t("users.cols.name"),
      label_en: t("users.cols.name"),
      render: (_, row) => (
        <span className="block font-medium">
          {row.name || row.email}
          <span className="block text-xs font-normal text-muted-foreground">{row.email}</span>
        </span>
      ),
    },
    {
      key: "phone",
      label_id: t("users.cols.phone"),
      label_en: t("users.cols.phone"),
      render: (_, row) => <span>{row.phone ?? "—"}</span>,
    },
    {
      key: "preferred_locale",
      label_id: t("users.cols.locale"),
      label_en: t("users.cols.locale"),
      render: (_, row) =>
        row.preferred_locale === "en" ? t("users.localeEn") : t("users.localeId"),
    },
    {
      key: "is_active",
      label_id: t("users.cols.active"),
      label_en: t("users.cols.active"),
      render: (_, row) => (
        <StatusPill tone={row.is_active ? "on" : "off"}>
          {row.is_active ? t("users.active") : t("users.inactive")}
        </StatusPill>
      ),
    },
    {
      key: "last_login_at",
      label_id: t("users.cols.lastLogin"),
      label_en: t("users.cols.lastLogin"),
      render: (_, row) => <span className="whitespace-nowrap text-xs">{fmtDateTime(row.last_login_at)}</span>,
    },
  ];

  return (
    <ModuleList<User>
      columns={columns}
      rows={rows}
      rowKey={(row) => row.id ?? row.email ?? ""}
      error={error}
      meta={result?.meta}
      page={page}
      icon={Users}
      emptyKey="users.empty"
      totalKey="users.total"
      errorTitleKey="users.errorTitle"
      errorNetworkKey="users.errorNetwork"
      errorServerKey="users.errorServer"
      retryKey="users.retry"
    />
  );
}