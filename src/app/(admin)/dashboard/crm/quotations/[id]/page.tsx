import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/design-system";
import { getServerSession } from "@/lib/auth/session";
import { serverApiFetch } from "@/lib/api/client";
import { QuotationDetailClient } from "./quotation-detail-client";
import type { QuotationDetail } from "@/app/actions/quotations";

export const dynamic = "force-dynamic";

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession();
  if (!session?.user) {
    redirect("/login");
  }
  const { id } = await params;

  let quotation: QuotationDetail | null = null;
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: QuotationDetail }>(
      `/crm/quotations/${id}`
    );
    quotation = res.data ?? null;
  } catch {
    quotation = null;
  }

  if (!quotation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <AdminPageHeader
            titleKey="quotations.title"
            subtitleKey="quotations.subtitle"
            iconKey="file-text"
          />
          <Link
            href="/dashboard/crm/quotations"
            className="rounded-xl border border-border/70 bg-card/60 px-4 py-2 text-xs font-semibold text-muted-foreground transition-smooth hover:border-primary/40 hover:text-foreground"
          >
            ← Kembali ke Daftar Quotation
          </Link>
        </div>
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-8 text-center text-sm font-medium text-destructive">
          Data penawaran tidak ditemukan atau Anda tidak memiliki hak akses (scope hotel/unit).
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <AdminPageHeader
          titleKey="quotations.detailTitle"
          subtitleKey="quotations.detailSubtitle"
          iconKey="file-text"
        />
        <Link
          href="/dashboard/crm/quotations"
          className="inline-flex items-center gap-2 self-start rounded-xl border border-border/70 bg-card/60 px-4 py-2 text-xs font-semibold text-muted-foreground shadow-sm transition-smooth hover:border-primary/40 hover:text-foreground"
        >
          ← Kembali ke Daftar Quotation
        </Link>
      </div>

      <QuotationDetailClient quotation={quotation} />
    </div>
  );
}
