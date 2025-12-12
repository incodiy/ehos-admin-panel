import { notFound } from "next/navigation";
import { serverApiFetch } from "@/lib/api/client";
import type { City } from "@/app/actions/cities";
import type { Province, Region } from "@/app/actions/hotels";
import { CityEditClient } from "./city-edit-client";

interface CityEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function CityEditPage({ params }: CityEditPageProps) {
  const { id } = await params;

  const [cityRes, provincesRes, regionsRes] = await Promise.all([
    serverApiFetch<{ data?: City }>(`/cities/${encodeURIComponent(id)}`).catch(() => null),
    serverApiFetch<{ data?: Province[] }>("/provinces").catch(() => ({ data: [] })),
    serverApiFetch<{ data?: Region[] }>("/regions").catch(() => ({ data: [] })),
  ]);

  if (!cityRes?.data) {
    notFound();
  }

  return (
    <CityEditClient
      city={cityRes.data}
      provinces={provincesRes.data ?? []}
      regions={regionsRes.data ?? []}
    />
  );
}
