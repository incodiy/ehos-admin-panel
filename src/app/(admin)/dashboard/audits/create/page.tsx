import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/design-system";
import { getServerSession } from "@/lib/auth/session";
import { serverApiFetch } from "@/lib/api/client";
import { AuditCreateClient } from "./audit-create-client";

export const dynamic = "force-dynamic";

export interface HotelDetailOption {
  id: string;
  code: string;
  name: string;
  brand?: string;
  brand_tier?: string;
  city?: string;
  geofence_radius_meters?: number;
}

export default async function AuditCreatePage() {
  const session = await getServerSession();

  const userRoles = session?.roles?.map((r) => r.code ?? "") ?? [];
  const canCreate = userRoles.includes("ROOT_ADMIN") || userRoles.includes("CORP_AUDITOR");
  if (!canCreate) {
    redirect("/dashboard/audits");
  }

  let hotels: HotelDetailOption[] = [];
  try {
    const hotelsRes = await serverApiFetch<{ data?: HotelDetailOption[] }>("/hotels?limit=200");
    hotels = hotelsRes.data ?? [];
  } catch {
    if (session?.activeHotel) {
      hotels = [
        {
          id: session.activeHotel.id ?? "",
          code: session.activeHotel.code ?? "",
          name: session.activeHotel.name ?? "",
          brand: session.activeHotel.brand ?? "",
          brand_tier: session.activeHotel.brand_tier ?? "Midscale",
          city: session.activeHotel.city ?? "",
          geofence_radius_meters: 200,
        },
      ];
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/audits"
          className="rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-smooth hover:text-foreground"
        >
          ← {session?.user?.preferred_locale === "en" ? "Audits" : "Sesi Audit"}
        </Link>
        <AdminPageHeader
          titleKey="audit.createTitle"
          subtitleKey="audit.createSubtitle"
          iconKey="list-checks"
        />
      </div>
      <AuditCreateClient hotels={hotels} activeHotelId={session?.activeHotel?.id} />
    </div>
  );
}
