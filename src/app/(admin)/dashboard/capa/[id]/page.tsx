import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/design-system";
import { getServerSession } from "@/lib/auth/session";
import { serverApiFetch } from "@/lib/api/client";
import { CapaDetailClient } from "./capa-detail-client";
import type { CapaTicketDetail } from "@/app/actions/capa";

async function fetchDetail(id: string): Promise<CapaTicketDetail | null> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: CapaTicketDetail }>(
      `/capa/tickets/${id}`,
    );
    return res.data ?? null;
  } catch {
    return null;
  }
}

export default async function CapaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession();
  const detail = await fetchDetail(id);

  if (!detail) notFound();

  let users: Array<{ id: string; name: string; email: string }> = [];
  try {
    const uRes = await serverApiFetch<{ data?: Array<{ id: string; name: string; email: string }> }>("/users?limit=100");
    users = uRes.data ?? [];
  } catch {
    // Graceful fallback
  }

  let hotelGeo: { lat?: number; lng?: number; geofence_radius?: number } | null = null;
  if (detail.hotel_id) {
    try {
      const hRes = await serverApiFetch<{ data?: { lat?: number; lng?: number; geofence_radius_meters?: number } }>(`/hotels/${detail.hotel_id}`);
      if (hRes.data) {
        hotelGeo = {
          lat: hRes.data.lat,
          lng: hRes.data.lng,
          geofence_radius: hRes.data.geofence_radius_meters,
        };
      }
    } catch {
      // Graceful fallback
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/capa"
          className="rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-smooth hover:text-foreground"
        >
          ← {detail.receipt_id}
        </Link>
        <AdminPageHeader titleKey="capa.hub.title" subtitleKey="capa.hub.subtitle" iconKey="shield-check" />
      </div>
      <CapaDetailClient detail={detail} session={session} users={users} hotelGeo={hotelGeo} />
    </div>
  );
}