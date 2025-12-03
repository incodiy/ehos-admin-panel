import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/design-system";
import { getServerSession } from "@/lib/auth/session";
import { serverApiFetch } from "@/lib/api/client";
import {
  QuotationCreateClient,
  type LeadOption,
  type HotelOption,
  type SbmRateOption,
} from "./quotation-create-client";

export const dynamic = "force-dynamic";

export default async function QuotationCreatePage({
  searchParams,
}: {
  searchParams: Promise<{ lead_id?: string }>;
}) {
  const session = await getServerSession();
  if (!session?.user) {
    redirect("/login");
  }
  const params = await searchParams;

  let leads: LeadOption[] = [];
  try {
    const leadsRes = await serverApiFetch<{ data?: LeadOption[] }>("/crm/leads");
    leads = leadsRes.data ?? [];
  } catch {
    leads = [];
  }

  let hotels: HotelOption[] = [];
  try {
    const hotelsRes = await serverApiFetch<{ data?: HotelOption[] }>("/hotels?limit=200");
    hotels = hotelsRes.data ?? [];
  } catch {
    hotels = [];
  }

  let sbmRates: SbmRateOption[] = [];
  try {
    const sbmRes = await serverApiFetch<{ data?: SbmRateOption[] }>("/crm/sbm-rates");
    sbmRates = sbmRes.data ?? [];
  } catch {
    sbmRates = [];
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <AdminPageHeader
          titleKey="quotations.createTitle"
          subtitleKey="quotations.createSubtitle"
          iconKey="file-text"
        />
        <Link
          href="/dashboard/crm/quotations"
          className="inline-flex items-center gap-2 self-start rounded-xl border border-border/70 bg-card/60 px-4 py-2 text-xs font-semibold text-muted-foreground shadow-sm transition-smooth hover:border-primary/40 hover:text-foreground"
        >
          ← Kembali ke Daftar Quotation
        </Link>
      </div>

      <QuotationCreateClient
        leads={leads}
        hotels={hotels}
        sbmRates={sbmRates}
        preselectedLeadId={params.lead_id}
      />
    </div>
  );
}
