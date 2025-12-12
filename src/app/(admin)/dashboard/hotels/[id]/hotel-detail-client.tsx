"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Hotel,
  ArrowLeft,
  Edit2,
  BarChart3,
  MapPin,
  UtensilsCrossed,
  Coffee,
  Phone,
  Mail,
  MessageCircle,
  Building2,
  Calendar,
  Globe,
  Tag,
  Shield,
  Users,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { StatusPill, type ToneKey } from "@/components/admin/data-table";
import type { Hotel as HotelType } from "@/app/actions/hotels";
import {
  createHotelContactAction,
  updateHotelContactAction,
  type HotelContact,
} from "@/app/actions/hotel-contacts";

const MapView = dynamic(
  () => import("@incodiy/cavaloc").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 w-full animate-pulse rounded-2xl bg-muted/40" />
    ),
  }
);

const STATUS_TONE: Record<string, ToneKey> = {
  ACTIVE: "on",
  TEMPORARILY_CLOSED: "wait",
  TERMINATED: "off",
};

interface HotelDetailClientProps {
  hotel: HotelType;
}

export function HotelDetailClient({ hotel }: HotelDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactType, setContactType] = useState<"GM" | "SALES" | "FINANCE" | "ROM">("GM");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [editingContactId, setEditingContactId] = useState<string | null>(null);

  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  const mice = (hotel.mice_facilities as Record<string, unknown> | null) ?? {};
  const lat = hotel.geo?.lat ?? -6.2088;
  const lng = hotel.geo?.lng ?? 106.8456;
  const geofenceRadius = hotel.geofence_radius_meters ?? 200;

  const contacts = hotel.contacts ?? [];
  const gmContact = contacts.find((c) => c.contact_type === "GM");
  const salesContact = contacts.find((c) => c.contact_type === "SALES");
  const financeContact = contacts.find((c) => c.contact_type === "FINANCE");
  const romContact = contacts.find((c) => c.contact_type === "ROM");

  function openEditContactModal(type: "GM" | "SALES" | "FINANCE" | "ROM", existing?: HotelContact) {
    setContactType(type);
    setEditingContactId(existing?.id ?? null);
    setContactName(existing?.name ?? "");
    setContactEmail(existing?.email ?? "");
    setContactPhone(existing?.phone ?? "");
    setModalError(null);
    setModalSuccess(null);
    setContactModalOpen(true);
  }

  function handleSaveContact(e: React.FormEvent) {
    e.preventDefault();
    if (!contactName.trim()) {
      setModalError("Nama kontak wajib diisi.");
      return;
    }

    setModalError(null);
    startTransition(async () => {
      const payload = {
        contact_type: contactType,
        name: contactName.trim(),
        email: contactEmail.trim() || null,
        phone: contactPhone.trim() || null,
        is_primary: contactType === "GM",
      };

      const hotelCode = hotel.code || String(hotel.id || "");
      let res;
      if (editingContactId) {
        res = await updateHotelContactAction(hotelCode, editingContactId, payload);
      } else {
        res = await createHotelContactAction(hotelCode, payload);
      }

      if (!res.ok) {
        setModalError(res.message || "Gagal menyimpan data kontak PIC.");
      } else {
        setModalSuccess("Kontak PIC berhasil disimpan!");
        setTimeout(() => {
          setContactModalOpen(false);
          router.refresh();
        }, 800);
      }
    });
  }

  function cleanPhoneForWa(phoneStr?: string | null): string {
    if (!phoneStr) return "";
    let clean = phoneStr.replace(/[^0-9]/g, "");
    if (clean.startsWith("0")) {
      clean = "62" + clean.substring(1);
    }
    return clean;
  }

  const hotelCode = hotel.code || String(hotel.id || "");

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/hotels"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Katalog Hotel
              </span>
              <span className="text-muted-foreground/40">•</span>
              <span className="font-mono text-xs font-bold text-primary">{hotelCode}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {hotel.name}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/hotel/${hotelCode}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"
          >
            <BarChart3 className="h-4 w-4" />
            Audit Drilldown
          </Link>
          <Link
            href={`/dashboard/hotels/${hotelCode}/edit`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow transition hover:opacity-90"
          >
            <Edit2 className="h-4 w-4" />
            Edit Master Hotel
          </Link>
        </div>
      </div>

      {/* Hero Banner: Foto Fasad 16:9 & Identitas Utama */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
        <div className="relative aspect-[21/9] w-full min-h-[220px] max-h-[380px] bg-muted">
          {hotel.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hotel.image_url}
              alt={hotel.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-muted via-card to-background text-muted-foreground">
              <div className="text-center space-y-2">
                <Hotel className="mx-auto h-12 w-12 opacity-30" />
                <span className="text-sm font-medium">Foto Fasad Belum Diunggah</span>
              </div>
            </div>
          )}

          {/* Gradient Overlay for Legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

          {/* Text & Badges on Banner Bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 flex flex-wrap items-end justify-between gap-4 text-white">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-primary px-2.5 py-0.5 font-mono text-xs font-bold text-white shadow-sm">
                  {hotel.code}
                </span>
                {hotel.brand_tier && (
                  <span className="rounded-lg bg-white/20 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
                    {hotel.brand_tier}
                  </span>
                )}
                <span className="rounded-lg bg-white/10 px-2.5 py-0.5 text-xs font-medium backdrop-blur-md">
                  {hotel.brand ?? "Swiss-Belhotel"}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-md">
                {hotel.name}
              </h2>
              <p className="text-xs sm:text-sm text-white/80 flex items-center gap-1.5 drop-shadow-sm">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                {hotel.city ?? "—"}
                {hotel.ecommerce_city ? ` (Cluster E-Commerce: ${hotel.ecommerce_city})` : ""}
                {hotel.region ? ` • Wilayah ${hotel.region}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {hotel.has_fb ? (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/90 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-md">
                  <UtensilsCrossed className="h-4 w-4" />
                  F&B Available
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-600/90 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-md">
                  <Coffee className="h-4 w-4" />
                  Room Only
                </span>
              )}
              <StatusPill tone={STATUS_TONE[hotel.status ?? ""] ?? "off"}>
                {hotel.status === "ACTIVE"
                  ? "Aktif"
                  : hotel.status === "TEMPORARILY_CLOSED"
                  ? "Tutup Sementara"
                  : hotel.status === "TERMINATED"
                  ? "Terminasi"
                  : hotel.status}
              </StatusPill>
            </div>
          </div>
        </div>
      </div>

      {/* PIC Operasional Section: 4 Key Cards with Direct Actions */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Kontak Personil Operasional (PIC Properti)
            </h3>
            <p className="text-xs text-muted-foreground">
              Informasi kontak darurat dan manajerial dari Sheet Master Data Excel untuk komunikasi cepat.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* GM Card */}
          <div className="relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                  General Manager (GM)
                </span>
                <button
                  type="button"
                  onClick={() => openEditContactModal("GM", gmContact)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Update GM"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <h4 className="font-semibold text-foreground text-sm line-clamp-1">
                {gmContact?.name || hotel.gm_name || "—"}
              </h4>
              <p className="text-xs text-muted-foreground mt-1">Pimpinan Operasional Properti</p>
            </div>

            <div className="mt-4 pt-3 border-t border-border/50 space-y-2">
              {gmContact?.phone ? (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate max-w-[130px] font-mono text-[11px]">
                    {gmContact.phone}
                  </span>
                  <div className="flex items-center gap-1">
                    <a
                      href={`tel:${gmContact.phone}`}
                      className="rounded-lg bg-muted p-1.5 text-foreground hover:bg-primary/20 hover:text-primary transition-colors"
                      title="Panggil Telepon"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                    <a
                      href={`https://wa.me/${cleanPhoneForWa(gmContact.phone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      title="Kirim WhatsApp"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground italic">No. telepon belum ada</div>
              )}

              {gmContact?.email ? (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate max-w-[150px] text-[11px]">
                    {gmContact.email}
                  </span>
                  <a
                    href={`mailto:${gmContact.email}`}
                    className="rounded-lg bg-muted p-1.5 text-foreground hover:bg-primary/20 hover:text-primary transition-colors"
                    title="Kirim Email"
                  >
                    <Mail className="h-3.5 w-3.5" />
                  </a>
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground italic">Email belum ada</div>
              )}
            </div>
          </div>

          {/* Sales Card */}
          <div className="relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="rounded-lg bg-blue-500/10 px-2 py-0.5 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  Sales & Marketing
                </span>
                <button
                  type="button"
                  onClick={() => openEditContactModal("SALES", salesContact)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Update Sales"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <h4 className="font-semibold text-foreground text-sm line-clamp-1">
                {salesContact?.name || "—"}
              </h4>
              <p className="text-xs text-muted-foreground mt-1">Director of Sales / Sales Manager</p>
            </div>

            <div className="mt-4 pt-3 border-t border-border/50 space-y-2">
              {salesContact?.phone ? (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate max-w-[130px] font-mono text-[11px]">
                    {salesContact.phone}
                  </span>
                  <div className="flex items-center gap-1">
                    <a
                      href={`tel:${salesContact.phone}`}
                      className="rounded-lg bg-muted p-1.5 text-foreground hover:bg-primary/20 hover:text-primary transition-colors"
                      title="Panggil Telepon"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                    <a
                      href={`https://wa.me/${cleanPhoneForWa(salesContact.phone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      title="Kirim WhatsApp"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground italic">No. telepon belum ada</div>
              )}

              {salesContact?.email ? (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate max-w-[150px] text-[11px]">
                    {salesContact.email}
                  </span>
                  <a
                    href={`mailto:${salesContact.email}`}
                    className="rounded-lg bg-muted p-1.5 text-foreground hover:bg-primary/20 hover:text-primary transition-colors"
                    title="Kirim Email"
                  >
                    <Mail className="h-3.5 w-3.5" />
                  </a>
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground italic">Email belum ada</div>
              )}
            </div>
          </div>

          {/* Finance Card */}
          <div className="relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="rounded-lg bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  Finance & Controller
                </span>
                <button
                  type="button"
                  onClick={() => openEditContactModal("FINANCE", financeContact)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Update Finance"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <h4 className="font-semibold text-foreground text-sm line-clamp-1">
                {financeContact?.name || "—"}
              </h4>
              <p className="text-xs text-muted-foreground mt-1">Financial Controller / Accounting</p>
            </div>

            <div className="mt-4 pt-3 border-t border-border/50 space-y-2">
              {financeContact?.phone ? (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate max-w-[130px] font-mono text-[11px]">
                    {financeContact.phone}
                  </span>
                  <div className="flex items-center gap-1">
                    <a
                      href={`tel:${financeContact.phone}`}
                      className="rounded-lg bg-muted p-1.5 text-foreground hover:bg-primary/20 hover:text-primary transition-colors"
                      title="Panggil Telepon"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                    <a
                      href={`https://wa.me/${cleanPhoneForWa(financeContact.phone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      title="Kirim WhatsApp"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground italic">No. telepon belum ada</div>
              )}

              {financeContact?.email ? (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate max-w-[150px] text-[11px]">
                    {financeContact.email}
                  </span>
                  <a
                    href={`mailto:${financeContact.email}`}
                    className="rounded-lg bg-muted p-1.5 text-foreground hover:bg-primary/20 hover:text-primary transition-colors"
                    title="Kirim Email"
                  >
                    <Mail className="h-3.5 w-3.5" />
                  </a>
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground italic">Email belum ada</div>
              )}
            </div>
          </div>

          {/* ROM Card */}
          <div className="relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="rounded-lg bg-purple-500/10 px-2 py-0.5 text-[11px] font-bold text-purple-600 dark:text-purple-400">
                  Regional Ops Manager (ROM)
                </span>
                <button
                  type="button"
                  onClick={() => openEditContactModal("ROM", romContact)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Update ROM"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <h4 className="font-semibold text-foreground text-sm line-clamp-1">
                {romContact?.name || hotel.rom_name || "—"}
              </h4>
              <p className="text-xs text-muted-foreground mt-1">Supervisi Wilayah Regional</p>
            </div>

            <div className="mt-4 pt-3 border-t border-border/50 space-y-2">
              <div className="text-xs">
                <span className="text-muted-foreground block text-[10px]">Sales Division:</span>
                <span className="font-medium text-foreground text-[11px]">
                  {hotel.sales_region ?? "—"}
                </span>
              </div>

              {romContact?.email ? (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate max-w-[150px] text-[11px]">
                    {romContact.email}
                  </span>
                  <a
                    href={`mailto:${romContact.email}`}
                    className="rounded-lg bg-muted p-1.5 text-foreground hover:bg-primary/20 hover:text-primary transition-colors"
                    title="Kirim Email"
                  >
                    <Mail className="h-3.5 w-3.5" />
                  </a>
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground italic">Email belum ada</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Profil Lengkap & Fasilitas (2 Kolom) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Kolom Kiri: Detail Administrasi & Fasilitas (7 Kolom) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Wilayah & Lokasi 3NF */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Globe className="h-4 w-4 text-primary" />
              Hierarki Wilayah & Lokasi (3NF Normalized)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Kota / Kabupaten (DB):</span>
                <p className="font-medium text-foreground mt-0.5">{hotel.city ?? "—"}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">E-Commerce City:</span>
                <div className="mt-0.5">
                  {hotel.ecommerce_city ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      <Tag className="h-3 w-3" />
                      {hotel.ecommerce_city}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Wilayah Operasional (Region):</span>
                <p className="font-medium text-foreground mt-0.5">{hotel.region ?? "—"}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Divisi Penjualan (Sales Region):</span>
                <p className="font-medium text-foreground mt-0.5">{hotel.sales_region ?? "—"}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Wilayah E-Commerce:</span>
                <p className="font-medium text-foreground mt-0.5">{hotel.ecommerce_region ?? "—"}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Provinsi Terdaftar:</span>
                <p className="font-medium text-foreground mt-0.5">{hotel.province_id ? "Terhubung" : "—"}</p>
              </div>
            </div>
          </div>

          {/* Card: Fasilitas MICE & Operasional */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Building2 className="h-4 w-4 text-primary" />
              Fasilitas MICE & Layanan Operasional
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
                <span className="text-xs text-muted-foreground">Layanan F&B:</span>
                <div className="mt-1 font-semibold text-foreground flex items-center gap-1.5">
                  {hotel.has_fb ? (
                    <>
                      <UtensilsCrossed className="h-4 w-4 text-emerald-500" />
                      Tersedia
                    </>
                  ) : (
                    <>
                      <Coffee className="h-4 w-4 text-zinc-500" />
                      Room Only
                    </>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
                <span className="text-xs text-muted-foreground">Kapasitas Ballroom:</span>
                <p className="mt-1 font-semibold text-foreground">
                  {mice.ballroom_capacity ? `${Number(mice.ballroom_capacity)} Pax` : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
                <span className="text-xs text-muted-foreground">Ruang Pertemuan:</span>
                <p className="mt-1 font-semibold text-foreground">
                  {mice.meeting_rooms ? `${Number(mice.meeting_rooms)} Ruangan` : "—"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-foreground">Layar Videotron:</span>
                <span className={mice.has_videotron ? "text-emerald-500 font-semibold" : "text-muted-foreground"}>
                  {mice.has_videotron ? "Tersedia" : "Tidak Ada"}
                </span>
              </div>
              <div>•</div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-foreground">Radius Geofence:</span>
                <span className="font-mono font-semibold text-foreground">{geofenceRadius}m</span>
              </div>
            </div>
          </div>

          {/* Card: Linimasa & Siklus Kontrak */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Calendar className="h-4 w-4 text-primary" />
              Linimasa & Siklus Kontrak
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Opening Date:</span>
                <p className="font-medium text-foreground mt-0.5">{hotel.opening_date || "—"}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Terminate Date:</span>
                <p className="font-medium text-foreground mt-0.5">{hotel.terminate_date || "—"}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Period Update:</span>
                <p className="font-mono text-xs text-muted-foreground mt-0.5">{hotel.period_update || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Peta Cavaloc & Koordinat GPS (5 Kolom) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Peta Lokasi & Geofence Cavaloc
              </h3>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-primary">
                Geofence: {geofenceRadius}m
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-border">
              <MapView
                lat={lat}
                lng={lng}
                title={hotel.name}
                address={`Koordinat: ${lat.toFixed(5)}, ${lng.toFixed(5)} — Radius Geofence: ${geofenceRadius}m`}
                zoom={14}
                height={280}
                interactive={true}
                pinColor="#0ea5e9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <span className="text-muted-foreground">Latitude GPS:</span>
                <p className="font-mono font-bold text-foreground mt-0.5">{lat}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <span className="text-muted-foreground">Longitude GPS:</span>
                <p className="font-mono font-bold text-foreground mt-0.5">{lng}</p>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/10 p-3 text-xs text-muted-foreground leading-relaxed">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p>
                  Sesuai <strong>PRD-F-04</strong>, inspeksi mobile live-camera wajib berada di dalam radius
                  geofence ini ({geofenceRadius} meter) agar skor audit tervalidasi secara hukum operasional.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Dialog: Edit / Tambah Kontak PIC */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="text-base font-semibold text-foreground">
                {editingContactId ? "Edit Kontak PIC" : "Tambah Kontak PIC Baru"} — {contactType}
              </h3>
              <button
                type="button"
                onClick={() => setContactModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {modalSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{modalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveContact} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Jabatan / Posisi PIC
                </label>
                <select
                  value={contactType}
                  onChange={(e) => setContactType(e.target.value as "GM" | "SALES" | "FINANCE" | "ROM")}
                  className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="GM">General Manager (GM)</option>
                  <option value="SALES">Sales & Marketing (DOS / Manager)</option>
                  <option value="FINANCE">Finance & Accounting Controller</option>
                  <option value="ROM">Regional Operations Manager (ROM)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Nama Lengkap PIC *
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Contoh: John Doe"
                  className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Nomor HP / WhatsApp
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+62 812-xxxx-xxxx"
                  className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Email Resmi
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="name@swiss-belhotel.com"
                  className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setContactModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 shadow-md"
                >
                  {isPending ? "Menyimpan..." : "Simpan Kontak PIC"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
