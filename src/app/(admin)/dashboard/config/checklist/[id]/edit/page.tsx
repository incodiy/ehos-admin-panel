import { notFound } from "next/navigation";
import { serverApiFetch, ApiError } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi";
import { ChecklistEditClient } from "./checklist-edit-client";

type TemplateDetail = components["schemas"]["TemplateDetail"];

export const dynamic = "force-dynamic";

export default async function ChecklistEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { id } = await params;
  const { returnTo } = await searchParams;

  let templateDetail: TemplateDetail | null = null;
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: TemplateDetail }>(
      `/checklist/templates/${encodeURIComponent(id)}`,
    );
    templateDetail = res.data ?? null;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      notFound();
    }
  }

  if (!templateDetail) {
    notFound();
  }

  return <ChecklistEditClient templateDetail={templateDetail} returnTo={returnTo} />;
}
