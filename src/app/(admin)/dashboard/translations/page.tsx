import { AdminPageHeader } from "@/components/admin/design-system";
import { serverApiFetch } from "@/lib/api/client";
import { TranslationsClient, type TranslationItem } from "./translations-client";

export const dynamic = "force-dynamic";

interface TranslationsResponse {
  success?: boolean;
  data?: {
    locale?: string;
    items?: TranslationItem[];
  };
}

export default async function TranslationsPage() {
  let items: TranslationItem[] = [];

  try {
    const [resId, resEn] = await Promise.all([
      serverApiFetch<TranslationsResponse>("/translations?locale=id").catch(() => null),
      serverApiFetch<TranslationsResponse>("/translations?locale=en").catch(() => null),
    ]);
    const itemsId = (resId?.data?.items ?? []).map((it) => ({ ...it, locale: "id" }));
    const itemsEn = (resEn?.data?.items ?? []).map((it) => ({ ...it, locale: "en" }));
    items = [...itemsId, ...itemsEn];
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
      <TranslationsClient initialItems={items} />
    </div>
  );
}
