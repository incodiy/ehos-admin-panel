import { AdminPageHeader } from "@/components/admin/design-system";
import { serverApiFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi";
import { UserCreateClient } from "@/app/(admin)/dashboard/users/create/user-create-client";

type RoleWithPermissions = components["schemas"]["RoleWithPermissions"];
type Hotel = components["schemas"]["Hotel"];
type Region = { id: string; name: string; code: string };

export default async function UserCreatePage() {
  const [rolesRes, hotelsRes, regionsRes] = await Promise.all([
    serverApiFetch<{ data?: RoleWithPermissions[] }>("/roles").catch(() => ({ data: [] })),
    serverApiFetch<{ data?: Hotel[] }>("/hotels?per_page=200").catch(() => ({ data: [] })),
    serverApiFetch<{ data?: Region[] }>("/regions?per_page=200").catch(() => ({ data: [] })),
  ]);

  const roles = rolesRes.data ?? [];
  const hotels = hotelsRes.data ?? [];
  const regions = regionsRes.data ?? [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <AdminPageHeader
        titleKey="users.create.title"
        subtitleKey="users.create.subtitle"
        iconKey="users"
      />
      <UserCreateClient roles={roles} hotels={hotels} regions={regions} />
    </div>
  );
}
