import { AdminPageHeader } from "@/components/admin/design-system";
import { ContactsClient } from "./contacts-client";
import { listGlobalHotelContactsAction, type HotelContact } from "@/app/actions/hotel-contacts";
import { serverApiFetch } from "@/lib/api/client";
import type { Hotel } from "@/app/actions/hotels";

export const dynamic = "force-dynamic";

interface ContactsPageProps {
  searchParams: Promise<{
    search?: string;
    contact_type?: string;
    hotel_code?: string;
  }>;
}

export default async function ContactsPage({ searchParams }: ContactsPageProps) {
  const { search, contact_type, hotel_code } = await searchParams;

  const [contactsRes, hotelsRes] = await Promise.all([
    listGlobalHotelContactsAction({
      search,
      contact_type: contact_type === "ALL" ? undefined : contact_type,
      hotel_code: hotel_code === "ALL" ? undefined : hotel_code,
      limit: 500,
    }),
    serverApiFetch<{ data?: Hotel[] }>("/hotels?limit=500").catch(() => ({ data: [] })),
  ]);

  const contacts: HotelContact[] = contactsRes.data ?? [];
  const hotels: Hotel[] = hotelsRes.data ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        titleKey="contacts.title"
        subtitleKey="contacts.subtitle"
      />
      <ContactsClient
        contacts={contacts}
        hotels={hotels}
        error={contactsRes.ok ? null : new Error(contactsRes.message)}
        currentSearch={search ?? ""}
        currentRole={contact_type ?? "ALL"}
        currentHotel={hotel_code ?? "ALL"}
      />
    </div>
  );
}
