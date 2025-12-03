import { AdminPageHeader } from "@/components/admin/design-system";
import { serverApiFetch, ApiError } from "@/lib/api/client";
import type { QuotationListResult } from "./quotations-client";
import { QuotationsClient } from "./quotations-client";

export default async function QuotationsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const query = page > 1 ? `?page=${page}` : "";

  let result: QuotationListResult | null = null;
  let error: ApiError | null = null;
  try {
    result = await serverApiFetch<QuotationListResult>(`/crm/quotations${query}`);
  } catch (e) {
    error = e instanceof ApiError ? e : new ApiError(0, null, "unknown_error");
  }

  return (
    <>
      <AdminPageHeader titleKey="quotations.title" subtitleKey="quotations.subtitle" iconKey="file-text" />
      <QuotationsClient result={result} error={error} page={page} />
    </>
  );
}