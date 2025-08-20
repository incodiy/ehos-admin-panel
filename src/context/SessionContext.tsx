"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Session, RoleCode } from "@/lib/auth/session";
import { roleCodes as roleCodesOf } from "@/lib/auth/session";

/** Item dropdown Switch Active Hotel (A1) — GET /auth/hotels. */
export interface MyHotelEntry {
  hotel_id?: string;
  hotel_code?: string;
  hotel_name?: string;
  role_id?: string;
  role_code?: string;
  is_primary?: boolean;
}

interface SessionContextValue {
  /** Sesi server (dari GET /auth/me via RSC) — null bila belum login. */
  session: Session | null;
  /** Hotel dalam scope user (Switch Active Hotel). */
  hotels: MyHotelEntry[];
  /** Kode role aktif (9 role RBAC) untuk guard UI. */
  roleCodes: RoleCode[];
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({
  session,
  hotels,
  children,
}: {
  session: Session | null;
  hotels: MyHotelEntry[];
  children: ReactNode;
}) {
  return (
    <SessionContext.Provider value={{ session, hotels, roleCodes: roleCodesOf(session) }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}