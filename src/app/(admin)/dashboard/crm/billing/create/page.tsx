import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/design-system";
import { getServerSession } from "@/lib/auth/session";
import { serverApiFetch } from "@/lib/api/client";
import {
  BillingCreateClient,
  type AcceptedQuotationOption,
} from "./billing-create-client";

export const dynamic = "force-dynamic";

export default async function BillingCreatePage({
  searchParams,
}: {
  searchParams: Promise<{ quotation_id?: string }>;
}) {
  const session = await getServerSession();
  if (!session?.user) {
    redirect("/login");
  }
  const params = await searchParams;

  let quotations: AcceptedQuotationOption[] = [];
  try {
    const res = await serverApiFetch<{ data?: AcceptedQuotationOption[] }>(
      "/crm/quotations?status=ACCEPTED"
    );
    quotations = res.data ?? [];
  } catch {
    quotations = [];
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <AdminPageHeader
          titleKey="billing.createTitle"
          subtitleKey="billing.createSubtitle"
          iconKey="credit-card"
        />
        <Link
          href="/dashboard/crm/billing"
          className="inline-flex items-center gap-2 self-start rounded-xl border border-border/70 bg-card/60 px-4 py-2 text-xs font-semibold text-muted-foreground shadow-sm transition-smooth hover:border-primary/40 hover:text-foreground"
        >
          ← Kembali ke Daftar Milestone
        </Link>
      </div>

      <BillingCreateClient
        quotations={quotations}
        preselectedQuotationId={params.quotation_id}
      />
    </div>
  );
}
