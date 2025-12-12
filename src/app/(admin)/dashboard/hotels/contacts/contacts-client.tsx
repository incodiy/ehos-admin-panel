"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Contact,
  Plus,
  Edit2,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle2,
  Building2,
  Globe,
  Hotel as HotelIcon,
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  Shield,
  Briefcase,
  Users,
  DollarSign,
  UserCheck,
} from "lucide-react";
import { DataTable, type Column } from "@/components/admin/data-table";
import {
  createGlobalHotelContactAction,
  updateGlobalHotelContactAction,
  deleteGlobalHotelContactAction,
  type HotelContact,
  type HotelContactGlobalCreateRequest,
  type HotelContactUpdateRequest,
} from "@/app/actions/hotel-contacts";
import type { Hotel } from "@/app/actions/hotels";

type ContactType = "GM" | "SALES" | "FINANCE" | "ROM";

interface ContactsClientProps {
  contacts: HotelContact[];
  hotels: Hotel[];
  error: Error | null;
  currentSearch?: string;
  currentRole?: string;
  currentHotel?: string;
}

export function ContactsClient({
  contacts,
  hotels,
  error,
  currentSearch = "",
  currentRole = "ALL",
  currentHotel = "ALL",
}: ContactsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [selectedHotel, setSelectedHotel] = useState(currentHotel);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<HotelContact | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HotelContact | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    hotel_id: string;
    contact_type: ContactType;
    name: string;
    email: string;
    phone: string;
    is_primary: boolean;
  }>({
    hotel_id: "",
    contact_type: "GM",
    name: "",
    email: "",
    phone: "",
    is_primary: true,
  });

  // Calculate Metrics
  const totalCount = contacts.length;
  const gmCount = contacts.filter((c) => c.contact_type === "GM").length;
  const salesCount = contacts.filter((c) => c.contact_type === "SALES").length;
  const financeCount = contacts.filter((c) => c.contact_type === "FINANCE").length;
  const romCount = contacts.filter((c) => c.contact_type === "ROM").length;

  function handleFilter(newSearch: string, newRole: string, newHotel: string) {
    const params = new URLSearchParams();
    if (newSearch.trim()) params.set("search", newSearch.trim());
    if (newRole && newRole !== "ALL") params.set("contact_type", newRole);
    if (newHotel && newHotel !== "ALL") params.set("hotel_code", newHotel);
    const q = params.toString() ? `?${params.toString()}` : "";
    router.push(`${pathname}${q}`);
  }

  function openCreateModal() {
    setFormData({
      hotel_id: hotels[0]?.id || "",
      contact_type: (selectedRole !== "ALL" ? selectedRole : "GM") as ContactType,
      name: "",
      email: "",
      phone: "",
      is_primary: true,
    });
    setActionError(null);
    setIsCreateOpen(true);
  }

  function openEditModal(c: HotelContact) {
    const h = hotels.find((h) => h.code === c.hotel_code || h.id === c.hotel_id);
    setFormData({
      hotel_id: h?.id || c.hotel_id || "",
      contact_type: (c.contact_type || "GM") as ContactType,
      name: c.name,
      email: c.email || "",
      phone: c.phone || "",
      is_primary: c.is_primary ?? true,
    });
    setEditTarget(c);
    setActionError(null);
  }

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.hotel_id || !formData.name.trim()) {
      setActionError("Pilih hotel dan isi nama PIC.");
      return;
    }

    startTransition(async () => {
      const payload: HotelContactGlobalCreateRequest = {
        hotel_id: formData.hotel_id,
        contact_type: formData.contact_type,
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        is_primary: formData.is_primary,
      };
      const res = await createGlobalHotelContactAction(payload);
      if (!res.ok) {
        setActionError(res.message || "Gagal menambahkan kontak PIC.");
      } else {
        setActionSuccess(`Kontak PIC ${formData.name} berhasil ditambahkan.`);
        setIsCreateOpen(false);
        router.refresh();
      }
    });
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget || !editTarget.id) return;
    if (!formData.name.trim()) {
      setActionError("Nama PIC wajib diisi.");
      return;
    }

    startTransition(async () => {
      const payload: HotelContactUpdateRequest = {
        hotel_id: formData.hotel_id || undefined,
        contact_type: formData.contact_type,
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        is_primary: formData.is_primary,
      };
      const res = await updateGlobalHotelContactAction(editTarget.id, payload);
      if (!res.ok) {
        setActionError(res.message || "Gagal memperbarui kontak PIC.");
      } else {
        setActionSuccess(`Kontak PIC ${formData.name} berhasil diperbarui.`);
        setEditTarget(null);
        router.refresh();
      }
    });
  }

  function handleDeleteConfirm() {
    if (!deleteTarget || !deleteTarget.id) return;
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await deleteGlobalHotelContactAction(deleteTarget.id);
      if (!res.ok) {
        setActionError(res.message || "Gagal menghapus kontak PIC.");
      } else {
        setActionSuccess(`Kontak PIC ${deleteTarget.name} berhasil dihapus.`);
        setDeleteTarget(null);
        router.refresh();
      }
    });
  }

  function getRoleBadge(type: string) {
    switch (type) {
      case "GM":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <UserCheck className="h-3 w-3" /> GM (General Manager)
          </span>
        );
      case "SALES":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Briefcase className="h-3 w-3" /> Sales & Marketing
          </span>
        );
      case "FINANCE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <DollarSign className="h-3 w-3" /> Finance & Accounting
          </span>
        );
      case "ROM":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
            <Shield className="h-3 w-3" /> ROM (Regional Ops)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
            {type}
          </span>
        );
    }
  }

  function sanitizeWa(phone?: string | null): string {
    if (!phone) return "";
    let clean = phone.replace(/[^0-9+]/g, "");
    if (clean.startsWith("0")) clean = "62" + clean.slice(1);
    if (clean.startsWith("+")) clean = clean.slice(1);
    return clean;
  }

  const columns: Column<HotelContact>[] = [
    {
      key: "name",
      label_id: "Nama PIC",
      label_en: "PIC Name",
      render: (_, row) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
            {row.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              {row.name}
              {row.is_primary && (
                <span className="rounded bg-primary/15 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                  Utama
                </span>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground">{getRoleBadge(row.contact_type)}</div>
          </div>
        </div>
      ),
    },
    {
      key: "hotel",
      label_id: "Properti Hotel",
      label_en: "Hotel Property",
      render: (_, row) => (
        <div>
          {row.hotel_code ? (
            <Link
              href={`/dashboard/hotels/${row.hotel_code}`}
              className="group inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors text-xs"
            >
              <Building2 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
              <span>{row.hotel_name || row.hotel_code}</span>
              <span className="rounded bg-secondary px-1 text-[10px] font-mono text-muted-foreground">
                {row.hotel_code}
              </span>
            </Link>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      ),
    },
    {
      key: "phone",
      label_id: "Telepon / WhatsApp",
      label_en: "Phone / WhatsApp",
      render: (_, row) => {
        const cleanWa = sanitizeWa(row.phone);
        return (
          <div className="flex items-center gap-1.5 text-xs">
            {row.phone ? (
              <>
                <span className="font-mono text-foreground">{row.phone}</span>
                <div className="flex items-center gap-1 ml-1">
                  {cleanWa && (
                    <a
                      href={`https://wa.me/${cleanWa}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded p-1 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400 transition-colors"
                      title="Chat WhatsApp"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <a
                    href={`tel:${row.phone}`}
                    className="rounded p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Telepon Langsung"
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </a>
                </div>
              </>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        );
      },
    },
    {
      key: "email",
      label_id: "Email Resmi",
      label_en: "Official Email",
      render: (_, row) =>
        row.email ? (
          <a
            href={`mailto:${row.email}`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate max-w-[200px]">{row.email}</span>
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: "actions",
      label_id: "Aksi",
      label_en: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openEditModal(row)}
            className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title="Edit Kontak"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            title="Hapus Kontak"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Sub-Menu Tabs (Ecosystem Navigation) ─── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/hotels"
            className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <Building2 className="h-4 w-4" />
            Katalog Hotel
          </Link>
          <Link
            href="/dashboard/hotels/contacts"
            className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3.5 py-2 text-sm font-semibold text-primary"
          >
            <Contact className="h-4 w-4" />
            Kontak PIC ({totalCount})
          </Link>
          <Link
            href="/dashboard/hotels/cities"
            className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <MapPin className="h-4 w-4" />
            Master Kota
          </Link>
          <Link
            href="/dashboard/hotels/regions"
            className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <Globe className="h-4 w-4" />
            Wilayah
          </Link>
          <Link
            href="/dashboard/hotels/brands"
            className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <HotelIcon className="h-4 w-4" />
            Brand
          </Link>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
        >
          <Plus className="h-4 w-4" />
          Tambah Kontak PIC
        </button>
      </div>

      {/* ─── Metric Summary Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => {
            setSelectedRole("ALL");
            handleFilter(searchTerm, "ALL", selectedHotel);
          }}
          className={`rounded-xl border p-3.5 text-left transition-all ${
            selectedRole === "ALL"
              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
              : "border-border bg-card hover:border-primary/40"
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Semua PIC</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="text-xl font-bold text-foreground">{totalCount}</div>
        </button>

        <button
          onClick={() => {
            setSelectedRole("GM");
            handleFilter(searchTerm, "GM", selectedHotel);
          }}
          className={`rounded-xl border p-3.5 text-left transition-all ${
            selectedRole === "GM"
              ? "border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/20"
              : "border-border bg-card hover:border-emerald-500/40"
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">General Manager</span>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-foreground">{gmCount}</div>
        </button>

        <button
          onClick={() => {
            setSelectedRole("SALES");
            handleFilter(searchTerm, "SALES", selectedHotel);
          }}
          className={`rounded-xl border p-3.5 text-left transition-all ${
            selectedRole === "SALES"
              ? "border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/20"
              : "border-border bg-card hover:border-blue-500/40"
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Sales / DOS</span>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-foreground">{salesCount}</div>
        </button>

        <button
          onClick={() => {
            setSelectedRole("FINANCE");
            handleFilter(searchTerm, "FINANCE", selectedHotel);
          }}
          className={`rounded-xl border p-3.5 text-left transition-all ${
            selectedRole === "FINANCE"
              ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20"
              : "border-border bg-card hover:border-amber-500/40"
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Finance Controller</span>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-foreground">{financeCount}</div>
        </button>

        <button
          onClick={() => {
            setSelectedRole("ROM");
            handleFilter(searchTerm, "ROM", selectedHotel);
          }}
          className={`rounded-xl border p-3.5 text-left transition-all ${
            selectedRole === "ROM"
              ? "border-purple-500 bg-purple-500/5 ring-2 ring-purple-500/20"
              : "border-border bg-card hover:border-purple-500/40"
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Regional ROM</span>
            <Shield className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-xl font-bold text-foreground">{romCount}</div>
        </button>
      </div>

      {/* ─── Feedback Alerts ─── */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/15 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>Gagal memuat data kontak: {error.message}</span>
        </div>
      )}
      {actionSuccess && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/15 p-4 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/15 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* ─── Filters & Search Bar ─── */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama PIC, properti hotel, email, atau no. telepon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleFilter(searchTerm, selectedRole, selectedHotel);
            }}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        <select
          value={selectedHotel}
          onChange={(e) => {
            setSelectedHotel(e.target.value);
            handleFilter(searchTerm, selectedRole, e.target.value);
          }}
          className="w-full sm:w-64 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        >
          <option value="ALL">Semua Properti Hotel</option>
          {hotels.map((h) => (
            <option key={h.id} value={h.code}>
              {h.code} — {h.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => handleFilter(searchTerm, selectedRole, selectedHotel)}
          className="w-full sm:w-auto rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          Terapkan Filter
        </button>
      </div>

      {/* ─── DataTable Component ─── */}
      <DataTable
        columns={columns}
        data={contacts}
        isLoading={isPending}
      />

      {/* ─── Modal Create Contact ─── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-semibold text-foreground text-base flex items-center gap-2">
                <Contact className="h-5 w-5 text-primary" /> Tambah Kontak PIC Hotel
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Properti Hotel *</label>
                <select
                  value={formData.hotel_id}
                  onChange={(e) => setFormData({ ...formData, hotel_id: e.target.value })}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">— Pilih Hotel —</option>
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.code} — {h.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Peran Operasional *</label>
                <select
                  value={formData.contact_type}
                  onChange={(e) => setFormData({ ...formData, contact_type: e.target.value as ContactType })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="GM">General Manager (GM)</option>
                  <option value="SALES">Sales & Marketing (DOS / Sales Manager)</option>
                  <option value="FINANCE">Finance & Accounting (FC / Chief Accountant)</option>
                  <option value="ROM">Regional Operations Manager (ROM)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Nama Lengkap PIC *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Anis Arifin / Ketut Subagia"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">No. HP / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+62 812-xxxx-xxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Email Resmi</label>
                  <input
                    type="email"
                    placeholder="nama@swiss-belhotel.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_primary_create"
                  checked={formData.is_primary}
                  onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="is_primary_create" className="text-xs text-foreground cursor-pointer">
                  Set sebagai kontak utama untuk peran ini di hotel tersebut
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isPending ? "Menyimpan..." : "Simpan Kontak"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Edit Contact ─── */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-semibold text-foreground text-base flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-primary" /> Edit Kontak PIC Hotel
              </h3>
              <button
                onClick={() => setEditTarget(null)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Properti Hotel</label>
                <select
                  value={formData.hotel_id}
                  onChange={(e) => setFormData({ ...formData, hotel_id: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.code} — {h.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Peran Operasional</label>
                <select
                  value={formData.contact_type}
                  onChange={(e) => setFormData({ ...formData, contact_type: e.target.value as ContactType })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="GM">General Manager (GM)</option>
                  <option value="SALES">Sales & Marketing (DOS / Sales Manager)</option>
                  <option value="FINANCE">Finance & Accounting (FC / Chief Accountant)</option>
                  <option value="ROM">Regional Operations Manager (ROM)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Nama Lengkap PIC *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">No. HP / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Email Resmi</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_primary_edit"
                  checked={formData.is_primary}
                  onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="is_primary_edit" className="text-xs text-foreground cursor-pointer">
                  Set sebagai kontak utama untuk peran ini di hotel tersebut
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Delete Confirmation ─── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <div className="rounded-full bg-destructive/10 p-2.5">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-base">Hapus Kontak PIC</h3>
                <p className="text-xs text-muted-foreground">Tindakan ini akan menonaktifkan kontak dari sistem.</p>
              </div>
            </div>

            <div className="rounded-lg bg-secondary/50 p-3.5 text-xs text-foreground space-y-1">
              <div>
                <span className="text-muted-foreground">Nama PIC:</span> <strong>{deleteTarget.name}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Peran:</span> <strong>{deleteTarget.contact_type}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Hotel:</span> <strong>{deleteTarget.hotel_name || deleteTarget.hotel_code || "—"}</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className="rounded-lg bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {isPending ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
