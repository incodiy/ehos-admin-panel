import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/design-system";
import { serverApiFetch } from "@/lib/api/client";
import { getServerSession } from "@/lib/auth/session";
import { getAuditSessionMediaAction, type AuditMediaRow } from "@/app/actions/audit";
import { AuditDetailClient, type AuditDetail } from "./audit-detail-client";

async function fetchDetail(id: string): Promise<AuditDetail | null> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: AuditDetail }>(
      `/audit/sessions/${id}`,
    );
    return res.data ?? null;
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const [detail, mediaRes, session] = await Promise.all([
    fetchDetail(sessionId),
    getAuditSessionMediaAction(sessionId),
    getServerSession(),
  ]);

  if (!detail?.session) notFound();

  const userRoles = session?.roles?.map((r) => r.code ?? "") ?? [];
  const canPublish = userRoles.includes("ROOT_ADMIN") || userRoles.includes("CORP_AUDITOR");
  const media: AuditMediaRow[] = mediaRes.media ?? [];

  let hotelGeo: { lat: number; lng: number; geofence_radius?: number } | null = null;
  if (detail.session.hotel_id) {
    try {
      const hotelRes = await serverApiFetch<{
        data?: {
          geo?: { lat: number; lng: number };
          geofence_radius_meters?: number;
        };
      }>(`/hotels/${detail.session.hotel_id}`);
      if (hotelRes?.data?.geo) {
        hotelGeo = {
          lat: hotelRes.data.geo.lat,
          lng: hotelRes.data.geo.lng,
          geofence_radius: hotelRes.data.geofence_radius_meters ?? 200,
        };
      }
    } catch {
      // Graceful fallback to null
    }
  }

  return (
    <div className="space-y-6">
      <AoHeader />
      <AuditDetailClient
        detail={detail}
        canPublish={canPublish}
        media={media}
        hotelGeo={hotelGeo}
      />
    </div>
  );
}

function AoHeader() {
  return (
    <div className="flex items-center gap-3">
      <BackButton />
      <AdminPageHeader titleKey="audit.detailTitle" subtitleKey="audit.detailSubtitle" iconKey="list-checks" />
    </div>
  );
}

function BackButton() {
  return (
    <Link
      href="/dashboard/audits"
      className="rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-smooth hover:text-foreground"
    >
      ← audit
    </Link>
  );
}