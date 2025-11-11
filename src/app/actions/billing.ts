"use server";

import { revalidatePath } from "next/cache";
import { ApiError, serverApiFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi";

export type BillingMilestone = components["schemas"]["BillingMilestone"];
export type BillingMilestoneCreatePayload = components["schemas"]["BillingMilestoneCreate"];
export type BillingMilestoneUpdatePayload = components["schemas"]["BillingMilestoneUpdate"];

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

/** Buat milestone dokumen dinas baru (F-10) — POST /crm/billing/milestones */
export async function crmCreateBillingMilestoneAction(
  payload: BillingMilestoneCreatePayload,
): Promise<ActionOutcome<BillingMilestone>> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: BillingMilestone }>(
      "/crm/billing/milestones",
      {
        method: "POST",
        body: payload,
      },
    );
    revalidatePath("/dashboard/crm/billing");
    if (payload.quotation_id) {
      revalidatePath(`/dashboard/crm/quotations/${payload.quotation_id}`);
    }
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** Update status FSM, nomor dokumen, lampiran dokumen, atau pelunasan (F-10) — PATCH /crm/billing/milestones/{id} */
export async function crmUpdateBillingMilestoneAction(
  id: string,
  payload: BillingMilestoneUpdatePayload,
): Promise<ActionOutcome<BillingMilestone>> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: BillingMilestone }>(
      `/crm/billing/milestones/${id}`,
      {
        method: "PATCH",
        body: payload,
      },
    );
    revalidatePath("/dashboard/crm/billing");
    revalidatePath(`/dashboard/crm/billing/${id}`);
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** Ambil detail milestone dinas (F-10) — GET /crm/billing/milestones/{id} */
export async function crmGetBillingMilestoneAction(
  id: string,
): Promise<ActionOutcome<BillingMilestone>> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: BillingMilestone }>(
      `/crm/billing/milestones/${id}`,
    );
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}
