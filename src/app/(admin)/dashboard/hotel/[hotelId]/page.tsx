import { ApiError, serverApiFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi";
import { DrilldownClient } from "./_components/drilldown-client";

type YoYPoint = components["schemas"]["YoYPoint"];

interface DrilldownData {
  hotel_id?: string;
  code?: string;
  name?: string;
  score_history?: YoYPoint[];
  open_capa_count?: number;
  risk_level?: components["schemas"]["HeatmapPoint"]["risk_level"];
}

export const dynamic = "force-dynamic";

export default async function HotelDrilldownPage({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const { hotelId } = await params;

  let data: DrilldownData | null = null;
  let error: ApiError | null = null;

  try {
    const res = await serverApiFetch<{ data?: DrilldownData }>(`/dashboard/hotels/${hotelId}`);
    data = res.data ?? null;
  } catch (e) {
    error = e instanceof ApiError ? e : new ApiError(0, null, "unknown_error");
  }

  return <DrilldownClient data={data} error={error} />;
}