import { AdminPageHeader } from "@/components/admin/design-system";
import { serverApiFetch, ApiError } from "@/lib/api/client";
import type { City } from "@/app/actions/cities";
import type { Province, Region } from "@/app/actions/hotels";
import { CitiesClient } from "./cities-client";

interface CitiesPageProps {
  searchParams: Promise<{
    search?: string;
    province_id?: string;
    region_id?: string;
  }>;
}

export default async function CitiesPage({ searchParams }: CitiesPageProps) {
  const sp = await searchParams;
  const search = sp.search ?? "";
  const provinceId = sp.province_id ?? "ALL";
  const regionId = sp.region_id ?? "ALL";

  const qs = new URLSearchParams();
  if (search) qs.set("search", search);
  if (provinceId && provinceId !== "ALL") qs.set("province_id", provinceId);
  if (regionId && regionId !== "ALL") qs.set("region_id", regionId);

  let cities: City[] = [];
  let provinces: Province[] = [];
  let regions: Region[] = [];
  let error: ApiError | null = null;

  try {
    const [citiesRes, provincesRes, regionsRes] = await Promise.all([
      serverApiFetch<{ data?: City[] }>(`/cities${qs.toString() ? `?${qs.toString()}` : ""}`),
      serverApiFetch<{ data?: Province[] }>("/provinces").catch(() => ({ data: [] })),
      serverApiFetch<{ data?: Region[] }>("/regions").catch(() => ({ data: [] })),
    ]);
    cities = citiesRes.data ?? [];
    provinces = provincesRes.data ?? [];
    regions = regionsRes.data ?? [];
  } catch (e) {
    error = e instanceof ApiError ? e : new ApiError(0, null, "unknown_error");
  }

  return (
    <>
      <AdminPageHeader
        titleKey="cities.title"
        subtitleKey="cities.subtitle"
        iconKey="map-pin"
      />
      <CitiesClient
        cities={cities}
        provinces={provinces}
        regions={regions}
        error={error}
        currentSearch={search}
        currentProvince={provinceId}
        currentRegion={regionId}
      />
    </>
  );
}
