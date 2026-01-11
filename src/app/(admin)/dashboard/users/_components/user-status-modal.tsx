"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, UserCheck, UserX, Loader2, X } from "lucide-react";
import { toggleUserStatusAction } from "@/app/actions/users";
import type { components } from "@/lib/api/openapi";

type User = components["schemas"]["User"];

interface UserStatusModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
}

export function UserStatusModal({
  user,
  isOpen,
  onClose,
  onSuccess,
}: UserStatusModalProps) {
  const t = useTranslations("users");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const isActive = user.is_active;

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await toggleUserStatusAction(user.id || "");
      if (!res.ok) {
        setError(res.message || t("feedback.errorGeneric"));
        return;
      }
      onSuccess({
        ...user,
        is_active: !isActive,
      });
      onClose();
    } catch {
      setError(t("feedback.errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-lg ${
                isActive
                  ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {isActive ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                {isActive ? t("modal.confirmDeactivateTitle") : t("modal.confirmActivateTitle")}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {user.name} ({user.email})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            {isActive ? t("modal.confirmDeactivateDesc") : t("modal.confirmActivateDesc")}
          </p>

          {isActive && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Pengguna yang dinonaktifkan akan langsung diblokir dari sesi login dan hak akses operasional hotel.
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors disabled:opacity-50"
          >
            {t("modal.cancelButton")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
              isActive
                ? "bg-rose-600 hover:bg-rose-700 shadow-xs"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-xs"
            }`}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{t("modal.confirmButton")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
