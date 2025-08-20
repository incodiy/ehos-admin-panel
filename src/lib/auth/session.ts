import type { components } from "@/lib/api/openapi";
import { ApiError, serverApiFetch } from "@/lib/api/client";
import { AUTH_ACCESS_COOKIE, AUTH_REFRESH_COOKIE } from "@/lib/auth/tokens";

type User = components["schemas"]["User"];
type Role = components["schemas"]["Role"];
type Hotel = components["schemas"]["Hotel"];

/** Sesi aktif (hasil GET /auth/me) — profil + roles + hotel aktif (A1 scope). */
export interface Session {
  accessToken: string;
  user: User;
  roles: Role[];
  activeHotel?: Hotel;
}

/** 9 role RBAC (A1-A5) tetap proporsional di sisi klien; otoritas final di backend. */
export const ROLE_CODES = [
  "ROOT_ADMIN",
  "CORP_EXEC",
  "CORP_AUDITOR",
  "REGIONAL_ROM",
  "HOTEL_GM",
  "HOTEL_HOD_TECH",
  "HOTEL_SALES",
  "HOTEL_FINANCE",
  "PUBLIC_CLIENT",
] as const;

export type RoleCode = (typeof ROLE_CODES)[number];

/** Role yang diperbolehkan mengakses area kantor korporat. */
export const ADMIN_ROLES: readonly RoleCode[] = [
  "ROOT_ADMIN",
  "CORP_EXEC",
  "CORP_AUDITOR",
  "REGIONAL_ROM",
  "HOTEL_GM",
  "HOTEL_HOD_TECH",
  "HOTEL_SALES",
  "HOTEL_FINANCE",
];

export function roleCodes(session: Session | null): RoleCode[] {
  if (!session) return [];
  return session.roles
    .map((r) => r.code)
    .filter((c): c is RoleCode => (ROLE_CODES as readonly string[]).includes(c ?? ""));
}

export function hasAnyRole(session: Session | null, allowed: readonly RoleCode[]): boolean {
  const codes = roleCodes(session);
  return codes.some((c) => allowed.includes(c));
}

export function isCorporate(user: Session | null): boolean {
  return hasAnyRole(user, ["ROOT_ADMIN", "CORP_EXEC", "CORP_AUDITOR", "REGIONAL_ROM"]);
}

interface MePayload {
  success?: boolean;
  data?: User & {
    roles?: Role[];
    active_hotel?: Hotel;
  };
}

/**
 * Baca sesi server dari cookie httpOnly + GET /auth/me.
 * 401 → null (layout admin redirect ke /login; refresh token ditangani middleware).
 */
export async function getServerSession(): Promise<Session | null> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const accessToken = store.get(AUTH_ACCESS_COOKIE)?.value;
  const refreshToken = store.get(AUTH_REFRESH_COOKIE)?.value;

  if (!accessToken && !refreshToken) return null;

  let payload: MePayload;
  try {
    payload = await serverApiFetch<MePayload>("/auth/me");
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    // Error lain (network/5xx) → sesi dianggap tidak tersedia utk penampilan jujur.
    return null;
  }

  const data = payload?.data;
  if (!data || !accessToken) return null;

  return {
    accessToken,
    user: data,
    roles: data.roles ?? [],
    activeHotel: data.active_hotel,
  };
}