import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/design-system";
import { getServerSession } from "@/lib/auth/session";
import { getAuditSessionDetailAction } from "@/app/actions/audit";
import { AuditEditClient } from "./audit-edit-client";

export const dynamic = "force-dynamic";

export default async function AuditEditPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const [sessionAuth, detailRes] = await Promise.all([
    getServerSession(),
    getAuditSessionDetailAction(sessionId),
  ]);

  if (!detailRes.ok || !detailRes.detail?.session) {
    notFound();
  }

  const auditSession = detailRes.detail.session;

  // Rule: Only DRAFT sessions can be edited
  if (auditSession.status !== "DRAFT") {
    redirect(`/dashboard/audits/${sessionId}`);
  }

  const userRoles = sessionAuth?.roles?.map((r) => r.code ?? "") ?? [];
  const canEdit =
    userRoles.includes("ROOT_ADMIN") ||
    userRoles.includes("CORP_AUDITOR") ||
    (sessionAuth?.activeHotel?.id &&
      String(sessionAuth.activeHotel.id) === String(auditSession.hotel_id));

  if (!canEdit) {
    redirect(`/dashboard/audits/${sessionId}`);
  }

  const isEn = sessionAuth?.user?.preferred_locale === "en";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/audits/${sessionId}`}
          className="rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-smooth hover:text-foreground"
        >
          ← {isEn ? "Session Detail" : "Detail Sesi"}
        </Link>
        <AdminPageHeader
          titleKey="audit.editTitle"
          subtitleKey="audit.editSubtitle"
          iconKey="list-checks"
        />
      </div>
      <AuditEditClient session={auditSession} />
    </div>
  );
}
