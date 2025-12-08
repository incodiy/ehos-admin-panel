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
  year?: number;
};

export interface AuditPeriodDepartment {
  session_id: string;
  score?: number | null;
  status: string;
  pass_fail?: string | null;
}

export interface AuditPeriodRow {
  period_id: string;
  year: number;
  month_num: number;
  month_name: string;
  date_start: string;
  date_end?: string | null;
  status: string;
  average_score?: number | null;
  department_scores: Record<string, AuditPeriodDepartment>;
  primary_session_id: string;
  auditor_name?: string | null;
}

export interface HotelAuditSummary {
  hotel_id: string;
  hotel_code: string;
  hotel_name: string;
  hotel_image_url?: string | null;
  brand_tier: string;
  city: string;
  total_periods: number;
  cumulative_average_score?: number | null;
  last_audit_period?: {
    year: number;
    month_num: number;
    month_name: string;
    date_start: string;
    date_end?: string | null;
  } | null;
  last_status: string;
  periods: AuditPeriodRow[];
}

export interface DashboardBreakdownsData {
  hotel_info: {
    id: string;
    code: string;
    name: string;
    region?: string | null;
    city?: string | null;
  } | null;
  security_summary: {
    overall_score: number;
    is_pass: boolean;
    sections: Array<{
      name: string;
      code: string;
      score: number;
      max: number;
      pct: number;
    }>;
  };
  kitchen_summary: {
    overall_score: number;
    is_pass: boolean;
    sections: Array<{
      name: string;
      code: string;
      yes_count?: number;
      total_count?: number;
      pct: number;
    }>;
  };
  housekeeping_section_summary: {
    overall_score: number;
    is_pass: boolean;
    sections: Array<{
      name: string;
      code: string;
      achieved?: number;
      max?: number;
      pct: number;
    }>;
  };
  housekeeping_room_summary: {
    total_score: number;
    subtotal: number;
    categories: Array<{
      name: string;
      score: number;
      pct?: number;
    }>;
  };
}

