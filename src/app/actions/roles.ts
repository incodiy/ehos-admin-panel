"use server";

import { revalidatePath } from "next/cache";
import { ApiError, serverApiFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi";

export type RoleWithPermissions = components["schemas"]["RoleWithPermissions"];
export type Permission = components["schemas"]["Permission"];

export type ActionOutcome<T = unknown> = {
  ok: boolean;
  status?: number;
  message?: string;
  data?: T;
};

function wrapError<T>(err: unknown): ActionOutcome<T> {
  if (err instanceof ApiError) {
    const raw = err.body as { detail?: string; message?: string } | null;
    return {
      ok: false,
      status: err.status,
      message: raw?.detail ?? raw?.message ?? `http_${err.status}`,
    };
  }
  return { ok: false, status: 0, message: "network_error" };
}

/** Ambil daftar 9 master role beserta permissionnya — GET /roles */
export async function getRolesAction(): Promise<ActionOutcome<RoleWithPermissions[]>> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: RoleWithPermissions[] }>("/roles");
    return { ok: true, data: res.data ?? [] };
  } catch (err) {
    return wrapError(err);
  }
}

/** Ambil detail satu role spesifik beserta izinnya — GET /roles/{id} */
export async function getRoleDetailAction(roleId: string): Promise<ActionOutcome<RoleWithPermissions>> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: RoleWithPermissions }>(
      `/roles/${encodeURIComponent(roleId)}`
    );
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** Ambil master katalog 38 permissions dikelompokkan per modul — GET /permissions */
export async function getPermissionsCatalogAction(): Promise<ActionOutcome<Record<string, Permission[]>>> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: Record<string, Permission[]> }>("/permissions");
    return { ok: true, data: res.data ?? {} };
  } catch (err) {
    return wrapError(err);
  }
}

/** Update permission matrix role (khusus ROOT_ADMIN) — PUT /roles/{id}/permissions */
export async function updateRolePermissionsAction(
  roleId: string,
  permissionCodes: string[],
): Promise<ActionOutcome<RoleWithPermissions>> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: RoleWithPermissions }>(
      `/roles/${encodeURIComponent(roleId)}/permissions`,
      {
        method: "PUT",
        body: { permission_codes: permissionCodes },
      }
    );
    revalidatePath("/dashboard/roles");
    revalidatePath(`/dashboard/roles/${roleId}`);
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}
