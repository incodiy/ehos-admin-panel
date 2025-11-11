"use server";

import { revalidatePath } from "next/cache";
import { ApiError, serverApiFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi";

export type CapaTicketDetail = components["schemas"]["CapaTicket"] & {
  hotel_code?: string | null;
  assignee_name?: string | null;
  sla_status?: string | null;
  overdue?: boolean;
  media_summary?: {
    before?: { count?: number; verified?: number };
    after?: { count?: number; verified?: number };
    has_verified_after?: boolean;
    ready?: boolean;
  };
  media?: components["schemas"]["CapaMedia"][];
  history?: components["schemas"]["CapaHistory"][];
};

type ActionOutcome = {
  ok: boolean;
  status?: number;
  message?: string;
  data?: CapaTicketDetail | unknown;
};

function wrapError(err: unknown): ActionOutcome {
  if (err instanceof ApiError) {
    const raw = err.body as { message?: string } | null;
    return { ok: false, status: err.status, message: raw?.message ?? `http_${err.status}` };
  }
  return { ok: false, status: 0, message: "network_error" };
}

/** Buat tiket CAPA (finding-based atau ad-hoc manual) — POST /capa/tickets */
export async function createCapaTicketAction(payload: {
  finding_id?: string | null;
  hotel_id?: string | null;
  department?: string | null;
  priority?: number;
  title?: string;
  description?: string;
  assigned_to?: string | null;
}): Promise<ActionOutcome> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: unknown }>(
      "/capa/tickets",
      { method: "POST", body: payload },
    );
    revalidatePath("/dashboard/capa");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** Update tiket CAPA (OPEN / IN_PROGRESS) — PATCH /capa/tickets/{id} */
export async function updateCapaTicketAction(
  ticketId: string,
  payload: {
    title?: string;
    description?: string;
    priority?: number;
    assigned_to?: string | null;
    due_at?: string | null;
  },
): Promise<ActionOutcome> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: unknown }>(
      `/capa/tickets/${ticketId}`,
      { method: "PATCH", body: payload },
    );
    revalidatePath(`/dashboard/capa/${ticketId}`);
    revalidatePath("/dashboard/capa");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** Assign resolver (HOD/Teknisi) — POST /capa/tickets/{id}/assign. */
export async function capaAssignAction(
  ticketId: string,
  assignedTo: string,
  note?: string,
): Promise<ActionOutcome> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: unknown }>(
      `/capa/tickets/${ticketId}/assign`,
      { method: "POST", body: { assigned_to: assignedTo, note: note || null } },
    );
    revalidatePath(`/dashboard/capa/${ticketId}`);
    revalidatePath("/dashboard/capa");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** Teknisi submit perbaikan (foto AFTER) — POST /capa/tickets/{id}/resolve. */
export async function capaResolveAction(
  ticketId: string,
  note: string,
  media: Array<{
    phase?: "BEFORE" | "AFTER";
    source_camera?: "LIVE_CAMERA";
    mime: string;
    width: number;
    height: number;
    size_bytes: number;
    checksum_sha256: string;
    gps_lat?: number | null;
    gps_lng?: number | null;
    gps_valid?: boolean;
    captured_at: string;
  }> = [],
): Promise<ActionOutcome> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: unknown }>(
      `/capa/tickets/${ticketId}/resolve`,
      { method: "POST", body: { note, media } },
    );
    revalidatePath(`/dashboard/capa/${ticketId}`);
    revalidatePath("/dashboard/capa");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** GM first-approver (APPROVE/REJECT) — POST /capa/tickets/{id}/verify/gm. */
export async function capaVerifyGmAction(
  ticketId: string,
  decision: "APPROVE" | "REJECT",
  note?: string,
): Promise<ActionOutcome> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: unknown }>(
      `/capa/tickets/${ticketId}/verify/gm`,
      { method: "POST", body: { decision, note: note || null } },
    );
    revalidatePath(`/dashboard/capa/${ticketId}`);
    revalidatePath("/dashboard/capa");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** QA final-approver (CLOSE/REOPEN) — POST /capa/tickets/{id}/verify/qa. */
export async function capaVerifyQaAction(
  ticketId: string,
  decision: "CLOSE" | "REOPEN",
  note?: string,
): Promise<ActionOutcome> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: unknown }>(
      `/capa/tickets/${ticketId}/verify/qa`,
      { method: "POST", body: { decision, note: note || null } },
    );
    revalidatePath(`/dashboard/capa/${ticketId}`);
    revalidatePath("/dashboard/capa");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** Eskalasi berjenjang — POST /capa/tickets/{id}/escalate. */
export async function capaEscalateAction(ticketId: string): Promise<ActionOutcome> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: unknown }>(
      `/capa/tickets/${ticketId}/escalate`,
      { method: "POST" },
    );
    revalidatePath(`/dashboard/capa/${ticketId}`);
    revalidatePath("/dashboard/capa");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** Presigned GET URL bukti media (verification hub) — GET .../{media_id}/presign-get. */
export async function capaMediaGetUrlAction(
  ticketId: string,
  mediaId: string,
): Promise<{ ok: boolean; status?: number; message?: string; url?: string }> {
  try {
    const res = await serverApiFetch<{
      success?: boolean;
      data?: { presigned_url?: string };
    }>(`/capa/tickets/${ticketId}/media/${mediaId}/presign-get`);
    const url = res.data?.presigned_url;
    if (!url) return { ok: false, status: 500, message: "no_url" };
    return { ok: true, url };
  } catch (err) {
    return wrapError(err);
  }
}

/** Presigned PUT URL upload media — POST /capa/tickets/{id}/media/{media_id}/presign */
export async function capaMediaPresignUploadAction(
  ticketId: string,
  mediaId: string,
): Promise<{ ok: boolean; status?: number; message?: string; presigned_url?: string; object_key?: string }> {
  try {
    const res = await serverApiFetch<{
      success?: boolean;
      data?: { presigned_url?: string; object_key?: string };
    }>(`/capa/tickets/${ticketId}/media/${mediaId}/presign`, { method: "POST" });
    return {
      ok: true,
      presigned_url: res.data?.presigned_url,
      object_key: res.data?.object_key,
    };
  } catch (err) {
    return wrapError(err);
  }
}

/** Confirm upload media — POST /capa/tickets/{id}/media/{media_id}/confirm */
export async function capaMediaConfirmAction(
  ticketId: string,
  mediaId: string,
  objectKey?: string,
): Promise<ActionOutcome> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: unknown }>(
      `/capa/tickets/${ticketId}/media/${mediaId}/confirm`,
      { method: "POST", body: { object_key: objectKey || null } },
    );
    revalidatePath(`/dashboard/capa/${ticketId}`);
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}