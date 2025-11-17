import { notFound } from "next/navigation";
import { serverApiFetch, ApiError } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi";
import { RegionEditClient } from "./region-edit-client";

type RegionDetail = components["schemas"]["RegionDetail"];

export const dynamic = "force-dynamic";

export default async function RegionEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let region: RegionDetail | null = null;
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: RegionDetail }>(
      `/regions/${encodeURIComponent(id)}`,
    );
    region = res.data ?? null;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      notFound();
    }
  }

  if (!region) {
    notFound();
  }

  return <RegionEditClient region={region} />;
}
