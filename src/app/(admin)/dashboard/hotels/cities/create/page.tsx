import { serverApiFetch } from "@/lib/api/client";
import type { Province, Region } from "@/app/actions/hotels";
import { CityCreateClient } from "./city-create-client";

export default async function CityCreatePage() {
  const [provincesRes, regionsRes] = await Promise.all([
    serverApiFetch<{ data?: Province[] }>("/provinces").catch(() => ({ data: [] })),
    serverApiFetch<{ data?: Region[] }>("/regions").catch(() => ({ data: [] })),
  ]);

  return (
    <CityCreateClient
      provinces={provincesRes.data ?? []}
      regions={regionsRes.data ?? []}
    />
  );
}
