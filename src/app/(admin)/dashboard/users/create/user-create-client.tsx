"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Globe,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Info,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  Phone,
  Mail,
  User as UserIcon,
} from "lucide-react";
import { createUserAction, type UserCreateRequest } from "@/app/actions/users";
import type { components } from "@/lib/api/openapi";
import { getRoleScopeCategory } from "../_components/user-role-badge";

type RoleWithPermissions = components["schemas"]["RoleWithPermissions"];
type Hotel = components["schemas"]["Hotel"];
type Region = { id: string; name: string; code: string };

interface UserCreateClientProps {
  roles: RoleWithPermissions[];
  hotels: Hotel[];
  regions: Region[];
}

export function UserCreateClient({
  roles,
  hotels,
  regions,
}: UserCreateClientProps) {
  const t = useTranslations("users");
  const router = useRouter();

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredLocale, setPreferredLocale] = useState<"id" | "en">("id");
  const [selectedRoleCode, setSelectedRoleCode] = useState<string>(
    roles[0]?.code || "HOTEL_GM",
  );
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [primaryHotelId, setPrimaryHotelId] = useState<string>("");
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(true);
  const [password, setPassword] = useState<string>("Ehos#2026!");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState<boolean>(false);
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
      const updated = exists
        ? prev.filter((id) => id !== hotelId)
        : [...prev, hotelId];
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
      prev.includes(regionId)
        ? prev.filter((id) => id !== regionId)
        : [...prev, regionId],
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // Basic Validations
    if (!name.trim()) {
      setFeedback({ type: "error", message: "Nama lengkap wajib diisi." });
      return;
    }
    if (!email.trim()) {
      setFeedback({ type: "error", message: "Alamat email wajib diisi." });
      return;
    }
    if (password.length < 8) {
      setFeedback({ type: "error", message: "Password awal minimal 8 karakter." });
      return;
    }

    // Validation for unit roles
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

    const payload: UserCreateRequest = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      preferred_locale: preferredLocale,
      password: password,
      role_code: selectedRoleCode as UserCreateRequest["role_code"],
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
      const res = await createUserAction(payload);
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
        message: t("feedback.createdSuccess"),
      });

      setTimeout(() => {
        router.push("/dashboard/users");
        router.refresh();
      }, 1200);
    } catch {
      setFeedback({
        type: "error",
        message: t("feedback.errorGeneric"),
      });
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Back button link */}
      <div className="border-b border-border/40 pb-4">
        <Link
          href="/dashboard/users"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar Pengguna</span>
        </Link>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`flex items-start gap-3 p-4 rounded-xl border text-sm animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-destructive" />
          )}
          <div className="flex-1 font-medium">{feedback.message}</div>
        </div>
      )}

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form
            onSubmit={handleFormSubmit}
            className="p-6 bg-card border border-border/60 rounded-2xl shadow-sm space-y-6"
          >
            <div className="border-b border-border/40 pb-4">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-primary" />
                Informasi Pengguna
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Lengkapi identitas dasar dan kredensial login pengguna.
              </p>
            </div>

            {/* Personal Info Fields */}
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
                    {t("form.email")} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("form.emailPlaceholder")}
                      className="w-full pl-9 pr-3.5 py-2 text-sm bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

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

            {/* Role & Authentication */}
            <div className="space-y-4 pt-4 border-t border-border/40">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  {t("form.role")} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedRoleCode}
                  onChange={(e) => setSelectedRoleCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  {roles.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name} ({r.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    {t("form.password")} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("form.passwordPlaceholder")}
                      className="w-full pl-3.5 pr-10 py-2 text-sm bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center pt-6">
                  <label className="inline-flex items-center gap-2 text-xs text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mustChangePassword}
                      onChange={(e) => setMustChangePassword(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span>{t("form.mustChangePassword")}</span>
                  </label>
                </div>
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
                <span>{submitting ? t("form.saving") : t("form.submitCreate")}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: RBAC Live Helper (5 cols, Sticky) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24 self-start">
          <div className="p-6 bg-card border border-border/60 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-border/40 pb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                {t("rbacHelper.title")}
              </h3>
            </div>

            {/* Scope Summary Card */}
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
                  Daftar Izin & Hak Akses
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {selectedRole?.permissions?.length || 0} permissions
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 p-2 bg-muted/20 rounded-xl border border-border/40">
                {selectedRole?.permissions && selectedRole.permissions.length > 0 ? (
                  selectedRole.permissions.map((p) => (
                    <div
                      key={p.code}
                      className="flex items-start gap-2 p-2 rounded-lg text-xs hover:bg-muted/40 transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                      <div>
                        <div className="font-mono text-[11px] font-bold text-foreground">
                          {p.code}
                        </div>
                        {p.description && (
                          <div className="text-[10px] text-muted-foreground">
                            {p.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    Tidak ada permissions terdaftar untuk role ini.
                  </div>
                )}
              </div>
            </div>

            {/* Security Guard Notice */}
            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40 text-xs text-muted-foreground space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-primary" />
                <span>Kebijakan Keamanan Akun</span>
              </div>
              <p className="leading-relaxed">
                Kata sandi awal wajib diubah oleh pengguna saat pertama kali login jika opsi &apos;Wajib Ganti Password&apos; diaktifkan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
