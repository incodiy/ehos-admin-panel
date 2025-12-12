import { notFound } from "next/navigation";
import { serverApiFetch, ApiError } from "@/lib/api/client";
import type { Hotel } from "@/app/actions/hotels";
import { HotelDetailClient } from "./hotel-detail-client";

export const dynamic = "force-dynamic";

interface HotelDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function HotelDetailPage({ params }: HotelDetailPageProps) {
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

  return <HotelDetailClient hotel={hotel} />;
}