/** GET /audit/sessions/dashboard-breakdowns — ringkasan seksi per departemen */
export async function getDashboardBreakdownsAction(params?: {
  hotelId?: string | null;
  year?: number;
}): Promise<{ ok: boolean; status?: number; message?: string; data?: DashboardBreakdownsData }> {
  try {
    const q = new URLSearchParams();
    if (params?.hotelId) q.set("hotel_id", params.hotelId);
    if (params?.year) q.set("year", String(params.year));
    const qs = q.toString();
    const res = await serverApiFetch<{ data: DashboardBreakdownsData }>(
      `/audit/sessions/dashboard-breakdowns${qs ? `?${qs}` : ""}`
    );
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** GET /audit/sessions/hotel-summaries — ringkasan per hotel dengan nested cycle periods */
export async function getHotelAuditSummariesAction(params?: {
  hotelId?: string | null;
  department?: string;
  status?: string;
  year?: number;
}): Promise<{ ok: boolean; status?: number; message?: string; data?: HotelAuditSummary[] }> {
  try {
    const q = new URLSearchParams();
    if (params?.hotelId) q.set("hotel_id", params.hotelId);
    if (params?.department) q.set("department", params.department);
    if (params?.status) q.set("status", params.status);
    if (params?.year) q.set("year", String(params.year));
    const qs = q.toString();
    const res = await serverApiFetch<{ data: HotelAuditSummary[] }>(
      `/audit/sessions/hotel-summaries${qs ? `?${qs}` : ""}`
    );
    return { ok: true, data: res.data ?? [] };
  } catch (err) {
    return wrapError(err);
  }
}


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

export type ComprehensiveDepartmentData = {
  session?: AuditSessionRow | null;
  session_id?: string | null;
  template?: {
    id?: string | null;
    name?: string | null;
    version?: string | null;
    status?: string | null;
  } | null;
  sections: Array<{
    id: string;
    code: string;
    name: string;
    sort_order?: number;
  }>;
  items: Array<{
    id: string;
    section_id: string;
    section_code: string;
    section_name: string;
    code: string;
    question_text: string;
    rubric_type: string;
    max_score: number;
    weight: number;
    na_allowed: boolean;
    is_life_safety: boolean;
    sort_order?: number;
  }>;
  scores: Array<{
    id: string;
    item_id?: string | null;
    item_code?: string | null;
    room_ref?: string | null;
    value?: string | null;
    score?: number | null;
    is_na?: boolean;
    note?: string | null;
  }>;
};

export type ComprehensiveAuditData = {
  session?: AuditSessionRow;
  hotel: {
    id?: string | null;
    code?: string | null;
    name?: string | null;
    city?: string | null;
    region?: string | null;
    brand?: string | null;
  };
  security: ComprehensiveDepartmentData;
  kitchen_fb: ComprehensiveDepartmentData;
  housekeeping: ComprehensiveDepartmentData;
  room_check: ComprehensiveDepartmentData;
};

/** GET /audit/sessions/{id}/comprehensive — data lengkap 3 departemen + room check untuk 1 hotel target. */
export async function getComprehensiveAuditSessionAction(
  sessionId: string,
): Promise<{ ok: boolean; status?: number; message?: string; data?: ComprehensiveAuditData }> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: ComprehensiveAuditData }>(
      `/audit/sessions/${sessionId}/comprehensive`,
    );
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** POST /audit/sessions/ensure-department — pastikan/aktifkan sesi audit untuk departemen dalam siklus. */
export async function ensureAuditDepartmentAction(
  sourceSessionId: string,
  department: string,
  note?: string,
): Promise<{ ok: boolean; status?: number; message?: string; session?: AuditSessionRow }> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: AuditSessionRow }>(
      "/audit/sessions/ensure-department",
      {
        method: "POST",
        body: {
          source_session_id: sourceSessionId,
          department,
          note: note || undefined,
        },
      },
    );
    return { ok: true, session: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** POST /audit/sessions/{id}/activate-all-departments — aktifkan seluruh 3 departemen untuk siklus ini. */
export async function activateAllAuditDepartmentsAction(
  sourceSessionId: string,
): Promise<{ ok: boolean; status?: number; message?: string; sessions?: AuditSessionRow[] }> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: AuditSessionRow[] }>(
      `/audit/sessions/${sourceSessionId}/activate-all-departments`,
      {
        method: "POST",
        body: {},
      },
    );
    return { ok: true, sessions: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

export interface IntegratedCycleCreateResult {
  primary_session_id: string;
  created_sessions: AuditSessionRow[];
  hotel_id: string;
  date_start?: string | null;
  date_end?: string | null;
  audit_type: string;
}

/** POST /audit/sessions — create new single audit session. */
export async function createAuditSessionAction(payload: {
  hotel_id: string;
  department: string;
  date_start?: string;
  date_end?: string;
  template_id?: string;
  audit_type?: string;
}): Promise<{ ok: boolean; status?: number; message?: string; session?: AuditSessionRow }> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: AuditSessionRow }>(
      "/audit/sessions",
      {
        method: "POST",
        body: payload,
      },
    );
    return { ok: true, session: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** POST /audit/sessions/integrated-cycle — buat siklus audit terpadu 3 departemen sekaligus */
export async function createIntegratedAuditCycleAction(payload: {
  hotel_id: string;
  audit_type?: string;
  date_start?: string;
  date_end?: string;
  departments?: string[];
}): Promise<{ ok: boolean; status?: number; message?: string; result?: IntegratedCycleCreateResult }> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: IntegratedCycleCreateResult }>(
      "/audit/sessions/integrated-cycle",
      {
        method: "POST",
        body: payload,
      },
    );
    return { ok: true, result: res.data };
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
        body: payload,
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
    const now = new Date().toISOString();
    const payloadScores = scores.map((s) => ({
      item_id: s.item_id,
      room_ref: s.room_ref ?? null,
      value: s.value ?? null,
      score: s.score ?? null,
      is_na: !!s.is_na,
      note: s.note ?? "",
      scored_at: now,
      updated_at: now,
      evidence_media_keys: s.evidence_media_keys ?? [],
    }));
    const res = await serverApiFetch<{ success?: boolean; data?: { upserted?: number; conflicts?: number } }>(
      `/audit/sessions/${sessionId}/items`,
      {
        method: "POST",
        body: { scores: payloadScores },
      },
    );
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** POST /audit/sessions/{id}/media — daftarkan bukti foto item temuan audit (BEFORE) */
export async function registerAuditItemMediaAction(
  sessionId: string,
  itemId: string,
  payload: {
    mime?: string;
    width?: number;
    height?: number;
    size_bytes?: number;
    checksum_sha256?: string;
    gps_lat?: number | null;
    gps_lng?: number | null;
    captured_at?: string;
  },
): Promise<{ ok: boolean; status?: number; message?: string; data?: { media_id: string; presigned_url: string; object_key: string } }> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: { media_id: string; presigned_url: string; object_key: string } }>(
      `/audit/sessions/${sessionId}/media`,
      {
        method: "POST",
        body: {
          item_id: itemId,
          phase: "BEFORE",
          source_camera: "LIVE_CAMERA",
          mime: payload.mime || "image/webp",
          width: payload.width || 1280,
          height: payload.height || 960,
          size_bytes: payload.size_bytes || 200_000,
          checksum_sha256: payload.checksum_sha256 || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          gps_lat: payload.gps_lat ?? null,
          gps_lng: payload.gps_lng ?? null,
          captured_at: payload.captured_at || new Date().toISOString(),
        },
      },
    );
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/** POST /audit/sessions/{id}/media/{mediaId}/confirm — konfirmasi foto terunggah */
export async function confirmAuditSessionMediaAction(
  sessionId: string,
  mediaId: string,
): Promise<{ ok: boolean; status?: number; message?: string; data?: unknown }> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: unknown }>(
      `/audit/sessions/${sessionId}/media/${mediaId}/confirm`,
      { method: "POST" },
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