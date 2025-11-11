"use server";

import { revalidatePath } from "next/cache";
import { ApiError, serverApiFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi";

export type Hotel = components["schemas"]["Hotel"];
export type HotelCreateRequest = components["schemas"]["HotelCreateRequest"];
export type HotelUpdateRequest = components["schemas"]["HotelUpdateRequest"];
export type Brand = components["schemas"]["Brand"];
export type Region = components["schemas"]["Region"];
export type Province = components["schemas"]["Province"];

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

/** Tambah master hotel baru — POST /hotels */
export async function createHotelAction(
  payload: HotelCreateRequest,
): Promise<ActionOutcome<Hotel>> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: Hotel }>(
      "/hotels",
      {
        method: "POST",
        body: payload,
      },
    );
    revalidatePath("/dashboard/hotels");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** Update master hotel — PATCH /hotels/{codeOrId} */
export async function updateHotelAction(
  codeOrId: string,
  payload: HotelUpdateRequest,
): Promise<ActionOutcome<Hotel>> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: Hotel }>(
      `/hotels/${encodeURIComponent(codeOrId)}`,
      {
        method: "PATCH",
        body: payload,
      },
    );
    revalidatePath("/dashboard/hotels");
    revalidatePath(`/dashboard/hotels/${encodeURIComponent(codeOrId)}/edit`);
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** Soft delete master hotel — DELETE /hotels/{codeOrId} */
export async function deleteHotelAction(
  codeOrId: string,
): Promise<ActionOutcome<{ id: string; code: string; deleted: boolean }>> {
  try {
    const res = await serverApiFetch<{
      success?: boolean;
      data?: { id: string; code: string; deleted: boolean };
    }>(`/hotels/${encodeURIComponent(codeOrId)}`, {
      method: "DELETE",
    });
    revalidatePath("/dashboard/hotels");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

export type HotelFormDataOptions = {
  brands: Brand[];
  regions: Region[];
  provinces: Province[];
  gms: Array<{ id: string; name: string }>;
  roms: Array<{ id: string; name: string }>;
};

/** Ambil seluruh options master data untuk form input hotel */
export async function getHotelFormDataAction(): Promise<ActionOutcome<HotelFormDataOptions>> {
  try {
    const [brandsRes, regionsRes, provincesRes, usersRes] = await Promise.all([
      serverApiFetch<{ data?: Brand[] }>("/brands").catch(() => ({ data: [] })),
      serverApiFetch<{ data?: Region[] }>("/regions").catch(() => ({ data: [] })),
      serverApiFetch<{ data?: Province[] }>("/provinces").catch(() => ({ data: [] })),
      serverApiFetch<{ data?: Array<{ id: string; name: string; role_code?: string }> }>("/users").catch(() => ({ data: [] })),
    ]);

    const users = usersRes.data ?? [];
    const gms = users.filter((u) => u.role_code === "HOTEL_GM");
    const roms = users.filter((u) => u.role_code === "REGIONAL_ROM");

    return {
      ok: true,
      data: {
        brands: brandsRes.data ?? [],
        regions: regionsRes.data ?? [],
        provinces: provincesRes.data ?? [],
        gms: gms.map((g) => ({ id: g.id, name: g.name })),
        roms: roms.map((r) => ({ id: r.id, name: r.name })),
      },
    };
  } catch (err) {
    return wrapError(err);
  }
}
