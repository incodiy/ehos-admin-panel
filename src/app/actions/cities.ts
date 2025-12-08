"use server";

import { revalidatePath } from "next/cache";
import { ApiError, serverApiFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi";

export type City = components["schemas"]["City"];
export type CityCreateRequest = components["schemas"]["CityCreateRequest"];
export type CityUpdateRequest = components["schemas"]["CityUpdateRequest"];

type ActionOutcome<T = unknown> = {
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

/** Ambil daftar master kota — GET /cities */
export async function listCitiesAction(params?: {
  province_id?: string;
  region_id?: string;
  search?: string;
}): Promise<ActionOutcome<City[]>> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.province_id) searchParams.set("province_id", params.province_id);
    if (params?.region_id) searchParams.set("region_id", params.region_id);
    if (params?.search) searchParams.set("search", params.search);

    const qs = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const res = await serverApiFetch<{ data?: City[] }>(`/cities${qs}`);
    return { ok: true, data: res.data ?? [] };
  } catch (err) {
    return wrapError(err);
  }
}

/** Detail satu master kota — GET /cities/{id} */
export async function getCityAction(cityId: string): Promise<ActionOutcome<City>> {
  try {
    const res = await serverApiFetch<{ data?: City }>(`/cities/${encodeURIComponent(cityId)}`);
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** Tambah master kota baru — POST /cities */
export async function createCityAction(payload: CityCreateRequest): Promise<ActionOutcome<City>> {
  try {
    const res = await serverApiFetch<{ data?: City }>("/cities", {
      method: "POST",
      body: payload,
    });
    revalidatePath("/dashboard/hotels/cities");
    revalidatePath("/dashboard/hotels");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** Update master kota — PATCH /cities/{id} */
export async function updateCityAction(
  cityId: string,
  payload: CityUpdateRequest,
): Promise<ActionOutcome<City>> {
  try {
    const res = await serverApiFetch<{ data?: City }>(`/cities/${encodeURIComponent(cityId)}`, {
      method: "PATCH",
      body: payload,
    });
    revalidatePath("/dashboard/hotels/cities");
    revalidatePath(`/dashboard/hotels/cities/${encodeURIComponent(cityId)}/edit`);
    revalidatePath("/dashboard/hotels");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** Hapus master kota — DELETE /cities/{id} */
export async function deleteCityAction(
  cityId: string,
): Promise<ActionOutcome<{ id: string; name: string; deleted: boolean }>> {
  try {
    const res = await serverApiFetch<{ data?: { id: string; name: string; deleted: boolean } }>(
      `/cities/${encodeURIComponent(cityId)}`,
      {
        method: "DELETE",
      },
    );
    revalidatePath("/dashboard/hotels/cities");
    revalidatePath("/dashboard/hotels");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}
