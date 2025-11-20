import { AdminPageHeader } from "@/components/admin/design-system";
import { getServerSession } from "@/lib/auth/session";
import { ApiError, serverApiFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi";
import { ChecklistConfigClient } from "./checklist-config-client";

export const dynamic = "force-dynamic";
export type ChecklistTemplate = components["schemas"]["ChecklistTemplate"];

export default async function ChecklistConfigPage() {
  await getServerSession();
  let templates: ChecklistTemplate[] = [];
  let error: ApiError | null = null;
  try {
    const res = await serverApiFetch<{ data?: ChecklistTemplate[] }>("/checklist/templates");
    templates = res.data ?? [];
  } catch (e) {
    error = e instanceof ApiError ? e : new ApiError(0, null, "unknown_error");
  }
  return (
    <>
      <AdminPageHeader titleKey="cfg.checklistTitle" subtitleKey="cfg.checklistSubtitle" iconKey="list-checks" />
      <ChecklistConfigClient templates={templates} error={error} />
    </>
  );
}