import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/design-system";
import { serverApiFetch } from "@/lib/api/client";
import type { RoleWithPermissions, Permission } from "@/app/actions/roles";
import type { components } from "@/lib/api/openapi";
import { RoleDetailClient } from "@/app/(admin)/dashboard/roles/[id]/role-detail-client";

type User = components["schemas"]["User"];

export default async function RoleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let role: RoleWithPermissions | null = null;
  let permissionsCatalog: Record<string, Permission[]> = {};
  let assignedUsers: User[] = [];

  try {
    const [roleRes, permRes] = await Promise.all([
      serverApiFetch<{ data?: RoleWithPermissions }>(`/roles/${encodeURIComponent(id)}`),
      serverApiFetch<{ data?: Record<string, Permission[]> }>("/permissions").catch(() => ({
        data: {},
      })),
    ]);

    role = roleRes.data ?? null;
    permissionsCatalog = permRes.data ?? {};

    if (role?.code) {
      const usersRes = await serverApiFetch<{ data?: User[] }>(
        `/users?role_code=${encodeURIComponent(role.code)}&per_page=50`
      ).catch(() => ({ data: [] }));
      assignedUsers = usersRes.data ?? [];
    }
  } catch {
    notFound();
  }

  if (!role) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <AdminPageHeader
        titleKey="roles.detail.title"
        subtitleKey="roles.detail.subtitle"
        subtitleValues={{ roleName: role.name || role.code || "" }}
        iconKey="shield"
      />
      <RoleDetailClient
        role={role}
        permissionsCatalog={permissionsCatalog}
        assignedUsers={assignedUsers}
      />
    </div>
  );
}
