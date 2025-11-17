import { notFound } from "next/navigation";
import { serverApiFetch, ApiError } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi";
import { BrandEditClient } from "@/app/(admin)/dashboard/hotels/brands/[id]/edit/brand-edit-client";

type BrandDetail = components["schemas"]["BrandDetail"];

export const dynamic = "force-dynamic";

export default async function BrandEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let brand: BrandDetail | null = null;
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: BrandDetail }>(
      `/brands/${encodeURIComponent(id)}`,
    );
    brand = res.data ?? null;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      notFound();
    }
  }

  if (!brand) {
    notFound();
  }

  return <BrandEditClient brand={brand} />;
}
