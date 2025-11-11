"use server";

import { revalidatePath } from "next/cache";
import { ApiError, serverApiFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi";

export type LeadKanbanRow = components["schemas"]["LeadKanbanRow"];

export type LeadRow = components["schemas"]["Lead"];

/** Quotation dari detail lead — backend menyertakan `event_name` non-kontrak. */
export type LeadQuotation = components["schemas"]["Quotation"] & {
  event_name?: string | null;
};

export type LeadDetail = {
  activities?: components["schemas"]["LeadActivity"][];
  quotations?: LeadQuotation[];
  referrals?: components["schemas"]["LeadReferral"][];
  hotel_code?: string | null;
  owner_name?: string | null;
  next_followup_human?: string | null;
} & LeadRow;

type ActionOutcome = {
  ok: boolean;
  status?: number;
  message?: string;
  data?: unknown;
};

function wrapError(err: unknown): ActionOutcome {
  if (err instanceof ApiError) {
    const raw = err.body as { message?: string } | null;
    return { ok: false, status: err.status, message: raw?.message ?? `http_${err.status}` };
  }
  return { ok: false, status: 0, message: "network_error" };
}

/** Pindah status kanban / isi lost_reason — PATCH /crm/leads/{id} (transisi valid + guard 409/422). */
export async function crmUpdateLeadStatusAction(
  leadId: string,
  status: string,
  lostReason?: string,
): Promise<ActionOutcome> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: LeadRow }>(
      `/crm/leads/${leadId}`,
      {
        method: "PATCH",
        body: lostReason !== undefined ? { status, lost_reason: lostReason } : { status },
      },
    );
    revalidatePath("/dashboard/crm/leads");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** Detail lead utk drawer War Room — GET /crm/leads/{id} (aktivitas + quotation). */
export async function crmLeadDetailAction(leadId: string): Promise<ActionOutcome> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: LeadDetail }>(
      `/crm/leads/${leadId}`,
    );
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** Catat aktivitas follow-up + jadwal berikutnya — POST /crm/leads/{id}/activities. */
export async function crmAddActivityAction(
  leadId: string,
  type: "CALL" | "EMAIL" | "MEETING" | "NOTE",
  note: string,
  nextFollowupAt: string | null,
): Promise<ActionOutcome> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: components["schemas"]["LeadActivity"] }>(
      `/crm/leads/${leadId}/activities`,
      {
        method: "POST",
        body: { type, note, next_followup_at: nextFollowupAt || null },
      },
    );
    revalidatePath("/dashboard/crm/leads");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** Buat lead baru — POST /crm/leads. */
export async function crmCreateLeadAction(
  payload: components["schemas"]["LeadCreateRequest"],
): Promise<ActionOutcome> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: LeadRow }>(
      "/crm/leads",
      {
        method: "POST",
        body: payload,
      },
    );
    revalidatePath("/dashboard/crm/leads");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** Update seluruh parameter metadata lead — PATCH /crm/leads/{id}. */
export async function crmUpdateLeadAction(
  leadId: string,
  payload: components["schemas"]["LeadUpdateRequest"],
): Promise<ActionOutcome> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: LeadRow }>(
      `/crm/leads/${leadId}`,
      {
        method: "PATCH",
        body: payload,
      },
    );
    revalidatePath("/dashboard/crm/leads");
    revalidatePath(`/dashboard/crm/leads/${leadId}/edit`);
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}