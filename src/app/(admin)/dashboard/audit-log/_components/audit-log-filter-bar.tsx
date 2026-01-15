"use client";

import { useState } from "react";
import { Search, X, Filter, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

interface AuditLogFilterBarProps {
  currentSearch?: string;
  currentEntityType?: string;
  currentAction?: string;
}

const ENTITY_TYPE_OPTIONS = [
  { value: "", label: "Semua Tipe Entitas" },
  { value: "user", label: "User / Pengguna" },
  { value: "role", label: "Role & Akses" },
  { value: "hotel", label: "Master Hotel" },
  { value: "brand", label: "Brand Hotel" },
  { value: "audit_session", label: "Sesi Audit" },
  { value: "capa_ticket", label: "CAPA Ticket" },
  { value: "lead", label: "CRM Lead" },
  { value: "quotation", label: "CRM Penawaran" },
  { value: "billing_milestone", label: "Billing & Pembayaran" },
  { value: "auth", label: "Autentikasi / Auth" },
];

const ACTION_OPTIONS = [
  { value: "", label: "Semua Aksi" },
  { value: "USER_CREATE", label: "USER_CREATE" },
  { value: "USER_UPDATE", label: "USER_UPDATE" },
  { value: "USER_DEACTIVATE", label: "USER_DEACTIVATE" },
  { value: "PASSWORD_RESET", label: "PASSWORD_RESET" },
  { value: "ROLE_UPDATE", label: "ROLE_UPDATE" },
  { value: "HOTEL_UPDATE", label: "HOTEL_UPDATE" },
  { value: "HOTEL_STATUS_CHANGE", label: "HOTEL_STATUS_CHANGE" },
  { value: "BRAND_TIER_UPDATE", label: "BRAND_TIER_UPDATE" },
  { value: "SESSION_START", label: "SESSION_START" },
  { value: "SESSION_SUBMIT", label: "SESSION_SUBMIT" },
  { value: "SESSION_PUBLISH", label: "SESSION_PUBLISH" },
  { value: "CAPA_CREATE", label: "CAPA_CREATE" },
  { value: "CAPA_ASSIGN", label: "CAPA_ASSIGN" },
  { value: "CAPA_VERIFIED", label: "CAPA_VERIFIED" },
  { value: "LEAD_CREATE", label: "LEAD_CREATE" },
  { value: "QUOTATION_CREATE", label: "QUOTATION_CREATE" },
  { value: "QUOTATION_APPROVE", label: "QUOTATION_APPROVE" },
  { value: "BILLING_PAID", label: "BILLING_PAID" },
  { value: "LOGIN", label: "LOGIN" },
];

export function AuditLogFilterBar({
  currentSearch = "",
  currentEntityType = "",
  currentAction = "",
}: AuditLogFilterBarProps) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch);
  const [entityType, setEntityType] = useState(currentEntityType);
  const [action, setAction] = useState(currentAction);

  const applyFilters = (newSearch: string, newEntity: string, newAct: string) => {
    const qs = new URLSearchParams();
    if (newSearch.trim()) qs.set("search", newSearch.trim());
    if (newEntity.trim()) qs.set("entity_type", newEntity.trim());
    if (newAct.trim()) qs.set("action", newAct.trim());
    router.push(`/dashboard/audit-log?${qs.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(search, entityType, action);
  };

  const handleEntityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setEntityType(val);
    applyFilters(search, val, action);
  };

  const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setAction(val);
    applyFilters(search, entityType, val);
  };

  const handleReset = () => {
    setSearch("");
    setEntityType("");
    setAction("");
    router.push("/dashboard/audit-log");
  };

  const hasActiveFilters = Boolean(search || entityType || action);

  return (
    <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari email pelaku, aksi, tipe entitas, atau alamat IP..."
            className="w-full pl-10 pr-9 py-2.5 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-foreground placeholder:text-muted-foreground/70 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                applyFilters("", entityType, action);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Entity Type Dropdown */}
        <div className="w-full md:w-52">
          <select
            value={entityType}
            onChange={handleEntityChange}
            className="w-full px-3 py-2.5 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-foreground transition-all cursor-pointer"
          >
            {ENTITY_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Action Dropdown */}
        <div className="w-full md:w-52">
          <select
            value={action}
            onChange={handleActionChange}
            className="w-full px-3 py-2.5 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-foreground transition-all cursor-pointer font-mono"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium transition-all shrink-0 cursor-pointer"
            title="Reset semua filter"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
