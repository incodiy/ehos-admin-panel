import { AUTH_ACCESS_COOKIE } from "@/lib/auth/tokens";

/** Base URL kontrak backend (delay via env; default dev lokal). */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";

/**
 * Error API terstruktur. G4: caller wajib menampilkan state error yang jujur —
 * tidak pernah menampilkan fallback data palsu saat error.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown, message?: string) {
    super(message || `API ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export interface ApiFetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
}

/**
 * Typed fetch ke kontrak backend (single source of truth openapi.yaml, ARD-003).
 * Tanpa mock/fallback: error diangkat sebagai ApiError agar state jujur.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = { accept: "application/json" };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (token) headers["authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body:
        body !== undefined
          ? typeof body === "string"
            ? body
            : JSON.stringify(body)
          : undefined,
      cache: "no-store",
    });
  } catch {
    // Network/timeout — dikonversi agar caller memberi pesan retry yang jujur.
    throw new ApiError(0, null, "network_error");
  }

  if (res.status === 204) return undefined as T;

  const payload: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, payload);
  }
  return payload as T;
}

/**
 * apiFetch terikat sesi server: menyuntikkan access token dari cookie httpOnly
 * (dipakai RSC/server action — token tidak pernah ke bundle browser).
 */
export async function serverApiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const token = store.get(AUTH_ACCESS_COOKIE)?.value ?? null;
  return apiFetch<T>(path, { ...options, token });
}

/**
 * Baca JWT claim (exp) tanpa verifikasi signature — token tetap opaque untuk
 * frontend; verifikasi hanya di backend (ARD-006). Dipakai untuk jadwal refresh.
 */
export function getAccessTokenExp(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")) as string) as {
      exp?: number;
    };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}