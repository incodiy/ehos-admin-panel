"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { Building2, Search, X, Star, MapPin } from "lucide-react";
import type { components } from "@/lib/api/openapi";

type User = components["schemas"]["User"];

interface UserAssignmentsCellProps {
  user: User;
  maxDisplay?: number;
}

export function UserAssignmentsCell({ user, maxDisplay = 2 }: UserAssignmentsCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen for Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setSearch("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const hotelAssignments = user.hotel_assignments || [];
  const regionAssignments = user.region_assignments || [];

  // Sort hotels so primary is always first
  const sortedHotels = useMemo(() => {
    return [...hotelAssignments].sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [hotelAssignments]);

  const filteredHotels = useMemo(() => {
    if (!search.trim()) return sortedHotels;
    const q = search.toLowerCase().trim();
    return sortedHotels.filter(
      (h) =>
        (h.name && h.name.toLowerCase().includes(q)) ||
        (h.code && h.code.toLowerCase().includes(q))
    );
  }, [sortedHotels, search]);

  if (hotelAssignments.length === 0 && regionAssignments.length === 0) {
    const isCorporate =
      user.role_code?.startsWith("ROOT_") || user.role_code?.startsWith("CORP_");
    return (
      <span className="text-xs text-neutral-400 dark:text-neutral-500 italic">
        {isCorporate ? "Semua Properti (Corporate)" : "Tidak ada penugasan"}
      </span>
    );
  }

  const visibleHotels = sortedHotels.slice(0, maxDisplay);
  const remainingCount = sortedHotels.length - maxDisplay;

  const modalContent =
    isOpen && mounted ? (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={() => {
          setIsOpen(false);
          setSearch("");
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          className="relative w-full max-w-lg sm:max-w-xl bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[82vh] animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-muted/30">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground text-sm sm:text-base flex items-center gap-2">
                  <span>Penugasan Hotel</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
                    {sortedHotels.length} Unit
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {user.name} <span className="opacity-60">({user.email})</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setSearch("");
              }}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0 ml-2"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input Bar */}
          <div className="p-3.5 sm:p-4 border-b border-border/40 bg-background/50">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Cari dari ${sortedHotels.length} hotel yang ditugaskan...`}
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 text-foreground placeholder:text-muted-foreground/70"
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List of Hotels */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1 divide-y divide-border/20">
            {filteredHotels.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                Tidak ada hotel yang sesuai dengan &ldquo;{search}&rdquo;
              </div>
            ) : (
              filteredHotels.map((ha, idx) => (
                <div
                  key={ha.hotel_id || ha.id || ha.code || idx}
                  className="flex items-center justify-between py-2 px-2.5 rounded-xl hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold ${
                        ha.is_primary
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                          : "bg-muted text-muted-foreground border border-border/50"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-medium text-foreground truncate">
                          {ha.name || ha.code || ha.hotel_id}
                        </span>
                        {ha.is_primary && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            Primary
                          </span>
                        )}
                      </div>
                      {ha.code && (
                        <span className="text-[10px] text-muted-foreground/70 font-mono">
                          Kode: {ha.code}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-5 py-3 border-t border-border/60 bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Menampilkan {filteredHotels.length} dari {sortedHotels.length} hotel
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setSearch("");
              }}
              className="px-4 py-2 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition-opacity cursor-pointer text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5 max-w-[320px]">
        {/* Regions */}
        {regionAssignments.map((ra) => (
          <span
            key={ra.region_id || ra.id || ra.code}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 shadow-2xs"
          >
            <MapPin className="w-2.5 h-2.5 text-sky-500 shrink-0" />
            <span className="truncate max-w-[130px]">{ra.name || ra.code || ra.region_id}</span>
          </span>
        ))}

        {/* First visible hotels */}
        {visibleHotels.map((ha) => (
          <span
            key={ha.hotel_id || ha.id || ha.code}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border shadow-2xs ${
              ha.is_primary
                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800/80"
                : "bg-neutral-100/90 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-300 border-neutral-200/80 dark:border-neutral-700/80"
            }`}
          >
            <Building2 className="w-2.5 h-2.5 opacity-60 shrink-0" />
            <span className="truncate max-w-[140px]">{ha.name || ha.code || ha.hotel_id}</span>
            {ha.is_primary && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold" title="Primary Hotel">
                ★
              </span>
            )}
          </span>
        ))}

        {/* More button badge */}
        {remainingCount > 0 && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
            title={`Lihat ${sortedHotels.length} hotel yang ditugaskan`}
          >
            <span>+{remainingCount} lainnya</span>
            <span className="text-[9px] opacity-70">▾</span>
          </button>
        )}
      </div>

      {/* Render via Portal to document.body so position is truly screen-centered and not trapped by table containers */}
      {mounted && typeof document !== "undefined" && modalContent
        ? createPortal(modalContent, document.body)
        : null}
    </>
  );
}
