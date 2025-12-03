import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/design-system";
import { getServerSession } from "@/lib/auth/session";
import { serverApiFetch } from "@/lib/api/client";
import type { CapaTicketDetail } from "@/app/actions/capa";
import { CapaEditClient } from "./capa-edit-client";

export const dynamic = "force-dynamic";

export interface UserOption {
  id: string;
  name: string;
  email: string;
}

export default async function CapaEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession();
  if (!session?.user) {
    redirect("/login");
  }

  let ticket: CapaTicketDetail | null = null;
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: CapaTicketDetail }>(
      `/capa/tickets/${id}`
    );
    ticket = res.data ?? null;
  } catch {
    redirect("/dashboard/capa");
  }

  if (!ticket) {
    redirect("/dashboard/capa");
  }

  // Guard: Hanya tiket berstatus OPEN atau IN_PROGRESS yang dapat diedit metadatanya
  if (ticket.status !== "OPEN" && ticket.status !== "IN_PROGRESS") {
    redirect(`/dashboard/capa/${id}`);
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
          href={`/dashboard/capa/${id}`}
          className="rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-smooth hover:text-foreground"
        >
          ← {session?.user?.preferred_locale === "en" ? "Ticket Details" : "Detail Tiket"}
        </Link>
        <AdminPageHeader
          titleKey="capa.editTitle"
          subtitleKey="capa.editSubtitle"
          iconKey="shield-alert"
        />
      </div>

      <CapaEditClient ticket={ticket} users={users} />
    </div>
  );
}
