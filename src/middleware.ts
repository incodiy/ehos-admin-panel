import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL, getAccessTokenExp } from "@/lib/api/client";
import {
  AUTH_ACCESS_COOKIE,
  AUTH_REFRESH_COOKIE,
  ACCESS_COOKIE_MAX_AGE,
  REFRESH_COOKIE_MAX_AGE,
  ACCESS_REFRESH_THRESHOLD,
} from "@/lib/auth/tokens";

function authCookieOptions(purpose: "access" | "refresh") {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: purpose === "access" ? ACCESS_COOKIE_MAX_AGE : REFRESH_COOKIE_MAX_AGE,
  };
}

/**
 * Refresher token (opaque JWT) di edge middleware:
 * - access valid → lanjut (verifikasi otoritas tetap milik backend).
 * - access habis/kurang dari ambang → POST /auth/refresh (rotasi cookie).
 * - tanpa akses & tanpa refresh di area ber-auth → redirect /login.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const access = req.cookies.get(AUTH_ACCESS_COOKIE)?.value;
  const refresh = req.cookies.get(AUTH_REFRESH_COOKIE)?.value;

  const toLogin = NextResponse.redirect(new URL("/login", req.url));

  if (!access) {
    if (!pathname.startsWith("/dashboard")) return NextResponse.next();
    return refresh ? await refreshAndContinue(req, refresh) : toLogin;
  }

  const exp = getAccessTokenExp(access);
  const now = Math.floor(Date.now() / 1000);
  if (exp && exp - now > ACCESS_REFRESH_THRESHOLD) return NextResponse.next();

  if (refresh) return await refreshAndContinue(req, refresh);
  if (pathname.startsWith("/dashboard")) return toLogin;
  return NextResponse.next();
}

async function refreshAndContinue(req: NextRequest, refresh: string): Promise<NextResponse> {
  const toLogin = NextResponse.redirect(new URL("/login", req.url));

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
      cache: "no-store",
    });
  } catch {
    return toLogin;
  }

  if (!res.ok) {
    const response = NextResponse.next();
    response.cookies.delete(AUTH_ACCESS_COOKIE);
    response.cookies.delete(AUTH_REFRESH_COOKIE);
    return req.nextUrl.pathname.startsWith("/dashboard") ? toLogin : response;
  }

  const payload = (await res.json()) as {
    data?: { access_token?: string; refresh_token?: string };
  };
  const nextAccess = payload?.data?.access_token;
  if (!nextAccess) return toLogin;

  const response = NextResponse.next();
  response.cookies.set(AUTH_ACCESS_COOKIE, nextAccess, authCookieOptions("access"));
  const nextRefresh = payload?.data?.refresh_token;
  if (nextRefresh) response.cookies.set(AUTH_REFRESH_COOKIE, nextRefresh, authCookieOptions("refresh"));
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)"],
};