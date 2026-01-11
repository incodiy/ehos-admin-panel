import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/design-system";
import { serverApiFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi";
import { UserEditClient } from "@/app/(admin)/dashboard/users/[id]/edit/user-edit-client";

type User = components["schemas"]["User"];
type RoleWithPermissions = components["schemas"]["RoleWithPermissions"];
type Hotel = components["schemas"]["Hotel"];
type Region = { id: string; name: string; code: string };

export default async function UserEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let user: User | null = null;
  let roles: RoleWithPermissions[] = [];
  let hotels: Hotel[] = [];
  let regions: Region[] = [];

  try {
    const [userRes, rolesRes, hotelsRes, regionsRes] = await Promise.all([
      serverApiFetch<{ data?: User }>(`/users/${encodeURIComponent(id)}`),
      serverApiFetch<{ data?: RoleWithPermissions[] }>("/roles").catch(() => ({ data: [] })),
      serverApiFetch<{ data?: Hotel[] }>("/hotels?per_page=200").catch(() => ({ data: [] })),
      serverApiFetch<{ data?: Region[] }>("/regions?per_page=200").catch(() => ({ data: [] })),
    ]);

    user = userRes.data ?? null;
    roles = rolesRes.data ?? [];
    hotels = hotelsRes.data ?? [];
    regions = regionsRes.data ?? [];
  } catch {
    notFound();
  }

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <AdminPageHeader
        titleKey="users.edit.title"
        subtitleKey="users.edit.subtitle"
        iconKey="users"
      />
      <UserEditClient
        user={user}
        roles={roles}
        hotels={hotels}
        regions={regions}
      />
    </div>
  );
}
