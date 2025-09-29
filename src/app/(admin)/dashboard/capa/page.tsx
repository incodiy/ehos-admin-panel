import { AdminPageHeader } from "@/components/admin/design-system";
import { getServerSession } from "@/lib/auth/session";
import { serverApiFetch, ApiError } from "@/lib/api/client";
import { CapaTicketsClient, type CapaTicketListResult } from "./capa-tickets-client";

export interface CapaFilters {
  status?: string;
  priority?: string;
}

export default async function CapaPage({ searchParams }: { searchParams: Promise<CapaFilters> }) {
  const params = await searchParams;
  const session = await getServerSession();

  const query = new URLSearchParams();
  const status = params.status?.toUpperCase();
  if (status) query.set("status", status);
  if (params.priority) query.set("priority", params.priority);
  if (session?.activeHotel?.id) query.set("hotel_id", session.activeHotel.id);

  let result: CapaTicketListResult | null = null;
  let error: ApiError | null = null;
  try {
    result = await serverApiFetch<CapaTicketListResult>(`/capa/tickets?${query.toString()}`);
  } catch (e) {
    error = e instanceof ApiError ? e : new ApiError(0, null, "unknown_error");
  }

  return (
    <>
      <AdminPageHeader titleKey="capa.title" subtitleKey="capa.subtitle" iconKey="shield-alert" />
      <CapaTicketsClient result={result} error={error} filters={{ status, priority: params.priority }} />
    </>
  );
}