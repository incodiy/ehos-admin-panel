import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/design-system";
import { getServerSession } from "@/lib/auth/session";
import { serverApiFetch } from "@/lib/api/client";
import {
  LeadCreateClient,
  type HotelOption,
  type ProvinceOption,
  type UserOption,
} from "@/app/(admin)/dashboard/crm/leads/create/lead-create-client";

export const dynamic = "force-dynamic";

export default async function LeadCreatePage() {
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
        },
      ];
    }
  }

  let provinces: ProvinceOption[] = [];
  try {
    const provRes = await serverApiFetch<{ data?: ProvinceOption[] }>("/provinces");
    provinces = provRes.data ?? [];
  } catch {
    provinces = [];
  }

  let users: UserOption[] = [];
  try {
    const usersRes = await serverApiFetch<{ data?: UserOption[] }>("/users?limit=100");
    users = usersRes.data ?? [];
  } catch {
    users = [];
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <AdminPageHeader
          titleKey="crm.createTitle"
          subtitleKey="crm.createSubtitle"
          iconKey="handshake"
        />
        <Link
          href="/dashboard/crm/leads"
          className="inline-flex items-center gap-2 self-start rounded-xl border border-border/70 bg-card/60 px-4 py-2 text-xs font-semibold text-muted-foreground shadow-sm transition-smooth hover:border-primary/40 hover:text-foreground"
        >
          ← Kembali ke War Room
        </Link>
      </div>

      <LeadCreateClient
        hotels={hotels}
        provinces={provinces}
        users={users}
        activeHotelId={session.activeHotel?.id}
        currentUserId={session.user.id}
      />
    </div>
  );
}
