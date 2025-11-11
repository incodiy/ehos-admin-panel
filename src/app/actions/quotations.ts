"use server";

import { revalidatePath } from "next/cache";
import { ApiError, serverApiFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi";

export type QuotationRow = components["schemas"]["Quotation"];
export type QuotationCreatePayload = components["schemas"]["QuotationCreateRequest"];
export type QuotationUpdatePayload = components["schemas"]["QuotationUpdateRequest"];
export type BillingMilestone = components["schemas"]["BillingMilestone"];

export type QuotationDetail = QuotationRow & {
  milestones?: BillingMilestone[];
  pdf_url?: string | null;
};

type ActionOutcome = {
  ok: boolean;
  status?: number;
  message?: string;
  data?: unknown;
};

function wrapError(err: unknown): ActionOutcome {
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

/** Buat quotation baru — POST /crm/quotations (F-09). */
export async function crmCreateQuotationAction(
  payload: QuotationCreatePayload,
): Promise<ActionOutcome> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: QuotationRow }>(
      "/crm/quotations",
      {
        method: "POST",
        body: payload,
      },
    );
    revalidatePath("/dashboard/crm/quotations");
    revalidatePath("/dashboard/crm/leads");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** Update status FSM, diskon approval, atau rincian quotation — PATCH /crm/quotations/{id}. */
export async function crmUpdateQuotationAction(
  id: string,
  payload: QuotationUpdatePayload,
): Promise<ActionOutcome> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: QuotationRow }>(
      `/crm/quotations/${id}`,
      {
        method: "PATCH",
        body: payload,
      },
    );
    revalidatePath("/dashboard/crm/quotations");
    revalidatePath(`/dashboard/crm/quotations/${id}`);
    revalidatePath("/dashboard/crm/leads");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** Generate PDF proposal ber-kop + Code39 Barcode (F-09) — POST /crm/quotations/{id}/pdf. */
export async function crmGenerateQuotationPdfAction(
  id: string,
): Promise<ActionOutcome> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: { pdf_url?: string } }>(
      `/crm/quotations/${id}/pdf`,
      {
        method: "POST",
      },
    );
    revalidatePath(`/dashboard/crm/quotations/${id}`);
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}
