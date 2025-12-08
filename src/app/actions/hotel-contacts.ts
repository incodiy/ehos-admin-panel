"use server";

import { revalidatePath } from "next/cache";
import { ApiError, serverApiFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi";

export type HotelContact = components["schemas"]["HotelContact"];
export type HotelContactCreateRequest = components["schemas"]["HotelContactCreateRequest"];
export type HotelContactGlobalCreateRequest = components["schemas"]["HotelContactGlobalCreateRequest"];
export type HotelContactUpdateRequest = components["schemas"]["HotelContactUpdateRequest"];

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

/** Ambil daftar seluruh kontak PIC global — GET /hotel-contacts */
export async function listGlobalHotelContactsAction(params?: {
  contact_type?: string;
  hotel_code?: string;
  hotel_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<ActionOutcome<HotelContact[]>> {
  try {
    const q = new URLSearchParams();
    if (params?.contact_type) q.set("contact_type", params.contact_type);
    if (params?.hotel_code) q.set("hotel_code", params.hotel_code);
    if (params?.hotel_id) q.set("hotel_id", params.hotel_id);
    if (params?.search) q.set("search", params.search);
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.offset) q.set("offset", String(params.offset));

    const path = `/hotel-contacts${q.toString() ? `?${q.toString()}` : ""}`;
    const res = await serverApiFetch<{ data?: HotelContact[] }>(path);
    return { ok: true, data: res.data ?? [] };
  } catch (err) {
    return wrapError(err);
  }
}

/** Tambah kontak PIC hotel global baru — POST /hotel-contacts */
export async function createGlobalHotelContactAction(
  payload: HotelContactGlobalCreateRequest,
): Promise<ActionOutcome<HotelContact>> {
  try {
    const res = await serverApiFetch<{ data?: HotelContact }>("/hotel-contacts", {
      method: "POST",
      body: payload,
    });
    revalidatePath("/dashboard/hotels/contacts");
    revalidatePath("/dashboard/hotels");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** Update kontak PIC hotel global — PATCH /hotel-contacts/{id} */
export async function updateGlobalHotelContactAction(
  id: string,
  payload: HotelContactUpdateRequest,
): Promise<ActionOutcome<HotelContact>> {
  try {
    const res = await serverApiFetch<{ data?: HotelContact }>(
      `/hotel-contacts/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: payload,
      },
    );
    revalidatePath("/dashboard/hotels/contacts");
    revalidatePath("/dashboard/hotels");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** Hapus kontak PIC hotel global — DELETE /hotel-contacts/{id} */
export async function deleteGlobalHotelContactAction(
  id: string,
): Promise<ActionOutcome<{ id: string; deleted: boolean }>> {
  try {
    const res = await serverApiFetch<{ data?: { id: string; deleted: boolean } }>(
      `/hotel-contacts/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    );
    revalidatePath("/dashboard/hotels/contacts");
    revalidatePath("/dashboard/hotels");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** Ambil daftar kontak PIC untuk satu hotel — GET /hotels/{codeOrId}/contacts */
export async function getHotelContactsAction(
  hotelCodeOrId: string,
): Promise<ActionOutcome<HotelContact[]>> {
  try {
    const res = await serverApiFetch<{ data?: HotelContact[] }>(
      `/hotels/${encodeURIComponent(hotelCodeOrId)}/contacts`,
    );
    return { ok: true, data: res.data ?? [] };
  } catch (err) {
    return wrapError(err);
  }
}

/** Tambah kontak PIC hotel baru — POST /hotels/{codeOrId}/contacts */
export async function createHotelContactAction(
  hotelCodeOrId: string,
  payload: HotelContactCreateRequest,
): Promise<ActionOutcome<HotelContact>> {
  try {
    const res = await serverApiFetch<{ data?: HotelContact }>(
      `/hotels/${encodeURIComponent(hotelCodeOrId)}/contacts`,
      {
        method: "POST",
        body: payload,
      },
    );
    revalidatePath(`/dashboard/hotels/${encodeURIComponent(hotelCodeOrId)}`);
    revalidatePath(`/dashboard/hotels/${encodeURIComponent(hotelCodeOrId)}/edit`);
    revalidatePath("/dashboard/hotels/contacts");
    revalidatePath("/dashboard/hotels");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** Update kontak PIC hotel — PATCH /hotels/{codeOrId}/contacts/{contactId} */
export async function updateHotelContactAction(
  hotelCodeOrId: string,
  contactId: string,
  payload: HotelContactUpdateRequest,
): Promise<ActionOutcome<HotelContact>> {
  try {
    const res = await serverApiFetch<{ data?: HotelContact }>(
      `/hotels/${encodeURIComponent(hotelCodeOrId)}/contacts/${encodeURIComponent(contactId)}`,
      {
        method: "PATCH",
        body: payload,
      },
    );
    revalidatePath(`/dashboard/hotels/${encodeURIComponent(hotelCodeOrId)}`);
    revalidatePath(`/dashboard/hotels/${encodeURIComponent(hotelCodeOrId)}/edit`);
    revalidatePath("/dashboard/hotels/contacts");
    revalidatePath("/dashboard/hotels");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** Hapus kontak PIC hotel — DELETE /hotels/{codeOrId}/contacts/{contactId} */
export async function deleteHotelContactAction(
  hotelCodeOrId: string,
  contactId: string,
): Promise<ActionOutcome<{ id: string; deleted: boolean }>> {
  try {
    const res = await serverApiFetch<{ data?: { id: string; deleted: boolean } }>(
      `/hotels/${encodeURIComponent(hotelCodeOrId)}/contacts/${encodeURIComponent(contactId)}`,
      {
        method: "DELETE",
      },
    );
    revalidatePath(`/dashboard/hotels/${encodeURIComponent(hotelCodeOrId)}`);
    revalidatePath(`/dashboard/hotels/${encodeURIComponent(hotelCodeOrId)}/edit`);
    revalidatePath("/dashboard/hotels/contacts");
    revalidatePath("/dashboard/hotels");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}
