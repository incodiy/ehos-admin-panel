import { API_BASE_URL } from "@/lib/api/client";
import { AUTH_ACCESS_COOKIE } from "@/lib/auth/tokens";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hotelId = searchParams.get("hotel_id");
  const year = searchParams.get("year");

  const store = await cookies();
  const token = store.get(AUTH_ACCESS_COOKIE)?.value ?? null;
  const locale = store.get("NEXT_LOCALE")?.value === "en" ? "en" : "id";

  const upstreamParams = new URLSearchParams();
  if (hotelId) upstreamParams.set("hotel_id", hotelId);
  if (year) upstreamParams.set("year", year);

  const qs = upstreamParams.toString() ? `?${upstreamParams.toString()}` : "";
  const upstream = await fetch(`${API_BASE_URL}/audit/sessions/dashboard-breakdowns${qs}`, {
    headers: {
      accept: "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      "accept-language": locale,
    },
    cache: "no-store",
  });

  if (!upstream.ok) {
    return new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: { "content-type": "application/json" },
    });
  }

  const json = await upstream.json();
  return NextResponse.json(json);
}
