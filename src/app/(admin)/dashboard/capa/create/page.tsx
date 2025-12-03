import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/design-system";
import { getServerSession } from "@/lib/auth/session";
import { serverApiFetch } from "@/lib/api/client";
import { CapaCreateClient } from "./capa-create-client";

export const dynamic = "force-dynamic";

export interface HotelOption {
  id: string;
  code: string;
  name: string;
  brand?: string;
  brand_tier?: string;
  city?: string;
}

export interface UserOption {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export default async function CapaCreatePage() {
  const session = await getServerSession();
  if (!session?.user) {
    redirect("/login");
  }

  let hotels: HotelOption[] = [];
  try {
    const hotelsRes = await serverApiFetch<{ data?: HotelOption[] }>("/hotels?limit=200");
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
        },
      ];
    }
  }

  let users: UserOption[] = [];
  try {
    const usersRes = await serverApiFetch<{ data?: UserOption[] }>("/users?limit=100");
    users = usersRes.data ?? [];
  } catch {
    // Graceful fallback
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/capa"
          className="rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-smooth hover:text-foreground"
        >
          ← {session?.user?.preferred_locale === "en" ? "CAPA Tickets" : "Daftar Tiket CAPA"}
        </Link>
        <AdminPageHeader
          titleKey="capa.createTitle"
          subtitleKey="capa.createSubtitle"
          iconKey="shield-alert"
        />
      </div>

      <CapaCreateClient
        hotels={hotels}
        users={users}
        activeHotelId={session?.activeHotel?.id}
      />
    </div>
  );
}
