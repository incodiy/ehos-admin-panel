"use server";

import type { components } from "@/lib/api/openapi";
import { serverApiFetch } from "@/lib/api/client";

export type AuditSessionRow = components["schemas"]["AuditSession"];
export type AuditItemScoreRow = components["schemas"]["AuditItemScore"];
export type FindingRow = components["schemas"]["Finding"] & { item_code?: string | null };

export type AuditSessionListResult = {
  success?: boolean;
  data?: AuditSessionRow[];
  meta?: components["schemas"]["PaginationMeta"];
};

export type AuditSessionDetail = {
  session?: AuditSessionRow;
  department_breakdown?: Array<{
    section_code?: string;
    section_name?: string;
    score?: number | null;
    max?: number | null;
    pct?: number | null;
    items_count?: number | null;
  }>;
  items?: AuditItemScoreRow[];
  findings?: FindingRow[];
};

export type AuditListFilters = {
  status?: string;
  department?: string;
  page?: number;
};

/** GET /audit/sessions — list sesi audit + filter (hotel scope dari sesi aktif). */
export async function listAuditSessionsAction(
  filters: AuditListFilters,
  hotelId?: string | null,
): Promise<{ ok: boolean; status?: number; message?: string; result?: AuditSessionListResult }> {
  try {
    const q = new URLSearchParams();
    if (filters.status) q.set("status", filters.status);
    if (filters.department) q.set("department", filters.department);
    if (filters.page && filters.page > 1) q.set("page", String(filters.page));
    if (hotelId) q.set("hotel_id", hotelId);
    const query = q.toString();
    const result = await serverApiFetch<AuditSessionListResult>(`/audit/sessions${query ? `?${query}` : ""}`);
    return { ok: true, result };
  } catch (err) {
    return wrapError(err);
  }
}

/** GET /audit/sessions/{id} — detail sesi + department_breakdown + items + findings. */
export async function getAuditSessionDetailAction(
  sessionId: string,
): Promise<{ ok: boolean; status?: number; message?: string; detail?: AuditSessionDetail }> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: AuditSessionDetail }>(
      `/audit/sessions/${sessionId}`,
    );
    return { ok: true, detail: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** POST /audit/sessions — create new audit session. */
export async function createAuditSessionAction(payload: {
  hotel_id: string;
  department: string;
  date_start?: string;
  template_id?: string;
  audit_type?: string;
}): Promise<{ ok: boolean; status?: number; message?: string; session?: AuditSessionRow }> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: AuditSessionRow }>(
      "/audit/sessions",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
    return { ok: true, session: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** POST /audit/sessions/{id}/submit — submit audit session for QA review. */
export async function submitAuditSessionAction(
  sessionId: string,
): Promise<{ ok: boolean; status?: number; message?: string; session?: AuditSessionRow }> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: AuditSessionRow }>(
      `/audit/sessions/${sessionId}/submit`,
      {
        method: "POST",
      },
    );
    return { ok: true, session: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** POST /audit/sessions/{id}/reopen — return submitted audit session to IN_PROGRESS for revision. */
export async function reopenAuditSessionAction(
  sessionId: string,
): Promise<{ ok: boolean; status?: number; message?: string; session?: AuditSessionRow }> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: AuditSessionRow }>(
      `/audit/sessions/${sessionId}/reopen`,
      {
        method: "POST",
      },
    );
    return { ok: true, session: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** PATCH /audit/sessions/{id} — update DRAFT session parameters. */
export async function updateAuditSessionAction(
  sessionId: string,
  payload: {
    department?: string;
    audit_type?: string;
    date_start?: string;
    date_end?: string;
  },
): Promise<{ ok: boolean; status?: number; message?: string; session?: AuditSessionRow }> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: AuditSessionRow }>(
      `/audit/sessions/${sessionId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
    return { ok: true, session: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** DELETE /audit/sessions/{id} — cancel / delete DRAFT session. */
export async function deleteAuditSessionAction(
  sessionId: string,
): Promise<{ ok: boolean; status?: number; message?: string }> {
  try {
    await serverApiFetch<{ success?: boolean; message?: string }>(
      `/audit/sessions/${sessionId}`,
      {
        method: "DELETE",
      },
    );
    return { ok: true };
  } catch (err) {
    return wrapError(err);
  }
}

/** POST /audit/sessions/{id}/publish — publish completed audit session. */
export async function publishAuditSessionAction(
  sessionId: string,
): Promise<{ ok: boolean; status?: number; message?: string; session?: AuditSessionRow }> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: AuditSessionRow }>(
      `/audit/sessions/${sessionId}/publish`,
      {
        method: "POST",
      },
    );
    return { ok: true, session: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

export type AuditMediaRow = {
  id: string;
  client_id?: string | null;
  kind?: string | null;
  target_id?: string | null;
  storage_key?: string | null;
  content_type?: string | null;
  size_bytes?: number | null;
  sync_status?: string | null;
  url?: string | null;
  created_at?: string | null;
};

/** GET /audit/sessions/{id}/media — list all media evidence for this audit session. */
export async function getAuditSessionMediaAction(
  sessionId: string,
): Promise<{ ok: boolean; status?: number; message?: string; media?: AuditMediaRow[] }> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: AuditMediaRow[] }>(
      `/audit/sessions/${sessionId}/media`,
    );
    return { ok: true, media: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

export type ScoreUpsertItem = {
  item_id: string;
  room_ref?: string | null;
  value?: string | null;
  score?: number | null;
  is_na?: boolean;
  note?: string | null;
  evidence_media_keys?: string[];
};

/** POST /audit/sessions/{id}/items — bulk save scoring items. */
export async function bulkScoreItemsAction(
  sessionId: string,
  scores: ScoreUpsertItem[],
): Promise<{ ok: boolean; status?: number; message?: string; data?: { upserted?: number; conflicts?: number } }> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: { upserted?: number; conflicts?: number } }>(
      `/audit/sessions/${sessionId}/items`,
      {
        method: "POST",
        body: JSON.stringify({ scores }),
      },
    );
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

function wrapError(err: unknown): { ok: false; status?: number; message?: string } {
  if (err instanceof Error && "status" in err && typeof (err as { status: unknown }).status === "number") {
    const apiErr = err as {
      status: number;
      body?: { message?: string; detail?: string | Array<{ msg?: string; loc?: string[] }> } | null;
    };
    const detailMsg =
      typeof apiErr.body?.detail === "string"
        ? apiErr.body.detail
        : Array.isArray(apiErr.body?.detail)
          ? apiErr.body.detail.map((d) => d.msg).filter(Boolean).join(", ")
          : undefined;
    return {
      ok: false,
      status: apiErr.status,
      message: apiErr.body?.message || detailMsg || `HTTP ${apiErr.status}`,
    };
  }
  return { ok: false, status: 0, message: err instanceof Error ? err.message : "network_error" };
}