import { AdminPageHeader } from "@/components/admin/design-system";
import { getServerSession } from "@/lib/auth/session";
import { serverApiFetch, ApiError } from "@/lib/api/client";
import type { HotelAuditSummary, DashboardBreakdownsData } from "@/app/actions/audit";
import { AuditSessionsClient } from "./audit-sessions-client";

export interface AuditFilters {
  department?: string;
  status?: string;
  year?: string;
  search?: string;
}

export const dynamic = "force-dynamic";

export default async function AuditsPage({ searchParams }: { searchParams: Promise<AuditFilters> }) {
  const params = await searchParams;
  const session = await getServerSession();

  const query = new URLSearchParams();
  const department = params.department?.toUpperCase();
  const status = params.status?.toUpperCase();
  const year = params.year ? Number(params.year) : undefined;
  if (department) query.set("department", department);
  if (status) query.set("status", status);
  if (year) query.set("year", String(year));
  if (session?.activeHotel?.id) query.set("hotel_id", session.activeHotel.id);

  let hotelSummaries: HotelAuditSummary[] = [];
  let error: ApiError | null = null;
  try {
    const res = await serverApiFetch<{ data?: HotelAuditSummary[] }>(
      `/audit/sessions/hotel-summaries${query.toString() ? `?${query.toString()}` : ""}`
    );
    hotelSummaries = res.data ?? [];
  } catch (e) {
    error = e instanceof ApiError ? e : new ApiError(0, null, "unknown_error");
  }

  let initialBreakdowns: DashboardBreakdownsData | null = null;
  try {
    const bQuery = new URLSearchParams();
    if (session?.activeHotel?.id) bQuery.set("hotel_id", session.activeHotel.id);
    if (year) bQuery.set("year", String(year));
    const bRes = await serverApiFetch<{ data?: DashboardBreakdownsData }>(
      `/audit/sessions/dashboard-breakdowns${bQuery.toString() ? `?${bQuery.toString()}` : ""}`
    );
    initialBreakdowns = bRes.data ?? null;
  } catch {
    // Non-blocking fallback
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
        hotelSummaries={hotelSummaries}
        initialBreakdowns={initialBreakdowns}
        error={error}
        filters={{ department, status, year }}
        hotels={hotels}
        canCreate={canCreate}
      />
    </>
  );
}