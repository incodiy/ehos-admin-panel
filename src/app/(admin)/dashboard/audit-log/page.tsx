import { AdminPageHeader } from "@/components/admin/design-system";
import { serverApiFetch, ApiError } from "@/lib/api/client";
import type { AuditLogListResult } from "./audit-log-client";
import { AuditLogClient } from "./audit-log-client";

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const query = page > 1 ? `?page=${page}` : "";

  let result: AuditLogListResult | null = null;
  let error: ApiError | null = null;
  try {
    result = await serverApiFetch<AuditLogListResult>(`/audit/logs${query}`);
  } catch (e) {
    error = e instanceof ApiError ? e : new ApiError(0, null, "unknown_error");
  }

  return (
    <>
      <AdminPageHeader titleKey="auditLog.title" subtitleKey="auditLog.subtitle" iconKey="database" />
      <AuditLogClient result={result} error={error} page={page} />
    </>
  );
}