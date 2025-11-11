"use server";

import { revalidatePath } from "next/cache";
import { ApiError, serverApiFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi";

export type Brand = components["schemas"]["Brand"];
export type BrandDetail = components["schemas"]["BrandDetail"];
export type BrandCreateRequest = components["schemas"]["BrandCreateRequest"];
export type BrandUpdateRequest = components["schemas"]["BrandUpdateRequest"];

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

/** Ambil daftar brand dengan paginasi & filter */
export async function getBrandsAction(params?: {
  search?: string;
  tier?: string;
  status?: string;
  page?: number;
  per_page?: number;
}): Promise<ActionOutcome<{ items: Brand[]; total: number; last_page: number }>> {
  try {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.tier) qs.set("tier", params.tier);
    if (params?.status) qs.set("status", params.status);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.per_page) qs.set("per_page", String(params.per_page));

    const path = `/brands${qs.toString() ? `?${qs.toString()}` : ""}`;
    const res = await serverApiFetch<{
      success?: boolean;
      data: Brand[];
      meta?: { total: number; total_pages?: number; page?: number; per_page?: number };
    }>(path);

    return {
      ok: true,
      data: {
        items: res.data ?? [],
        total: res.meta?.total ?? res.data?.length ?? 0,
        last_page: res.meta?.total_pages ?? 1,
      },
    };
  } catch (err) {
    return wrapError(err);
  }
}

/** Ambil detail satu brand berdasarkan ID atau Code */
export async function getBrandDetailAction(id: string): Promise<ActionOutcome<BrandDetail>> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: BrandDetail }>(
      `/brands/${encodeURIComponent(id)}`,
    );
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** Tambah brand baru — POST /brands */
export async function createBrandAction(
  payload: BrandCreateRequest,
): Promise<ActionOutcome<Brand>> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: Brand; message?: string }>(
      "/brands",
      {
        method: "POST",
        body: payload,
      },
    );
    revalidatePath("/dashboard/hotels/brands");
    revalidatePath("/dashboard/config/brand-tiers");
    return { ok: true, data: res.data, message: res.message };
  } catch (err) {
    return wrapError(err);
  }
}

/** Update data brand — PUT /brands/{id} */
export async function updateBrandAction(
  id: string,
  payload: BrandUpdateRequest,
): Promise<ActionOutcome<Brand>> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: Brand; message?: string }>(
      `/brands/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: payload,
      },
    );
    revalidatePath("/dashboard/hotels/brands");
    revalidatePath(`/dashboard/hotels/brands/${encodeURIComponent(id)}/edit`);
    revalidatePath("/dashboard/config/brand-tiers");
    return { ok: true, data: res.data, message: res.message };
  } catch (err) {
    return wrapError(err);
  }
}

/** Soft delete brand — DELETE /brands/{id} */
export async function deleteBrandAction(
  id: string,
): Promise<ActionOutcome<{ message?: string }>> {
  try {
    const res = await serverApiFetch<{
      success?: boolean;
      message?: string;
    }>(`/brands/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    revalidatePath("/dashboard/hotels/brands");
    revalidatePath("/dashboard/config/brand-tiers");
    return { ok: true, message: res.message };
  } catch (err) {
    return wrapError(err);
  }
}
