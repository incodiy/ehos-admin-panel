import { AdminPageHeader } from "@/components/admin/design-system";
import { serverApiFetch, ApiError } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi";
import type { UserListResult } from "./users-client";
import { UsersClient } from "./users-client";

type RoleWithPermissions = components["schemas"]["RoleWithPermissions"];
type Hotel = components["schemas"]["Hotel"];

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    role_code?: string;
    hotel_id?: string;
    status?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const search = params.search ?? "";
  const roleCode = params.role_code ?? "";
  const hotelId = params.hotel_id ?? "";
  const statusFilter = params.status ?? "ACTIVE";

  const qs = new URLSearchParams();
  if (page > 1) qs.set("page", String(page));
  if (search.trim()) qs.set("search", search.trim());
  if (roleCode.trim()) qs.set("role_code", roleCode.trim());
  if (hotelId.trim()) qs.set("hotel_id", hotelId.trim());
  if (statusFilter.trim()) qs.set("status", statusFilter.trim());

  const queryString = qs.toString() ? `?${qs.toString()}` : "";

  let result: UserListResult | null = null;
  let error: ApiError | null = null;
  let roles: RoleWithPermissions[] = [];
  let hotels: Hotel[] = [];

  try {
    const [usersRes, rolesRes, hotelsRes] = await Promise.all([
      serverApiFetch<UserListResult>(`/users${queryString}`),
      serverApiFetch<{ data?: RoleWithPermissions[] }>("/roles").catch(() => ({ data: [] })),
      serverApiFetch<{ data?: Hotel[] }>("/hotels?per_page=200").catch(() => ({ data: [] })),
    ]);
    result = usersRes;
    roles = rolesRes.data ?? [];
    hotels = hotelsRes.data ?? [];
  } catch (e) {
    error = e instanceof ApiError ? e : new ApiError(0, null, "unknown_error");
  }

  return (
    <>
      <AdminPageHeader titleKey="users.title" subtitleKey="users.subtitle" iconKey="users" />
      <UsersClient
        result={result}
        error={error}
        page={page}
        roles={roles}
        hotels={hotels}
        currentSearch={search}
        currentRoleFilter={roleCode}
        currentHotelFilter={hotelId}
        currentStatusFilter={statusFilter}
      />
    </>
  );
}