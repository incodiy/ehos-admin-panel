"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Edit2,
  KeyRound,
  UserX,
  UserCheck,
  Search,
  Building2,
  Phone,
  Globe,
  User as UserIcon,
} from "lucide-react";
import { StatusPill, type Column } from "@/components/admin/data-table";
import { ModuleList } from "@/components/admin/module-list";
import { ApiError } from "@/lib/api/client";
import type { components } from "@/lib/api/openapi";
import { UserRoleBadge } from "./_components/user-role-badge";
import { UserStatusModal } from "./_components/user-status-modal";
import { UserResetPasswordModal } from "./_components/user-reset-password-modal";
import { UserAssignmentsCell } from "./_components/user-assignments-cell";

type User = components["schemas"]["User"];
type RoleWithPermissions = components["schemas"]["RoleWithPermissions"];
type Hotel = components["schemas"]["Hotel"];

export type UserListResult = {
  success?: boolean;
  data?: User[];
  meta?: components["schemas"]["PaginationMeta"];
};

const fmtDateTime = (v?: string | null) =>
  v ? new Date(v).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "—";

interface UsersClientProps {
  result: UserListResult | null;
  error: ApiError | null;
  page: number;
  roles: RoleWithPermissions[];
  hotels: Hotel[];
  currentSearch?: string;
  currentRoleFilter?: string;
  currentHotelFilter?: string;
  currentStatusFilter?: string;
}

