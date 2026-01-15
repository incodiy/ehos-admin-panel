import { AdminPageHeader } from "@/components/admin/design-system";
import { serverApiFetch, ApiError } from "@/lib/api/client";
import type { AuditLogListResult } from "./audit-log-client";
import { AuditLogClient } from "./audit-log-client";

interface AuditLogPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    entity_type?: string;
    action?: string;
    from_date?: string;
    to_date?: string;
  }>;
}

export default async function AuditLogPage({ searchParams }: AuditLogPageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const search = params.search ?? "";
  const entityType = params.entity_type ?? "";
  const action = params.action ?? "";

  const qs = new URLSearchParams();
  if (page > 1) qs.set("page", String(page));
  if (search.trim()) qs.set("search", search.trim());
  if (entityType.trim()) qs.set("entity_type", entityType.trim());
  if (action.trim()) qs.set("action", action.trim());

  const queryString = qs.toString() ? `?${qs.toString()}` : "";

  let result: AuditLogListResult | null = null;
  let error: ApiError | null = null;
  try {
    result = await serverApiFetch<AuditLogListResult>(`/audit/logs${queryString}`);
  } catch (e) {
    error = e instanceof ApiError ? e : new ApiError(0, null, "unknown_error");
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader titleKey="auditLog.title" subtitleKey="auditLog.subtitle" iconKey="database" />
      <AuditLogClient
        result={result}
        error={error}
        page={page}
        currentSearch={search}
        currentEntityType={entityType}
        currentAction={action}
      />
    </div>
  );
}