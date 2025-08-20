"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { apiFetch, serverApiFetch, ApiError } from "@/lib/api/client";
import {
  AUTH_ACCESS_COOKIE,
  AUTH_REFRESH_COOKIE,
  ACCESS_COOKIE_MAX_AGE,
  REFRESH_COOKIE_MAX_AGE,
} from "@/lib/auth/tokens";
import { LOCALE_COOKIE, type Language } from "@/i18n/config";
import type { components } from "@/lib/api/openapi";

type User = components["schemas"]["User"];
type Hotel = components["schemas"]["Hotel"];

export interface MyHotelEntry {
  hotel_id?: string;
  hotel_code?: string;
  hotel_name?: string;
  role_id?: string;
  role_code?: string;
  is_primary?: boolean;
}

export interface LoginResult {
  ok: boolean;
  /** Daftar hotel scope utk langkah Switch Active Hotel (A1) — diisi bila >1. */
  hotels?: MyHotelEntry[];
  /** Kunci pesan error (i18n) saat ok=false. */
  errorKey?: string;
}

interface LoginPayload {
  success?: boolean;
  data?: {
    access_token?: string;
    refresh_token?: string;
    user?: User;
  };
}

async function setAuthCookies(accessToken: string, refreshToken: string) {
  const store = await cookies();
  store.set(AUTH_ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ACCESS_COOKIE_MAX_AGE,
  });
  store.set(AUTH_REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
}

/** Login (POST /auth/login) → simpan token ke cookie httpOnly + sinkron locale (F-22). */
export async function loginAction(input: { email: string; password: string }): Promise<LoginResult> {
  const email = String(input?.email ?? "").trim();
  const password = String(input?.password ?? "");
  if (!email || !password) return { ok: false, errorKey: "auth.required" };

  let payload: LoginPayload;
  try {
    payload = await apiFetch<LoginPayload>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return { ok: false, errorKey: "auth.invalidCredentials" };
    if (err instanceof ApiError && err.status === 0) return { ok: false, errorKey: "auth.networkError" };
    return { ok: false, errorKey: "auth.serverError" };
  }

  const data = payload?.data;
  if (!data?.access_token || !data.refresh_token || !data.user) {
    return { ok: false, errorKey: "auth.invalidCredentials" };
  }

  await setAuthCookies(data.access_token, data.refresh_token);

  const preferredLocale = data.user.preferred_locale;
  if (preferredLocale === "id" || preferredLocale === "en") {
    const store = await cookies();
    store.set(LOCALE_COOKIE, preferredLocale, { path: "/", maxAge: 31536000, sameSite: "lax" });
  }

  // Scope hotel utk langkah Switch Active Hotel bila user multi-hotel (A1).
  let hotels: MyHotelEntry[] = [];
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: MyHotelEntry[] }>("/auth/hotels");
    hotels = res.data ?? [];
  } catch {
    hotels = [];
  }

  return { ok: true, hotels };
}

/** Logout (POST /auth/logout) + hapus cookie sesi. */
export async function logoutAction(): Promise<void> {
  try {
    await serverApiFetch("/auth/logout", { method: "POST" });
  } catch {
    // Token mungkin sudah invalid/expired — hapus cookie tetap dijalankan.
  }
  const store = await cookies();
  store.delete(AUTH_ACCESS_COOKIE);
  store.delete(AUTH_REFRESH_COOKIE);
  redirect("/login");
}

interface SwitchHotelPayload {
  success?: boolean;
  data?: { active_hotel?: Hotel };
}

/** Ganti Active Hotel (A1) → update scope sesi backend. */
export async function switchHotelAction(hotelId: string): Promise<{ ok: boolean }> {
  if (!hotelId) return { ok: false };
  try {
    await serverApiFetch<SwitchHotelPayload>("/auth/switch-hotel", {
      method: "POST",
      body: { hotel_id: hotelId },
    });
  } catch {
    return { ok: false };
  }
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

/** Sinkronkan pilihan bahasa ke preferensi user (PUT /auth/locale — F-22). */
export async function setLocaleAction(locale: Language): Promise<void> {
  const store = await cookies();
  try {
    await serverApiFetch("/auth/locale", { method: "PATCH", body: { locale } });
  } catch {
    // G4: sinkronisasi gagal tidak menghalangi switch lokal; tetap jujur via cookie UI.
  }
  store.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 31536000, sameSite: "lax" });
}