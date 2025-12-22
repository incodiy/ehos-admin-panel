import { AdminPageHeader } from "@/components/admin/design-system";
import { getServerSession } from "@/lib/auth/session";
import { serverApiFetch, ApiError } from "@/lib/api/client";
import { CapaTicketsClient, type CapaTicketListResult } from "./capa-tickets-client";

export interface CapaFilters {
  status?: string;
  priority?: string;
  only_overdue?: string;
  hotel_id?: string;
}

export type HotelSummary = {
  id: string;
  name: string;
  code: string;
  city?: string;
};

export default async function CapaPage({ searchParams }: { searchParams: Promise<CapaFilters> }) {
  const params = await searchParams;
  const session = await getServerSession();

  const activeHotelId = params.hotel_id || session?.activeHotel?.id;

  const query = new URLSearchParams();
  const status = params.status?.toUpperCase();
  if (status) query.set("status", status);
  if (params.priority) query.set("priority", params.priority);
  if (params.only_overdue === "1") query.set("only_overdue", "true");
  if (activeHotelId) query.set("hotel_id", activeHotelId);

  let result: CapaTicketListResult | null = null;
  let error: ApiError | null = null;
  let targetHotel: HotelSummary | null = null;

  try {
    const [ticketsRes, hotelRes, usersRes] = await Promise.all([
      serverApiFetch<CapaTicketListResult>(`/capa/tickets?${query.toString()}`),
      activeHotelId
        ? serverApiFetch<{ data?: HotelSummary }>(`/hotels/${activeHotelId}`).catch(() => null)
        : Promise.resolve(null),
      serverApiFetch<{ data?: Array<{ id: string; name: string; email?: string; role_code?: string }> }>("/users?per_page=100").catch(() => ({ data: [] })),
    ]);
    result = ticketsRes;
    if (hotelRes && hotelRes.data) {
      targetHotel = hotelRes.data;
    }
    const initialResolvers = usersRes?.data ?? [];

    return (
      <>
        <AdminPageHeader titleKey="capa.title" subtitleKey="capa.subtitle" iconKey="shield-alert" />
        <CapaTicketsClient
          result={result}
          error={error}
          filteredHotel={targetHotel}
          initialResolvers={initialResolvers}
          filters={{
            status,
            priority: params.priority,
            only_overdue: params.only_overdue === "1",
            hotel_id: activeHotelId,
          }}
        />
      </>
    );
  } catch (err) {
    if (err instanceof ApiError) {
      error = err;
    } else {
      error = new ApiError(500, "Failed to load CAPA tickets");
    }

    return (
      <>
        <AdminPageHeader titleKey="capa.title" subtitleKey="capa.subtitle" iconKey="shield-alert" />
        <CapaTicketsClient
          result={null}
          error={error}
          filteredHotel={targetHotel}
          initialResolvers={[]}
          filters={{
            status,
            priority: params.priority,
            only_overdue: params.only_overdue === "1",
            hotel_id: activeHotelId,
          }}
        />
      </>
    );
  }
}