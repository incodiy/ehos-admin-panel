"use server";

import { revalidatePath } from "next/cache";
import { ApiError, serverApiFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi";

export type Region = components["schemas"]["Region"];
export type RegionDetail = components["schemas"]["RegionDetail"];
export type RegionCreateRequest = components["schemas"]["RegionCreateRequest"];
export type RegionUpdateRequest = components["schemas"]["RegionUpdateRequest"];

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

/** Ambil daftar wilayah dengan paginasi & filter */
export async function getRegionsAction(params?: {
  search?: string;
  status?: string;
  page?: number;
  per_page?: number;
}): Promise<ActionOutcome<{ items: Region[]; total: number; last_page: number }>> {
  try {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.status) qs.set("status", params.status);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.per_page) qs.set("per_page", String(params.per_page));

    const path = `/regions${qs.toString() ? `?${qs.toString()}` : ""}`;
    const res = await serverApiFetch<{
      success?: boolean;
      data: Region[];
      meta?: { total: number; last_page: number; current_page: number };
    }>(path);

    return {
      ok: true,
      data: {
        items: res.data ?? [],
        total: res.meta?.total ?? res.data?.length ?? 0,
        last_page: res.meta?.last_page ?? 1,
      },
    };
  } catch (err) {
    return wrapError(err);
  }
}

/** Ambil detail satu wilayah berdasarkan ID atau Code */
export async function getRegionDetailAction(id: string): Promise<ActionOutcome<RegionDetail>> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: RegionDetail }>(
      `/regions/${encodeURIComponent(id)}`,
    );
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** Tambah wilayah baru — POST /regions */
export async function createRegionAction(
  payload: RegionCreateRequest,
): Promise<ActionOutcome<Region>> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: Region; message?: string }>(
      "/regions",
      {
        method: "POST",
        body: payload,
      },
    );
    revalidatePath("/dashboard/hotels/regions");
    return { ok: true, data: res.data, message: res.message };
  } catch (err) {
    return wrapError(err);
  }
}

/** Update data wilayah — PATCH /regions/{id} */
export async function updateRegionAction(
  id: string,
  payload: RegionUpdateRequest,
): Promise<ActionOutcome<Region>> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: Region; message?: string }>(
      `/regions/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: payload,
      },
    );
    revalidatePath("/dashboard/hotels/regions");
    revalidatePath(`/dashboard/hotels/regions/${encodeURIComponent(id)}/edit`);
    return { ok: true, data: res.data, message: res.message };
  } catch (err) {
    return wrapError(err);
  }
}

/** Soft delete wilayah — DELETE /regions/{id} */
export async function deleteRegionAction(
  id: string,
): Promise<ActionOutcome<{ id: string; code: string; deleted: boolean }>> {
  try {
    const res = await serverApiFetch<{
      success?: boolean;
      data?: { id: string; code: string; deleted: boolean };
      message?: string;
    }>(`/regions/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    revalidatePath("/dashboard/hotels/regions");
    return { ok: true, data: res.data, message: res.message };
  } catch (err) {
    return wrapError(err);
  }
}
