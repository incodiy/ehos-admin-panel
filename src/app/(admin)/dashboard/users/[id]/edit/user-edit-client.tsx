"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Globe,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Info,
  KeyRound,
  UserX,
  UserCheck,
  User as UserIcon,
  Phone,
  Mail,
  Loader2,
} from "lucide-react";
import { updateUserAction, type UserUpdateRequest } from "@/app/actions/users";
import type { components } from "@/lib/api/openapi";
import { getRoleScopeCategory } from "../../_components/user-role-badge";
import { UserStatusModal } from "../../_components/user-status-modal";
import { UserResetPasswordModal } from "../../_components/user-reset-password-modal";

type User = components["schemas"]["User"];
type RoleWithPermissions = components["schemas"]["RoleWithPermissions"];
type Hotel = components["schemas"]["Hotel"];
type Region = { id: string; name: string; code: string };

const fmtDateTime = (v?: string | null) =>
  v ? new Date(v).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "—";

interface UserEditClientProps {
  user: User;
  roles: RoleWithPermissions[];
  hotels: Hotel[];
  regions: Region[];
}

export function UserEditClient({
  user: initialUser,
  roles,
  hotels,
  regions,
}: UserEditClientProps) {
  const t = useTranslations("users");
  const router = useRouter();

  const [user, setUser] = useState<User>(initialUser);

  // Form states
  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [preferredLocale, setPreferredLocale] = useState<"id" | "en">(
    user.preferred_locale || "id",
  );

  const initialRoleCode =
    user.role_code || user.role?.code || (user.roles && user.roles[0]?.code) || "";
  const [selectedRoleCode, setSelectedRoleCode] = useState<string>(initialRoleCode);

  const hotelList = user.hotel_assignments || user.hotels || [];
  const initialHotelIds = hotelList
    .map((h) => (h.hotel_id || h.id || "") as string)
    .filter(Boolean);
  const [selectedHotels, setSelectedHotels] = useState<string[]>(initialHotelIds);

  const initialPrimary =
    (hotelList.find((h) => h.is_primary)?.hotel_id ||
      hotelList.find((h) => h.is_primary)?.id ||
      initialHotelIds[0] ||
      "") as string;
  const [primaryHotelId, setPrimaryHotelId] = useState<string>(initialPrimary);

  const regionList = user.region_assignments || [];
  const initialRegionIds = regionList
    .map((r) => (r.region_id || r.id || "") as string)
    .filter(Boolean);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(initialRegionIds);

  // Modals state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const selectedRole = roles.find((r) => r.code === selectedRoleCode);
  const scopeCategory = getRoleScopeCategory(selectedRoleCode);

  const isRegionalRole = selectedRoleCode === "REGIONAL_ROM";
  const isUnitRole = [
    "HOTEL_GM",
    "HOTEL_HOD_TECH",
    "HOTEL_SALES",
    "HOTEL_FINANCE",
  ].includes(selectedRoleCode);
  const isCorporateRole = [
    "ROOT_ADMIN",
    "CORP_EXEC",
    "CORP_AUDITOR",
  ].includes(selectedRoleCode);

  const handleHotelToggle = (hotelId: string) => {
    if (!hotelId) return;
    setSelectedHotels((prev) => {
      const exists = prev.includes(hotelId);
      const updated = exists ? prev.filter((id) => id !== hotelId) : [...prev, hotelId];
      if (updated.length === 1 && !primaryHotelId) {
        setPrimaryHotelId(updated[0]);
      } else if (!updated.includes(primaryHotelId)) {
        setPrimaryHotelId(updated[0] || "");
      }
      return updated;
    });
  };

  const handleRegionToggle = (regionId: string) => {
    if (!regionId) return;
    setSelectedRegions((prev) =>
      prev.includes(regionId) ? prev.filter((id) => id !== regionId) : [...prev, regionId],
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!selectedRoleCode) {
      setFeedback({ type: "error", message: "Role / hak akses wajib dipilih." });
      return;
    }

    if (!name.trim()) {
      setFeedback({ type: "error", message: "Nama lengkap wajib diisi." });
      return;
    }

    if (isUnitRole && selectedHotels.length === 0) {
      setFeedback({
        type: "error",
        message: "Pilih minimal 1 hotel properti untuk role unit/hotel.",
      });
      return;
    }

    if (isRegionalRole && selectedRegions.length === 0) {
      setFeedback({
        type: "error",
        message: "Pilih minimal 1 wilayah untuk role Regional ROM.",
      });
      return;
    }

    setSubmitting(true);

    const payload: UserUpdateRequest = {
      name: name.trim(),
      phone: phone.trim() || undefined,
      preferred_locale: preferredLocale,
      role_code: selectedRoleCode,
      hotel_assignments: isUnitRole
        ? selectedHotels.map((hId) => ({
            hotel_id: hId,
            is_primary: hId === primaryHotelId,
          }))
        : undefined,
      region_assignments: isRegionalRole
        ? selectedRegions.map((rId) => ({
            region_id: rId,
          }))
        : undefined,
    };

    try {
      const res = await updateUserAction(user.id || "", payload);
      if (!res.ok) {
        setFeedback({
          type: "error",
          message: res.message || t("feedback.errorGeneric"),
        });
        setSubmitting(false);
        return;
      }

      setFeedback({
        type: "success",
        message: t("feedback.updatedSuccess"),
      });

      if (res.data) {
        setUser(res.data);
      }
      setSubmitting(false);
      router.refresh();
    } catch {
      setFeedback({
        type: "error",
        message: t("feedback.errorGeneric"),
      });
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back link & Quick action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/dashboard/users"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar Pengguna</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 transition-all cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{t("actions.resetPassword")}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsStatusModalOpen(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              user.is_active
                ? "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/25 hover:bg-rose-500/20"
                : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25 hover:bg-emerald-500/20"
            }`}
          >
            {user.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
            <span>{user.is_active ? t("actions.deactivate") : t("actions.activate")}</span>
          </button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`flex items-start gap-3 p-4 rounded-xl border text-sm animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300"
              : "bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          )}
          <div className="flex-1 font-medium">{feedback.message}</div>
        </div>
      )}

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Edit Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form
            onSubmit={handleFormSubmit}
            className="p-6 bg-card border border-border/60 rounded-2xl shadow-sm space-y-6"
          >
            <div className="border-b border-border/40 pb-4">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-primary" />
                Edit Profil & Penugasan
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Perbarui nama, kontak, role, dan cakupan properti hotel/wilayah pengguna.
              </p>
            </div>

            {/* Read-only Email field banner */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                {t("form.email")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={user.email || ""}
                  disabled
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-muted/40 border border-border/60 rounded-xl text-muted-foreground cursor-not-allowed"
                />
              </div>
              <span className="text-[11px] text-muted-foreground">
                Alamat email merupakan identitas login unik dan tidak dapat diubah.
              </span>
            </div>

            {/* Editable Info */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  {t("form.name")} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("form.namePlaceholder")}
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    {t("form.phone")}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t("form.phonePlaceholder")}
                      className="w-full pl-9 pr-3.5 py-2 text-sm bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    {t("form.locale")}
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                      value={preferredLocale}
                      onChange={(e) => setPreferredLocale(e.target.value as "id" | "en")}
                      className="w-full pl-9 pr-8 py-2 text-sm bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                      <option value="id">Bahasa Indonesia (Kanonikal)</option>
                      <option value="en">English (US)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Role & Scope */}
            <div className="space-y-4 pt-4 border-t border-border/40">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  {t("form.role")} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedRoleCode}
                  onChange={(e) => setSelectedRoleCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  required
                >
                  <option value="" disabled>
                    Pilih Peran / Hak Akses...
                  </option>
                  {roles.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name} ({r.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Scope Assignment: Unit / Hotel */}
              {isUnitRole && (
                <div className="space-y-2 pt-4 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-foreground">
                      {t("form.hotels")} <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      {selectedHotels.length} properti dipilih
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto p-3 bg-muted/20 border border-border/40 rounded-xl divide-y divide-border/30">
                    {hotels.map((h) => {
                      const hId = h.id ?? "";
                      const isSelected = selectedHotels.includes(hId);
                      return (
                        <div
                          key={hId || h.code}
                          className="flex items-center justify-between py-2 text-xs"
                        >
                          <label className="inline-flex items-center gap-2.5 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleHotelToggle(hId)}
                              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                            />
                            <span className="font-medium text-foreground">
                              {h.name}
                            </span>
                            <span className="text-muted-foreground">({h.code})</span>
                          </label>

                          {isSelected && (
                            <button
                              type="button"
                              onClick={() => setPrimaryHotelId(hId)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                                primaryHotelId === hId
                                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border/60"
                              }`}
                            >
                              {primaryHotelId === hId ? "★ Utama" : "Set Utama"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Scope Assignment: Regional ROM */}
              {isRegionalRole && (
                <div className="space-y-2 pt-4 border-t border-border/40">
                  <label className="block text-xs font-semibold text-foreground">
                    {t("form.regions")} <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-muted/20 border border-border/40 rounded-xl">
                    {regions.map((reg) => {
                      const rId = reg.id ?? "";
                      return (
                        <label
                          key={rId || reg.code}
                          className="inline-flex items-center gap-2 text-xs text-foreground cursor-pointer p-2 rounded-lg hover:bg-muted/40 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedRegions.includes(rId)}
                            onChange={() => handleRegionToggle(rId)}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                          />
                          <span>
                            {reg.name} ({reg.code})
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Scope Info Banner: Corporate */}
              {isCorporateRole && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-foreground text-xs">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-muted-foreground leading-relaxed">
                    Role Corporate memiliki wewenang global (Lintas seluruh unit properti hotel & regional). Penugasan hotel spesifik tidak diperlukan.
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-border/40">
              <Link
                href="/dashboard/users"
                className="px-4 py-2 text-xs font-semibold text-foreground bg-muted hover:bg-muted/80 border border-border/60 rounded-xl transition-all"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{submitting ? t("form.saving") : t("form.submitEdit")}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Metadata Audit & RBAC Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Metadata Card */}
          <div className="p-6 bg-card border border-border/60 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                {t("meta.title")}
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  user.is_active
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                    : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25"
                }`}
              >
                {user.is_active ? t("meta.active") : t("meta.inactive")}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                <span className="text-muted-foreground">{t("meta.userId")}</span>
                <span className="font-mono text-foreground font-medium">
                  {user.id}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                <span className="text-muted-foreground">
                  {t("meta.mustChangePassword")}
                </span>
                <span className="font-medium text-foreground">
                  {user.must_change_password ? t("meta.yes") : t("meta.no")}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                <span className="text-muted-foreground">{t("meta.lastLogin")}</span>
                <span className="text-foreground">
                  {user.last_login_at ? fmtDateTime(user.last_login_at) : t("meta.never")}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                <span className="text-muted-foreground">{t("meta.createdAt")}</span>
                <span className="text-foreground">
                  {fmtDateTime(user.created_at)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground">{t("meta.updatedAt")}</span>
                <span className="text-foreground">
                  {fmtDateTime(user.updated_at)}
                </span>
              </div>
            </div>
          </div>

          {/* RBAC Helper Card */}
          <div className="p-6 bg-card border border-border/60 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-border/40 pb-3">
              <Shield className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                {t("rbacHelper.title")}
              </h3>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Cakupan Otoritas
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${scopeCategory.bg} ${scopeCategory.text} border ${scopeCategory.border}`}>
                  {scopeCategory.label}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {scopeCategory.category === "corporate" && t("rbacHelper.corporate")}
                {scopeCategory.category === "regional" && t("rbacHelper.regional")}
                {scopeCategory.category === "unit" && t("rbacHelper.unit")}
                {scopeCategory.category === "public" && t("rbacHelper.public")}
              </p>
            </div>

            {/* Dynamic Permissions List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  Hak Akses Terdaftar
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {selectedRole?.permissions?.length || 0} permissions
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 bg-muted/20 rounded-xl border border-border/40">
                {selectedRole?.permissions && selectedRole.permissions.length > 0 ? (
                  selectedRole.permissions.map((p) => (
                    <div
                      key={p.code}
                      className="flex items-start gap-2 p-2 rounded-lg text-xs hover:bg-muted/40 transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                      <div>
                        <div className="font-mono text-[11px] font-semibold text-foreground">
                          {p.code}
                        </div>
                        {p.description && (
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {p.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Tidak ada permissions terdaftar untuk role ini.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <UserStatusModal
        user={user}
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onSuccess={(updated) => {
          setUser(updated);
          router.refresh();
        }}
      />

      <UserResetPasswordModal
        user={user}
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
      />
    </div>
  );
}
