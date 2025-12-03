import { AdminPageHeader } from "@/components/admin/design-system";
import { getServerSession } from "@/lib/auth/session";
import { serverApiFetch, ApiError } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi";
import { LeadsKanbanClient, type WarRoomData } from "./leads-kanban-client";

export const dynamic = "force-dynamic";

const STATUSES = ["LEAD", "CONTACTED", "PROSPECT", "CONFIRMED", "LOST"] as const;
export type LeadKanbanRow = components["schemas"]["LeadKanbanRow"];

export default async function LeadsKanbanPage() {
  const session = await getServerSession();
  const hotelParam = session?.activeHotel?.id ? `&hotel_id=${session.activeHotel.id}` : "";

  const columns: WarRoomData["columns"] = {};
  let dueTotal = 0;
  let error: ApiError | null = null;

  try {
    const [statusResults, dueResult] = await Promise.all([
      Promise.all(
        STATUSES.map(async (status) => {
          const res = await serverApiFetch<{
            data?: LeadKanbanRow[];
            meta?: components["schemas"]["PaginationMeta"];
          }>(`/crm/leads?status=${status}${hotelParam}`);
          return {
            status,
            rows: res.data ?? [],
            total: res.meta?.total ?? 0,
          };
        }),
      ),
      serverApiFetch<{ meta?: components["schemas"]["PaginationMeta"] }>(
        `/crm/leads?followup_due=true${hotelParam}`,
      ),
    ]);

    for (const s of statusResults) {
      columns[s.status] = { rows: s.rows, total: s.total };
    }
    dueTotal = dueResult.meta?.total ?? 0;
  } catch (e) {
    error = e instanceof ApiError ? e : new ApiError(0, null, "unknown_error");
  }

  return (
    <>
      <AdminPageHeader titleKey="crm.title" subtitleKey="crm.subtitle" iconKey="handshake" />
      <LeadsKanbanClient columns={columns} dueTotal={dueTotal} error={error} />
    </>
  );
}