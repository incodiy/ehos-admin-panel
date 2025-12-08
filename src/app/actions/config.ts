"use server";

import { revalidatePath } from "next/cache";
import { ApiError, serverApiFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi";

export type ChecklistTemplate = components["schemas"]["ChecklistTemplate"];
export type ChecklistSection = components["schemas"]["ChecklistSection"];
export type ChecklistItem = components["schemas"]["ChecklistItem"];
export type TemplateDetail = components["schemas"]["TemplateDetail"];
export type Brand = components["schemas"]["Brand"];
export type BrandTier = components["schemas"]["BrandTierUpdateRequest"]["tier"];
export type RubricType = NonNullable<components["schemas"]["ItemUpdateRequest"]["rubric_type"]>;
export type Department = components["schemas"]["ChecklistTemplate"]["department"];

export type ItemInput = {
  code: string;
  question_text: string;
  rubric_type: RubricType;
  max_score: number;
  weight: number;
  na_allowed: boolean;
  is_life_safety: boolean;
  sort_order: number;
};

type ActionOutcome = {
  ok: boolean;
  status?: number;
  message?: string;
  data?: unknown;
};

function wrapError(err: unknown): ActionOutcome {
  if (err instanceof ApiError) {
    const raw = err.body as { message?: string; detail?: unknown } | null;
    const detail = raw?.detail;
    const message =
      raw?.message ??
      (typeof detail === "string" ? detail : Array.isArray(detail) ? "validation_error" : `http_${err.status}`);
    return { ok: false, status: err.status, message };
  }
  return { ok: false, status: 0, message: "network_error" };
}

/* ─── Checklist bank ─── */

export async function configTemplatesAction(filters?: {
  department?: string;
  brandTier?: string;
  status?: string;
}): Promise<ActionOutcome> {
  try {
    const qs = new URLSearchParams();
    if (filters?.department) qs.set("department", filters.department);
    if (filters?.brandTier) qs.set("brand_tier", filters.brandTier);
    if (filters?.status) qs.set("status", filters.status);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    const res = await serverApiFetch<{ data?: ChecklistTemplate[] }>(
      `/checklist/templates${suffix}`,
    );
    return { ok: true, data: res.data ?? [] };
  } catch (err) {
    return wrapError(err);
  }
}

export async function configTemplateDetailAction(templateId: string): Promise<ActionOutcome> {
  try {
    const res = await serverApiFetch<{ data?: TemplateDetail }>(
      `/checklist/templates/${templateId}`,
    );
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

export async function configCreateTemplateAction(input: {
  department: Department;
  name: string;
  version: string;
  brandTier: string | null;
}): Promise<ActionOutcome> {
  try {
    const res = await serverApiFetch<{ data?: ChecklistTemplate }>("/checklist/templates", {
      method: "POST",
      body: {
        department: input.department,
        name: input.name,
        version: input.version,
        brand_tier: input.brandTier || null,
      },
    });
    revalidatePath("/dashboard/config/checklist");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

export async function configNewVersionAction(
  templateId: string,
  newVersion: string,
): Promise<ActionOutcome> {
  try {
    const res = await serverApiFetch<{ data?: ChecklistTemplate }>(
      `/checklist/templates/${templateId}/versions`,
      { method: "POST", body: { new_version: newVersion } },
    );
    revalidatePath("/dashboard/config/checklist");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

export async function configLockTemplateAction(templateId: string): Promise<ActionOutcome> {
  try {
    const res = await serverApiFetch<{ data?: ChecklistTemplate }>(
      `/checklist/templates/${templateId}/lock`,
      { method: "POST" },
    );
    revalidatePath("/dashboard/config/checklist");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

export async function configUpdateTemplateStatusAction(
  templateId: string,
  newStatus: "DRAFT" | "LOCKED" | "ARCHIVED"
): Promise<ActionOutcome> {
  try {
    const res = await serverApiFetch<{ data?: ChecklistTemplate }>(
      `/checklist/templates/${templateId}/status`,
      {
        method: "PATCH",
        body: { status: newStatus },
      }
    );
    revalidatePath("/dashboard/config/checklist");
    revalidatePath(`/dashboard/config/checklist/${templateId}/edit`);
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

export async function configAddSectionAction(
  templateId: string,
  input: { code: string; name: string; sort_order: number },
): Promise<ActionOutcome> {
  try {
    const res = await serverApiFetch<{ data?: ChecklistSection }>(
      `/checklist/templates/${templateId}/sections`,
      { method: "POST", body: input },
    );
    revalidatePath("/dashboard/config/checklist");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

export async function configAddItemAction(
  templateId: string,
  sectionId: string,
  input: ItemInput,
): Promise<ActionOutcome> {
  try {
    const res = await serverApiFetch<{ data?: ChecklistItem }>(
      `/checklist/templates/${templateId}/sections/${sectionId}/items`,
      { method: "POST", body: input },
    );
    revalidatePath("/dashboard/config/checklist");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

export async function configUpdateItemAction(
  templateId: string,
  sectionId: string,
  itemId: string,
  body: components["schemas"]["ItemUpdateRequest"],
): Promise<ActionOutcome> {
  try {
    const res = await serverApiFetch<{ data?: ChecklistItem }>(
      `/checklist/templates/${templateId}/sections/${sectionId}/items/${itemId}`,
      { method: "PATCH", body },
    );
    revalidatePath("/dashboard/config/checklist");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

export async function configArchiveTemplateAction(templateId: string): Promise<ActionOutcome> {
  try {
    const res = await serverApiFetch<{ data?: ChecklistTemplate }>(
      `/checklist/templates/${templateId}/archive`,
      { method: "POST" },
    );
    revalidatePath("/dashboard/config/checklist");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

export async function configDeleteTemplateAction(templateId: string): Promise<ActionOutcome> {
  try {
    const res = await serverApiFetch<{ data?: { status: string; message: string } }>(
      `/checklist/templates/${templateId}`,
      { method: "DELETE" },
    );
    revalidatePath("/dashboard/config/checklist");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

export async function configDeleteSectionAction(
  templateId: string,
  sectionId: string,
): Promise<ActionOutcome> {
  try {
    const res = await serverApiFetch<{ data?: { status: string; message: string } }>(
      `/checklist/templates/${templateId}/sections/${sectionId}`,
      { method: "DELETE" },
    );
    revalidatePath("/dashboard/config/checklist");
    revalidatePath(`/dashboard/config/checklist/${templateId}/edit`);
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

export async function configDeleteItemAction(
  templateId: string,
  sectionId: string,
  itemId: string,
): Promise<ActionOutcome> {
  try {
    const res = await serverApiFetch<{ data?: { status: string; message: string } }>(
      `/checklist/templates/${templateId}/sections/${sectionId}/items/${itemId}`,
      { method: "DELETE" },
    );
    revalidatePath("/dashboard/config/checklist");
    revalidatePath(`/dashboard/config/checklist/${templateId}/edit`);
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

/* ─── Brand tiers ─── */

export async function configBrandsAction(filters?: {
  search?: string;
  tier?: string;
  status?: string;
  per_page?: number;
}): Promise<ActionOutcome> {
  try {
    const qs = new URLSearchParams();
    if (filters?.search) qs.set("search", filters.search);
    if (filters?.tier) qs.set("tier", filters.tier);
    if (filters?.status) qs.set("status", filters.status);
    qs.set("per_page", String(filters?.per_page ?? 100));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    const res = await serverApiFetch<{ data?: Brand[] }>(`/brands${suffix}`);
    return { ok: true, data: res.data ?? [] };
  } catch (err) {
    return wrapError(err);
  }
}

export async function configUpdateBrandTierAction(
  code: string,
  tier: BrandTier,
): Promise<ActionOutcome> {
  try {
    const res = await serverApiFetch<{ data?: Brand }>(
      `/brands/${encodeURIComponent(code)}/tier`,
      {
        method: "PATCH",
        body: { tier },
      },
    );
    revalidatePath("/dashboard/config/brand-tiers");
    revalidatePath("/dashboard/hotels/brands");
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}