import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/design-system";
import { getServerSession } from "@/lib/auth/session";
import { serverApiFetch } from "@/lib/api/client";
import {
  LeadEditClient,
  type LeadDetail,
  type ProvinceOption,
  type UserOption,
} from "@/app/(admin)/dashboard/crm/leads/[id]/edit/lead-edit-client";

export const dynamic = "force-dynamic";

export default async function LeadEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession();
  if (!session?.user) {
    redirect("/login");
  }

  let lead: LeadDetail | null = null;
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: LeadDetail }>(
      `/crm/leads/${id}`
    );
    lead = res.data ?? null;
  } catch {
    redirect("/dashboard/crm/leads");
  }

  if (!lead) {
    redirect("/dashboard/crm/leads");
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
          titleKey="crm.editTitle"
          subtitleKey="crm.editSubtitle"
          iconKey="handshake"
        />
        <Link
          href="/dashboard/crm/leads"
          className="inline-flex items-center gap-2 self-start rounded-xl border border-border/70 bg-card/60 px-4 py-2 text-xs font-semibold text-muted-foreground shadow-sm transition-smooth hover:border-primary/40 hover:text-foreground"
        >
          ← Kembali ke War Room
        </Link>
      </div>

      <LeadEditClient
        lead={lead}
        provinces={provinces}
        users={users}
      />
    </div>
  );
}