export function UsersClient({
  result,
  error,
  page,
  roles,
  hotels,
  currentSearch = "",
  currentRoleFilter = "",
  currentHotelFilter = "",
  currentStatusFilter = "ACTIVE",
}: UsersClientProps) {
  const t = useTranslations("users");
  const router = useRouter();

  const [search, setSearch] = useState(currentSearch);
  const [roleFilter, setRoleFilter] = useState(currentRoleFilter);
  const [hotelFilter, setHotelFilter] = useState(currentHotelFilter);
  const [statusFilter, setStatusFilter] = useState(currentStatusFilter);

  // Modals state
  const [statusModalUser, setStatusModalUser] = useState<User | null>(null);
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);

  const applyFilters = (
    newSearch: string,
    newRole: string,
    newHotel: string,
    newStatus: string,
  ) => {
    const qs = new URLSearchParams();
    if (newSearch.trim()) qs.set("search", newSearch.trim());
    if (newRole.trim()) qs.set("role_code", newRole.trim());
    if (newHotel.trim()) qs.set("hotel_id", newHotel.trim());
    if (newStatus.trim() && newStatus !== "ACTIVE") qs.set("status", newStatus.trim());
    router.push(`/dashboard/users?${qs.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(search, roleFilter, hotelFilter, statusFilter);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setRoleFilter(val);
    applyFilters(search, val, hotelFilter, statusFilter);
  };

  const handleHotelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setHotelFilter(val);
    applyFilters(search, roleFilter, val, statusFilter);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setStatusFilter(val);
    applyFilters(search, roleFilter, hotelFilter, val);
  };

  const columns: Column<User>[] = [
    {
      key: "name",
      label_id: "Nama & Email",
      label_en: "Name & Email",
      render: (_, u) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/users/${u.id}/edit`}
              className="font-medium text-neutral-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              {u.name}
            </Link>
            {!u.is_active && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                Nonaktif
              </span>
            )}
          </div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">{u.email}</span>
        </div>
      ),
    },
    {
      key: "role",
      label_id: "Peran & Akses",
      label_en: "Role & Access",
      render: (_, u) => (
        <UserRoleBadge
          roleCode={u.role_code || u.role?.code || (u.roles && u.roles[0]?.code)}
          roleName={u.role_name || u.role?.name || (u.roles && u.roles[0]?.name)}
        />
      ),
    },
    {
      key: "hotels",
      label_id: "Penugasan Wilayah / Hotel",
      label_en: "Assignments",
      render: (_, u) => <UserAssignmentsCell user={u} maxDisplay={2} />,
    },
    {
      key: "contact",
      label_id: "Kontak & Bahasa",
      label_en: "Contact & Locale",
      render: (_, u) => (
        <div className="flex flex-col gap-0.5 text-xs">
          {u.phone ? (
            <span className="inline-flex items-center gap-1 text-neutral-700 dark:text-neutral-300">
              <Phone className="w-3 h-3 text-neutral-400" />
              {u.phone}
            </span>
          ) : (
            <span className="text-neutral-400">—</span>
          )}
          <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400">
            <Globe className="w-3 h-3" />
            {u.preferred_locale === "en" ? "English" : "Indonesia"}
          </span>
        </div>
      ),
    },
    {
      key: "active",
      label_id: "Status",
      label_en: "Status",
      render: (_, u) => (
        <StatusPill tone={u.is_active ? "on" : "off"}>
          {u.is_active ? t("active") : t("inactive")}
        </StatusPill>
      ),
    },
    {
      key: "lastLogin",
      label_id: "Login Terakhir",
      label_en: "Last Login",
      render: (_, u) => (
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {fmtDateTime(u.last_login_at)}
        </span>
      ),
    },
    {
      key: "actions",
      label_id: "Aksi",
      label_en: "Actions",
      render: (_, u) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            href={`/dashboard/users/${u.id}/edit`}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title={t("actions.edit")}
          >
            <Edit2 className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => setResetModalUser(u)}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-amber-600 dark:text-neutral-400 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
            title={t("actions.resetPassword")}
          >
            <KeyRound className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setStatusModalUser(u)}
            className={`p-1.5 rounded-lg transition-colors ${
              u.is_active
                ? "text-neutral-500 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                : "text-neutral-500 hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            }`}
            title={u.is_active ? t("actions.deactivate") : t("actions.activate")}
          >
            {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </button>
        </div>
      ),
    },
  ];

  const rows = result?.data ?? [];

  return (
    <>
      <ModuleList<User>
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id ?? ""}
        error={error}
        meta={result?.meta}
        page={page}
        icon={UserIcon}
        emptyKey="users.empty"
        totalKey="users.total"
        errorTitleKey="users.errorTitle"
        errorNetworkKey="users.errorNetwork"
        errorServerKey="users.errorServer"
        retryKey="users.retry"
        headerSlot={
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-neutral-900 dark:text-white">{t("title")}</h1>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t("subtitle")}</p>
              </div>
              <Link
                href="/dashboard/users/create"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-xs self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>{t("actions.create")}</span>
              </Link>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full">
              {/* Search Input */}
              <form onSubmit={handleSearchSubmit} className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("actions.searchPlaceholder")}
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </form>

              {/* Filter Group */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Role Select */}
                <div className="relative">
                  <select
                    value={roleFilter}
                    onChange={handleRoleChange}
                    className="pl-3 pr-8 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                  >
                    <option value="">{t("actions.allRoles")}</option>
                    {roles.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.name} ({r.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hotel Select */}
                <div className="relative">
                  <select
                    value={hotelFilter}
                    onChange={handleHotelChange}
                    className="pl-3 pr-8 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                  >
                    <option value="">{t("actions.allHotels")}</option>
                    {hotels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={handleStatusChange}
                    className="pl-3 pr-8 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                  >
                    <option value="ACTIVE">{t("statusFilter.active")}</option>
                    <option value="INACTIVE">{t("statusFilter.inactive")}</option>
                    <option value="ALL">{t("statusFilter.all")}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        }
      />

      {/* Modals */}
      <UserStatusModal
        user={statusModalUser}
        isOpen={!!statusModalUser}
        onClose={() => setStatusModalUser(null)}
        onSuccess={() => {
          router.refresh();
        }}
      />

      <UserResetPasswordModal
        user={resetModalUser}
        isOpen={!!resetModalUser}
        onClose={() => setResetModalUser(null)}
      />
    </>
  );
}