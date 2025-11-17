import { AdminPageHeader } from "@/components/admin/design-system";
import { serverApiFetch, ApiError } from "@/lib/api/client";
import type { RegionListResult } from "./regions-client";
import { RegionsClient } from "./regions-client";

interface RegionsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function RegionsPage({ searchParams }: RegionsPageProps) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const search = sp.search ?? "";
  const status = sp.status ?? "ALL";

  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("per_page", "50");
  if (search) qs.set("search", search);
  if (status && status !== "ALL") qs.set("status", status);

  let result: RegionListResult | null = null;
  let error: ApiError | null = null;
  try {
    result = await serverApiFetch<RegionListResult>(`/regions?${qs.toString()}`);
  } catch (e) {
    error = e instanceof ApiError ? e : new ApiError(0, null, "unknown_error");
  }

  return (
    <>
      <AdminPageHeader titleKey="regions.title" subtitleKey="regions.subtitle" iconKey="map-pin" />
      <RegionsClient
        result={result}
        error={error}
        page={page}
        currentSearch={search}
        currentStatusFilter={status}
      />
    </>
  );
}