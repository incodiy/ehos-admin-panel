import { AdminPageHeader } from "@/components/admin/design-system";
import { getServerSession } from "@/lib/auth/session";
import { serverApiFetch, ApiError } from "@/lib/api/client";
import type { AuditSessionListResult } from "@/app/actions/audit";
import { AuditSessionsClient } from "./audit-sessions-client";

export interface AuditFilters {
  department?: string;
  status?: string;
  page?: string;
}

export const dynamic = "force-dynamic";

export default async function AuditsPage({ searchParams }: { searchParams: Promise<AuditFilters> }) {
  const params = await searchParams;
  const session = await getServerSession();

  const query = new URLSearchParams();
  const department = params.department?.toUpperCase();
  const status = params.status?.toUpperCase();
  if (department) query.set("department", department);
  if (status) query.set("status", status);
  const page = Number(params.page ?? "1");
  if (page > 1) query.set("page", String(page));
  if (session?.activeHotel?.id) query.set("hotel_id", session.activeHotel.id);

  let result: AuditSessionListResult | null = null;
  let error: ApiError | null = null;
  try {
    result = await serverApiFetch<AuditSessionListResult>(`/audit/sessions?${query.toString()}`);
  } catch (e) {
    error = e instanceof ApiError ? e : new ApiError(0, null, "unknown_error");
  }

  let hotels: Array<{ id: string; code: string; name: string }> = [];
  try {
    const hotelsRes = await serverApiFetch<{ data?: Array<{ id: string; code: string; name: string }> }>("/hotels?limit=200");
    hotels = hotelsRes.data ?? [];
  } catch {
    if (session?.activeHotel) {
      hotels = [{
        id: session.activeHotel.id ?? "",
        code: session.activeHotel.code ?? "",
        name: session.activeHotel.name ?? "",
      }];
    }
  }

  const userRoles = session?.roles?.map((r) => r.code ?? "") ?? [];
  const canCreate = userRoles.includes("ROOT_ADMIN") || userRoles.includes("CORP_AUDITOR");

  return (
    <>
      <AdminPageHeader titleKey="audit.title" subtitleKey="audit.subtitle" iconKey="list-checks" />
      <AuditSessionsClient
        result={result}
        error={error}
        filters={{ department, status, page }}
        hotels={hotels}
        canCreate={canCreate}
      />
    </>
  );
}