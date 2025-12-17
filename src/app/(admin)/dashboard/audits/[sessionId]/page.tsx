import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/design-system";
import { serverApiFetch } from "@/lib/api/client";
import { getServerSession, roleCodes } from "@/lib/auth/session";
import {
  type AuditMediaRow,
  type ComprehensiveAuditData,
} from "@/app/actions/audit";
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

async function fetchComprehensive(id: string): Promise<ComprehensiveAuditData | undefined> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: ComprehensiveAuditData }>(
      `/audit/sessions/${id}/comprehensive`,
    );
    return res.data;
  } catch {
    return undefined;
  }
}

async function fetchMedia(id: string): Promise<AuditMediaRow[]> {
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: AuditMediaRow[] }>(
      `/audit/sessions/${id}/media`,
    );
    return res.data ?? [];
  } catch {
    return [];
  }
}

export const dynamic = "force-dynamic";

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const [detail, compData, mediaList, session] = await Promise.all([
    fetchDetail(sessionId),
    fetchComprehensive(sessionId),
    fetchMedia(sessionId),
    getServerSession(),
  ]);

  if (!detail?.session) notFound();

  const userRoles = roleCodes(session);
  const canPublish = userRoles.includes("ROOT_ADMIN") || userRoles.includes("CORP_AUDITOR");
  const media: AuditMediaRow[] = mediaList ?? [];
  const comprehensiveData: ComprehensiveAuditData | undefined = compData;

  let hotel: {
    id: string;
    name: string;
    code: string;
    image_url?: string | null;
    brand?: string | null;
    brand_tier?: string | null;
    city?: string | null;
    address?: string | null;
    geo?: { lat: number; lng: number };
    geofence_radius_meters?: number;
  } | null = null;
  let hotelGeo: { lat: number; lng: number; geofence_radius?: number } | null = null;
  if (detail.session.hotel_id) {
    try {
      const hotelRes = await serverApiFetch<{
        data?: {
          id: string;
          name: string;
          code: string;
          image_url?: string | null;
          brand?: string | null;
          brand_tier?: string | null;
          city?: string | null;
          address?: string | null;
          geo?: { lat: number; lng: number };
          geofence_radius_meters?: number;
        };
      }>(`/hotels/${detail.session.hotel_id}`);
      if (hotelRes?.data) {
        hotel = hotelRes.data;
        if (hotelRes.data.geo) {
          hotelGeo = {
            lat: hotelRes.data.geo.lat,
            lng: hotelRes.data.geo.lng,
            geofence_radius: hotelRes.data.geofence_radius_meters ?? 200,
          };
        }
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
        hotel={hotel}
        hotelGeo={hotelGeo}
        comprehensiveData={comprehensiveData}
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