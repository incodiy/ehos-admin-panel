import { AdminPageHeader } from "@/components/admin/design-system";
import { serverApiFetch, ApiError } from "@/lib/api/client";
import type { BillingListResult } from "./billing-client";
import { BillingClient } from "./billing-client";

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const query = page > 1 ? `?page=${page}` : "";

  let result: BillingListResult | null = null;
  let error: ApiError | null = null;
  try {
    result = await serverApiFetch<BillingListResult>(`/crm/billing${query}`);
  } catch (e) {
    error = e instanceof ApiError ? e : new ApiError(0, null, "unknown_error");
  }

  return (
    <>
      <AdminPageHeader titleKey="billing.title" subtitleKey="billing.subtitle" iconKey="credit-card" />
      <BillingClient result={result} error={error} page={page} />
    </>
  );
}