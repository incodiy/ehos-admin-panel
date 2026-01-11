"use server";

import { revalidatePath } from "next/cache";
import { ApiError, serverApiFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi";

export type User = components["schemas"]["User"];
export type Role = components["schemas"]["Role"];
export type RoleWithPermissions = components["schemas"]["RoleWithPermissions"];
export type UserCreateRequest = components["schemas"]["UserCreateRequest"];
export type UserUpdateRequest = components["schemas"]["UserUpdateRequest"];
export type ResetPasswordRequest = {
  new_password: string;
};
export type Hotel = components["schemas"]["Hotel"];

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

/** Buat pengguna baru — POST /users */
export async function createUserAction(
  payload: UserCreateRequest,
): Promise<ActionOutcome<User>> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: User }>(
      "/users",
      {
        method: "POST",
        body: payload,
      },
    );
    revalidatePath("/dashboard/users");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** Update profil/penugasan pengguna — PATCH /users/{id} */
export async function updateUserAction(
  userId: string,
  payload: UserUpdateRequest,
): Promise<ActionOutcome<User>> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: User }>(
      `/users/${encodeURIComponent(userId)}`,
      {
        method: "PATCH",
        body: payload,
      },
    );
    revalidatePath("/dashboard/users");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** Toggle soft delete (deactivate / restore) — DELETE /users/{id} */
export async function toggleUserStatusAction(
  userId: string,
): Promise<ActionOutcome<void>> {
  try {
    await serverApiFetch<void>(`/users/${encodeURIComponent(userId)}`, {
      method: "DELETE",
    });
    revalidatePath("/dashboard/users");
    return { ok: true };
  } catch (err) {
    return wrapError(err);
  }
}

/** Reset password pengguna — POST /users/{id}/reset-password */
export async function resetPasswordAction(
  userId: string,
  payload: ResetPasswordRequest,
): Promise<ActionOutcome<void>> {
  try {
    await serverApiFetch<void>(
      `/users/${encodeURIComponent(userId)}/reset-password`,
      {
        method: "POST",
        body: payload,
      },
    );
    return { ok: true };
  } catch (err) {
    return wrapError(err);
  }
}

/** Ambil daftar master roles untuk dropdown */
export async function getRolesAction(): Promise<ActionOutcome<RoleWithPermissions[]>> {
  try {
    const res = await serverApiFetch<{ data?: RoleWithPermissions[] }>("/roles");
    return { ok: true, data: res.data ?? [] };
  } catch (err) {
    return wrapError(err);
  }
}

/** Ambil daftar master hotels untuk assignment */
export async function getUserAction(
  userId: string,
): Promise<ActionOutcome<User>> {
  try {
    const res = await serverApiFetch<{ data?: User }>(
      `/users/${encodeURIComponent(userId)}`,
    );
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

export async function getHotelsAction(): Promise<ActionOutcome<Hotel[]>> {
  try {
    const res = await serverApiFetch<{ data?: Hotel[] }>("/hotels?per_page=200");
    return { ok: true, data: res.data ?? [] };
  } catch (err) {
    return wrapError(err);
  }
}

export async function getRegionsAction(): Promise<ActionOutcome<Array<{ id: string; name: string; code: string }>>> {
  try {
    const res = await serverApiFetch<{ data?: Array<{ id: string; name: string; code: string }> }>("/regions?per_page=200");
    return { ok: true, data: res.data ?? [] };
  } catch (err) {
    return wrapError(err);
  }
}
