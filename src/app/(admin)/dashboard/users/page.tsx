import { AdminPageHeader } from "@/components/admin/design-system";
import { serverApiFetch, ApiError } from "@/lib/api/client";
import type { UserListResult } from "./users-client";
import { UsersClient } from "./users-client";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const query = page > 1 ? `?page=${page}` : "";

  let result: UserListResult | null = null;
  let error: ApiError | null = null;
  try {
    result = await serverApiFetch<UserListResult>(`/users${query}`);
  } catch (e) {
    error = e instanceof ApiError ? e : new ApiError(0, null, "unknown_error");
  }

  return (
    <>
      <AdminPageHeader titleKey="users.title" subtitleKey="users.subtitle" iconKey="users" />
      <UsersClient result={result} error={error} page={page} />
    </>
  );
}