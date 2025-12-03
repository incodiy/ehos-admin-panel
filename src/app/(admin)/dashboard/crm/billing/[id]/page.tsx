import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/design-system";
import { getServerSession } from "@/lib/auth/session";
import { serverApiFetch } from "@/lib/api/client";
import { BillingDetailClient } from "./billing-detail-client";
import type { BillingMilestone } from "@/app/actions/billing";

export const dynamic = "force-dynamic";

export default async function BillingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession();
  if (!session?.user) {
    redirect("/login");
  }
  const { id } = await params;

  let milestone: BillingMilestone | null = null;
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: BillingMilestone }>(
      `/crm/billing/milestones/${id}`
    );
    milestone = res.data ?? null;
  } catch {
    milestone = null;
  }

  if (!milestone) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <AdminPageHeader
            titleKey="billing.title"
            subtitleKey="billing.subtitle"
            iconKey="credit-card"
          />
          <Link
            href="/dashboard/crm/billing"
            className="rounded-xl border border-border/70 bg-card/60 px-4 py-2 text-xs font-semibold text-muted-foreground transition-smooth hover:border-primary/40 hover:text-foreground"
          >
            ← Kembali ke Daftar Milestone
          </Link>
        </div>
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-8 text-center text-sm font-medium text-destructive">
          Milestone penagihan tidak ditemukan atau Anda tidak memiliki hak akses unit hotel.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <AdminPageHeader
          titleKey="billing.detailTitle"
          subtitleKey="billing.detailSubtitle"
          iconKey="credit-card"
        />
        <Link
          href="/dashboard/crm/billing"
          className="inline-flex items-center gap-2 self-start rounded-xl border border-border/70 bg-card/60 px-4 py-2 text-xs font-semibold text-muted-foreground shadow-sm transition-smooth hover:border-primary/40 hover:text-foreground"
        >
          ← Kembali ke Daftar Milestone
        </Link>
      </div>

      <BillingDetailClient milestone={milestone} />
    </div>
  );
}
