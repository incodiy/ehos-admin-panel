import { serverApiFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi";
import { HotelCreateClient } from "@/app/(admin)/dashboard/hotels/create/hotel-create-client";

type Brand = components["schemas"]["Brand"];
type Region = components["schemas"]["Region"];
type Province = components["schemas"]["Province"];

export const dynamic = "force-dynamic";

export default async function HotelCreatePage() {
  const [brandsRes, regionsRes, provincesRes, usersRes] = await Promise.all([
    serverApiFetch<{ data?: Brand[] }>("/brands").catch(() => ({ data: [] })),
    serverApiFetch<{ data?: Region[] }>("/regions").catch(() => ({ data: [] })),
    serverApiFetch<{ data?: Province[] }>("/provinces").catch(() => ({ data: [] })),
    serverApiFetch<{ data?: Array<{ id: string; name: string; role_code?: string }> }>("/users").catch(() => ({ data: [] })),
  ]);

  const users = usersRes.data ?? [];
  const gms = users.filter((u) => u.role_code === "HOTEL_GM");
  const roms = users.filter((u) => u.role_code === "REGIONAL_ROM");

  return (
    <HotelCreateClient
      brands={brandsRes.data ?? []}
      regions={regionsRes.data ?? []}
      provinces={provincesRes.data ?? []}
      gms={gms}
      roms={roms}
    />
  );
}
