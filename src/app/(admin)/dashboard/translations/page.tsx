import { AdminPageHeader } from "@/components/admin/design-system";
import { serverApiFetch } from "@/lib/api/client";
import { TranslationsClient } from "./translations-client";

export const dynamic = "force-dynamic";

interface TranslationsResponse {
  success?: boolean;
  data?: {
    locale?: string;
    items?: Array<{
      entity_type?: string;
      entity_id?: string;
      field_name?: string;
      content?: string;
    }>;
  };
}

export default async function TranslationsPage() {
  let items: Array<{
    entity_type?: string;
    entity_id?: string;
    field_name?: string;
    content?: string;
  }> = [];

  try {
    const res = await serverApiFetch<TranslationsResponse>("/translations?locale=id");
    items = res?.data?.items ?? [];
  } catch {
    items = [];
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        titleKey="nav.translations"
        subtitleKey="common.brandTagline"
        iconKey="database"
      />
      <TranslationsClient initialItems={items} currentLocale="id" />
    </div>
  );
}
