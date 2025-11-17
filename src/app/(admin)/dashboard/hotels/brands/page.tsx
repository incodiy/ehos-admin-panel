import { AdminPageHeader } from "@/components/admin/design-system";
import { serverApiFetch, ApiError } from "@/lib/api/client";
import type { BrandListResult } from "./brands-client";
import { BrandsClient } from "./brands-client";

interface BrandsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    tier?: string;
    status?: string;
  }>;
}

export default async function BrandsPage({ searchParams }: BrandsPageProps) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const search = sp.search ?? "";
  const tier = sp.tier ?? "ALL";
  const status = sp.status ?? "ALL";

  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("per_page", "50");
  if (search) qs.set("search", search);
  if (tier && tier !== "ALL") qs.set("tier", tier);
  if (status && status !== "ALL") qs.set("status", status);

  let result: BrandListResult | null = null;
  let error: ApiError | null = null;
  try {
    result = await serverApiFetch<BrandListResult>(`/brands?${qs.toString()}`);
  } catch (e) {
    error = e instanceof ApiError ? e : new ApiError(0, null, "unknown_error");
  }

  return (
    <>
      <AdminPageHeader titleKey="brands.title" subtitleKey="brands.subtitle" iconKey="building" />
      <BrandsClient
        result={result}
        error={error}
        page={page}
        currentSearch={search}
        currentTierFilter={tier}
        currentStatusFilter={status}
      />
    </>
  );
}