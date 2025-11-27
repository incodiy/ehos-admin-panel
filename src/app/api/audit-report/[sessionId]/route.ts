import { API_BASE_URL } from "@/lib/api/client";
import { AUTH_ACCESS_COOKIE } from "@/lib/auth/tokens";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

/** Proxy PDF laporan audit (F-02) — token httpOnly server-side, stream ke browser. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const store = await cookies();
  const token = store.get(AUTH_ACCESS_COOKIE)?.value ?? null;
  const locale = store.get("NEXT_LOCALE")?.value === "en" ? "en" : "id";

  const upstream = await fetch(`${API_BASE_URL}/audit/sessions/${sessionId}/report.pdf`, {
    headers: {
      accept: "application/pdf",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      "accept-language": locale,
    },
    cache: "no-store",
  });

  if (!upstream.ok) {
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { "content-type": "application/json" },
    });
  }

  const disposition = upstream.headers.get("content-disposition") ?? "attachment";
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": disposition,
      "cache-control": "private, no-store",
    },
  });
}