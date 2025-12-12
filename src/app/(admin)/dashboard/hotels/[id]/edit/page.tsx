import { notFound } from "next/navigation";
import { serverApiFetch, ApiError } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi";
import { HotelEditClient } from "@/app/(admin)/dashboard/hotels/[id]/edit/hotel-edit-client";

type Hotel = components["schemas"]["Hotel"];
type Brand = components["schemas"]["Brand"];
type Region = components["schemas"]["Region"];
type Province = components["schemas"]["Province"];
type City = components["schemas"]["City"];
type HotelContact = components["schemas"]["HotelContact"];

export const dynamic = "force-dynamic";

export default async function HotelEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let hotel: Hotel | null = null;
  try {
    const res = await serverApiFetch<{ data?: Hotel }>(`/hotels/${encodeURIComponent(id)}`);
    hotel = res.data ?? null;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      notFound();
    }
  }

  if (!hotel) {
    notFound();
  }

  const [brandsRes, regionsRes, provincesRes, citiesRes, usersRes, contactsRes] = await Promise.all([
    serverApiFetch<{ data?: Brand[] }>("/brands").catch(() => ({ data: [] })),
    serverApiFetch<{ data?: Region[] }>("/regions").catch(() => ({ data: [] })),
    serverApiFetch<{ data?: Province[] }>("/provinces").catch(() => ({ data: [] })),
    serverApiFetch<{ data?: City[] }>("/cities").catch(() => ({ data: [] })),
    serverApiFetch<{ data?: Array<{ id: string; name: string; role_code?: string }> }>("/users").catch(() => ({ data: [] })),
    serverApiFetch<{ data?: HotelContact[] }>("/hotel-contacts?limit=500").catch(() => ({ data: [] })),
  ]);

  const users = usersRes.data ?? [];
  const gms = users.filter((u) => u.role_code === "HOTEL_GM");
  const roms = users.filter((u) => u.role_code === "REGIONAL_ROM");

  return (
    <HotelEditClient
      hotel={hotel}
      brands={brandsRes.data ?? []}
      regions={regionsRes.data ?? []}
      provinces={provincesRes.data ?? []}
      cities={citiesRes.data ?? []}
      gms={gms}
      roms={roms}
      contacts={contactsRes.data ?? []}
    />
  );
}
