import { AdminPageHeader } from "@/components/admin/design-system";
import { serverApiFetch, ApiError } from "@/lib/api/client";
import type { HotelListResult } from "./hotels-client";
import { HotelsClient } from "./hotels-client";

export const dynamic = "force-dynamic";

export default async function HotelsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    brand_tier?: string;
    city?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");

  const queryParts: string[] = [];
  if (page > 1) queryParts.push(`page=${page}`);
  if (params.search) {
    queryParts.push(`search=${encodeURIComponent(params.search)}`);
  }
  if (params.status && params.status !== "ALL") {
    queryParts.push(`status=${encodeURIComponent(params.status)}`);
  }
  if (params.brand_tier) {
    queryParts.push(`brand_tier=${encodeURIComponent(params.brand_tier)}`);
  }
  if (params.city) {
    queryParts.push(`city=${encodeURIComponent(params.city)}`);
  }

  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

  let result: HotelListResult | null = null;
  let error: ApiError | null = null;
  try {
    result = await serverApiFetch<HotelListResult>(`/hotels${queryString}`);
  } catch (e) {
    error = e instanceof ApiError ? e : new ApiError(0, null, "unknown_error");
  }

  return (
    <>
      <AdminPageHeader
        titleKey="hotels.title"
        subtitleKey="hotels.subtitle"
        iconKey="hotel"
      />
      <HotelsClient
        result={result}
        error={error}
        page={page}
        currentSearch={params.search ?? ""}
        currentStatusFilter={params.status ?? "ALL"}
      />
    </>
  );
}