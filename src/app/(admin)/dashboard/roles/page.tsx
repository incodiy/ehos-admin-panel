import { AdminPageHeader } from "@/components/admin/design-system";
import { serverApiFetch, ApiError } from "@/lib/api/client";
import type { RoleListResult } from "./roles-client";
import { RolesClient } from "./roles-client";

export default async function RolesPage() {
  let result: RoleListResult | null = null;
  let error: ApiError | null = null;
  try {
    result = await serverApiFetch<RoleListResult>(`/roles`);
  } catch (e) {
    error = e instanceof ApiError ? e : new ApiError(0, null, "unknown_error");
  }

  return (
    <>
      <AdminPageHeader titleKey="roles.title" subtitleKey="roles.subtitle" iconKey="shield" />
      <RolesClient result={result} error={error} />
    </>
  );
}