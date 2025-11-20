import { AdminPageHeader } from "@/components/admin/design-system";
import { getServerSession } from "@/lib/auth/session";
import { ConfigTiles } from "./config-tiles-client";

export const dynamic = "force-dynamic";

export default async function ConfigHubPage() {
  await getServerSession();
  return (
    <>
      <AdminPageHeader titleKey="cfg.title" subtitleKey="cfg.subtitle" iconKey="list-checks" />
      <ConfigTiles />
    </>
  );
}