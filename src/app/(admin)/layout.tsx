import { redirect } from "next/navigation";
import { getServerSession, hasAnyRole, ADMIN_ROLES } from "@/lib/auth/session";
import { serverApiFetch } from "@/lib/api/client";
import { AdminShell } from "@/components/admin/admin-shell";
import type { MyHotelEntry } from "@/context/SessionContext";

/**
 * Guard otorisasi SSR/RSC (RBAC A1-A5). Sesi dibaca dari cookie httpOnly via
 * GET /auth/me; tidak ada data pal. Token tidak pernah dibundle ke browser.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session || !hasAnyRole(session, ADMIN_ROLES)) {
    redirect("/login");
  }

  let hotels: MyHotelEntry[] = [];
  try {
    const res = await serverApiFetch<{ success?: boolean; data?: MyHotelEntry[] }>("/auth/hotels");
    hotels = res.data ?? [];
  } catch {
    // G4: scope hotel kosong (empty-state jujur) bila list gagal — tidak pernah data palsu.
  }

  return (
    <AdminShell session={session} hotels={hotels}>
      {children}
    </AdminShell>
  );
}