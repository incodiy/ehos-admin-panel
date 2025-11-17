"use client";

import { useTranslations } from "next-intl";
import { Shield } from "lucide-react";
import { StatusPill, type Column } from "@/components/admin/data-table";
import { ModuleList } from "@/components/admin/module-list";
import { ApiError } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi.d";

type Role = components["schemas"]["RoleWithPermissions"];

export type RoleListResult = {
  success?: boolean;
  data?: Role[];
};

export function RolesClient({
  result,
  error,
}: {
  result: RoleListResult | null;
  error: ApiError | null;
}) {
  const t = useTranslations();
  const rows: Role[] = result?.data ?? [];

  const columns: Column<Role>[] = [
    {
      key: "code",
      label_id: t("roles.cols.code"),
      label_en: t("roles.cols.code"),
      render: (_, row) => <span className="font-mono text-xs font-semibold">{row.code}</span>,
    },
    { key: "name", label_id: t("roles.cols.name"), label_en: t("roles.cols.name") },
    {
      key: "scope_level",
      label_id: t("roles.cols.scope"),
      label_en: t("roles.cols.scope"),
      render: (_, row) => t(`roles.scope${row.scope_level ?? 0}` as never),
    },
    {
      key: "is_system",
      label_id: t("roles.cols.system"),
      label_en: t("roles.cols.system"),
      render: (_, row) => (
        <StatusPill tone={row.is_system ? "on" : "wait"}>
          {row.is_system ? t("roles.systemYes") : t("roles.systemNo")}
        </StatusPill>
      ),
    },
    {
      key: "permissions",
      label_id: t("roles.cols.permissions"),
      label_en: t("roles.cols.permissions"),
      render: (_, row) => (
        <span className="text-xs text-muted-foreground">
          {t("roles.permissionCount", { count: row.permissions?.length ?? 0 })}
        </span>
      ),
    },
  ];

  return (
    <ModuleList<Role>
      columns={columns}
      rows={rows}
      rowKey={(row) => row.id ?? row.code ?? ""}
      error={error}
      page={1}
      icon={Shield}
      emptyKey="roles.empty"
      totalKey="roles.total"
      errorTitleKey="roles.errorTitle"
      errorNetworkKey="roles.errorNetwork"
      errorServerKey="roles.errorServer"
      retryKey="roles.retry"
    />
  );
}