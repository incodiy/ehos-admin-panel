import { AdminPageHeader } from "@/components/admin/design-system";
import { getServerSession } from "@/lib/auth/session";
import { ApiError, serverApiFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi";
import { BrandTierManager } from "./brand-tier-manager";

export const dynamic = "force-dynamic";
export type Brand = components["schemas"]["Brand"];

export default async function BrandTiersPage() {
  await getServerSession();
  let brands: Brand[] = [];
  let error: ApiError | null = null;
  try {
    const res = await serverApiFetch<{ data?: Brand[] }>("/brands?per_page=100");
    brands = res.data ?? [];
  } catch (e) {
    error = e instanceof ApiError ? e : new ApiError(0, null, "unknown_error");
  }
  return (
    <>
      <AdminPageHeader titleKey="cfg.brandsTitle" subtitleKey="cfg.brandsSubtitle" iconKey="building" />
      <BrandTierManager brands={brands} error={error} />
    </>
  );
}