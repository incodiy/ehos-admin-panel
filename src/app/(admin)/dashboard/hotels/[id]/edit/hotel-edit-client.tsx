"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { CavaForm, type FieldSchema } from "@incodiy/cavaform";
import {
  Building2,
  ArrowLeft,
  MapPin,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Trash2,
} from "lucide-react";
import {
  updateHotelAction,
  deleteHotelAction,
  type Hotel,
  type Brand,
  type Region,
  type Province,
  type City,
} from "@/app/actions/hotels";
import type { HotelContactCreateRequest } from "@/app/actions/hotel-contacts";
import { StatusPill, type ToneKey } from "@/components/admin/data-table";

const MapView = dynamic(
  () => import("@incodiy/cavaloc").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full animate-pulse rounded-xl bg-muted/40" />
    ),
  }
);

import type { HotelContact } from "@/app/actions/hotel-contacts";

interface HotelEditClientProps {
  hotel: Hotel;
  brands: Brand[];
  regions: Region[];
  provinces: Province[];
  cities: City[];
  gms: Array<{ id: string; name: string }>;
  roms: Array<{ id: string; name: string }>;
  contacts?: HotelContact[];
}

const STATUS_TONE: Record<string, ToneKey> = {
  ACTIVE: "on",
  TEMPORARILY_CLOSED: "wait",
  TERMINATED: "off",
};

export function HotelEditClient({
  hotel,
  brands,
  regions,
  provinces,
  cities,
  gms,
  roms,
  contacts = [],
}: HotelEditClientProps) {
  const router = useRouter();

  const [lat, setLat] = useState<number>(hotel.geo?.lat ?? -6.2088);
  const [lng, setLng] = useState<number>(hotel.geo?.lng ?? 106.8456);
  const [geofenceRadius, setGeofenceRadius] = useState<number>(
    hotel.geofence_radius_meters ?? 200
  );
  const [hotelName, setHotelName] = useState<string>(hotel.name ?? "");
  const [currentStatus, setCurrentStatus] = useState<string>(hotel.status ?? "ACTIVE");

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const mice = (hotel.mice_facilities as Record<string, unknown> | null) ?? {};

  // Ekstraksi kontak PIC dari relasi hotel.contacts
  const gmContact = hotel.contacts?.find((c) => c.contact_type === "GM");
  const salesContact = hotel.contacts?.find((c) => c.contact_type === "SALES");
  const financeContact = hotel.contacts?.find((c) => c.contact_type === "FINANCE");
  const romContact = hotel.contacts?.find((c) => c.contact_type === "ROM");

  const brandOptions = brands
    .filter((b) => Boolean(b.id))
    .map((b) => ({
      value: b.id as string,
      label: `${b.name} (${b.tier})`,
    }));

  const regionOptions = regions
    .filter((r) => Boolean(r.id))
    .map((r) => ({
      value: r.id as string,
      label: `${r.name} — ${r.sales_region ?? r.country ?? ""}`,
    }));

  const provinceOptions = provinces
    .filter((p) => Boolean(p.id))
    .map((p) => ({
      value: p.id as string,
      label: `${p.code} — ${p.name}`,
    }));

  const cityOptions = [
    { value: "", label: "— Pilih dari Master Kota (3NF) —" },
    ...cities
      .filter((c) => Boolean(c.id))
      .map((c) => ({
        value: c.id as string,
        label: `${c.name}${c.ecommerce_city ? ` (E-Com: ${c.ecommerce_city})` : ""}`,
      })),
  ];

  const gmOptions = [
    { value: "", label: "— Tanpa GM (Belum Ditentukan) —" },
    ...gms.filter((g) => Boolean(g.id)).map((g) => ({ value: g.id as string, label: g.name })),
  ];

  const romOptions = [
    { value: "", label: "— Tanpa ROM (Belum Ditentukan) —" },
    ...roms.filter((r) => Boolean(r.id)).map((r) => ({ value: r.id as string, label: r.name })),
  ];

  const allContacts: HotelContact[] = contacts || [];

  const gmContactOptions = [
    { value: "", label: "— Pilih Kontak GM dari Master (Auto-fill) / Input Baru —" },
    { value: "MANUAL", label: "+ Input PIC GM Baru (Manual)" },
    ...allContacts
      .filter((c: HotelContact) => c.contact_type === "GM")
      .map((c: HotelContact) => ({
        value: `${c.name}|${c.phone || ""}|${c.email || ""}`,
        label: `${c.name} ${c.hotel_code ? `(${c.hotel_code})` : ""} — ${c.phone || c.email || ""}`,
      })),
  ];

  const salesContactOptions = [
    { value: "", label: "— Pilih Kontak Sales dari Master (Auto-fill) / Input Baru —" },
    { value: "MANUAL", label: "+ Input PIC Sales Baru (Manual)" },
    ...allContacts
      .filter((c: HotelContact) => c.contact_type === "SALES")
      .map((c: HotelContact) => ({
        value: `${c.name}|${c.phone || ""}|${c.email || ""}`,
        label: `${c.name} ${c.hotel_code ? `(${c.hotel_code})` : ""} — ${c.phone || c.email || ""}`,
      })),
  ];

  const financeContactOptions = [
    { value: "", label: "— Pilih Kontak Finance dari Master (Auto-fill) / Input Baru —" },
    { value: "MANUAL", label: "+ Input PIC Finance Baru (Manual)" },
    ...allContacts
      .filter((c: HotelContact) => c.contact_type === "FINANCE")
      .map((c: HotelContact) => ({
        value: `${c.name}|${c.phone || ""}|${c.email || ""}`,
        label: `${c.name} ${c.hotel_code ? `(${c.hotel_code})` : ""} — ${c.phone || c.email || ""}`,
      })),
  ];

  const romContactOptions = [
    { value: "", label: "— Pilih PIC ROM dari Master (Auto-fill) / Input Baru —" },
    { value: "MANUAL", label: "+ Input PIC ROM Baru (Manual)" },
    ...Array.from(new Set(allContacts.filter((c: HotelContact) => c.contact_type === "ROM").map((c: HotelContact) => c.name)))
      .map((name: string) => {
        const c = allContacts.find((item: HotelContact) => item.contact_type === "ROM" && item.name === name);
        return {
          value: `${c?.name}|${c?.phone || ""}|${c?.email || ""}`,
          label: `${c?.name} — ${c?.email || ""}`,
        };
      }),
  ];

  const initialGmVal = gmContact ? `${gmContact.name}|${gmContact.phone || ""}|${gmContact.email || ""}` : "";
  const initialSalesVal = salesContact ? `${salesContact.name}|${salesContact.phone || ""}|${salesContact.email || ""}` : "";
  const initialFinVal = financeContact ? `${financeContact.name}|${financeContact.phone || ""}|${financeContact.email || ""}` : "";
  const initialRomVal = romContact ? `${romContact.name}||${romContact.email || ""}` : "";

  const formFields: FieldSchema[] = [
    {
      name: "code",
      label: "Kode Hotel (Unik)",
      type: "text",
      validation: { required: true },
      defaultValue: hotel.code,
      helperText: "Mengubah kode hotel akan memperbarui identitas publik dan routing",
    },
    {
      name: "name",
      label: "Nama Properti Hotel",
      type: "text",
      validation: { required: true },
      defaultValue: hotel.name,
    },
    {
      name: "image_url",
      label: "URL Foto Fasad Hotel",
      type: "text",
      placeholder: "https://... URL Foto Fasad",
      defaultValue: hotel.image_url ?? "",
      helperText: "Tautan gambar fasad tampak depan beresolusi tinggi (rasio 16:9)",
    },
    {
      name: "brand_id",
      label: "Brand & Kategori Klasifikasi",
      type: "select",
      validation: { required: true },
      options: brandOptions,
      defaultValue: hotel.brand_id,
    },
    {
      name: "city_id",
      label: "Master Kota / Kabupaten (3NF)",
      type: "select",
      options: cityOptions,
      defaultValue: hotel.city_id ?? "",
      helperText: "Pilih dari Master Kota resmi untuk pemetaan otomatis",
    },
    {
      name: "city",
      label: "Nama Kota / Area (Label Tampilan)",
      type: "text",
      validation: { required: true },
      defaultValue: hotel.city ?? "",
    },
    {
      name: "province_id",
      label: "Provinsi",
      type: "select",
      validation: { required: true },
      options: provinceOptions,
      defaultValue: hotel.province_id ?? "",
    },
    {
      name: "region_id",
      label: "Wilayah Operasional (Region)",
      type: "select",
      validation: { required: true },
      options: regionOptions,
      defaultValue: hotel.region_id,
    },
    {
      name: "has_fb",
      label: "Fasilitas F&B (Restoran / Room Service)",
      type: "select",
      options: [
        { value: "true", label: "F&B Tersedia (Restoran / Room Service Beroperasi)" },
        { value: "false", label: "Room Only (Tanpa Layanan Makanan & Minuman)" },
      ],
      defaultValue: hotel.has_fb === false ? "false" : "true",
    },
    {
      name: "status",
      label: "Status Operasional (FSM)",
      type: "select",
      validation: { required: true },
      options: [
        { value: "ACTIVE", label: "ACTIVE — Beroperasi Penuh" },
        { value: "TEMPORARILY_CLOSED", label: "TEMPORARILY_CLOSED — Tutup Sementara / Renovasi" },
        { value: "TERMINATED", label: "TERMINATED — Berhenti Beroperasi / Kontrak Usai" },
      ],
      defaultValue: hotel.status ?? "ACTIVE",
    },
    {
      name: "opening_date",
      label: "Tanggal Pembukaan (Opening Date)",
      type: "date",
      defaultValue: hotel.opening_date ? String(hotel.opening_date) : "",
    },
    {
      name: "terminate_date",
      label: "Tanggal Terminasi (Opsional)",
      type: "date",
      defaultValue: hotel.terminate_date ? String(hotel.terminate_date) : "",
      helperText: "Diisi bila hotel dijadwalkan selesai masa kontrak operasional",
    },
    {
      name: "gm_id",
      label: "Akun GM Sistem (User Login)",
      type: "select",
      options: gmOptions,
      defaultValue: (hotel as Record<string, unknown>).gm_id ? String((hotel as Record<string, unknown>).gm_id) : "",
    },
    {
      name: "rom_id",
      label: "Akun ROM Sistem (User Login)",
      type: "select",
      options: romOptions,
      defaultValue: (hotel as Record<string, unknown>).rom_id ? String((hotel as Record<string, unknown>).rom_id) : "",
    },
    // Kontak Personil Lapangan (Excel PIC Data — Smart Select 3NF)
    {
      name: "gm_contact_select",
      label: "Pilih Kontak PIC GM dari Master",
      type: "select",
      options: gmContactOptions,
      defaultValue: initialGmVal,
      helperText: "Pilih dari daftar kontak GM yang ada untuk mengisi otomatis, atau pilih Input Baru",
    },
    {
      name: "gm_contact_name",
      label: "Nama Kontak GM (PIC)",
      type: "text",
      defaultValue: gmContact?.name ?? "",
      placeholder: "Nama lengkap General Manager",
    },
    {
      name: "gm_contact_phone",
      label: "No. HP / WhatsApp GM",
      type: "text",
      defaultValue: gmContact?.phone ?? "",
      placeholder: "+62 812-xxxx-xxxx",
    },
    {
      name: "gm_contact_email",
      label: "Email Resmi GM",
      type: "text",
      defaultValue: gmContact?.email ?? "",
      placeholder: "gm@swiss-belhotel.com",
    },
    {
      name: "sales_contact_select",
      label: "Pilih Kontak PIC Sales dari Master",
      type: "select",
      options: salesContactOptions,
      defaultValue: initialSalesVal,
      helperText: "Pilih dari daftar kontak Sales untuk mengisi otomatis, atau pilih Input Baru",
    },
    {
      name: "sales_contact_name",
      label: "Nama Kontak Sales (PIC)",
      type: "text",
      defaultValue: salesContact?.name ?? "",
      placeholder: "Nama Sales Manager / DOS",
    },
    {
      name: "sales_contact_phone",
      label: "No. HP / WhatsApp Sales",
      type: "text",
      defaultValue: salesContact?.phone ?? "",
      placeholder: "+62 812-xxxx-xxxx",
    },
    {
      name: "sales_contact_email",
      label: "Email Resmi Sales",
      type: "text",
      defaultValue: salesContact?.email ?? "",
      placeholder: "sales@swiss-belhotel.com",
    },
    {
      name: "finance_contact_select",
      label: "Pilih Kontak PIC Finance dari Master",
      type: "select",
      options: financeContactOptions,
      defaultValue: initialFinVal,
      helperText: "Pilih dari daftar kontak Finance untuk mengisi otomatis, atau pilih Input Baru",
    },
    {
      name: "finance_contact_name",
      label: "Nama Kontak Finance (PIC)",
      type: "text",
      defaultValue: financeContact?.name ?? "",
      placeholder: "Nama Financial Controller / Chief Accountant",
    },
    {
      name: "finance_contact_phone",
      label: "No. HP / WhatsApp Finance",
      type: "text",
      defaultValue: financeContact?.phone ?? "",
      placeholder: "+62 812-xxxx-xxxx",
    },
    {
      name: "finance_contact_email",
      label: "Email Resmi Finance",
      type: "text",
      defaultValue: financeContact?.email ?? "",
      placeholder: "finance@swiss-belhotel.com",
    },
    {
      name: "rom_contact_select",
      label: "Pilih PIC ROM dari Master",
      type: "select",
      options: romContactOptions,
      defaultValue: initialRomVal,
      helperText: "Pilih Regional Operations Manager (ROM) penanggung jawab",
    },
    {
      name: "rom_contact_name",
      label: "Nama PIC ROM",
      type: "text",
      defaultValue: romContact?.name ?? "",
      placeholder: "Nama Regional Operations Manager",
    },
    {
      name: "rom_contact_email",
      label: "Email PIC ROM",
      type: "text",
      defaultValue: romContact?.email ?? "",
      placeholder: "rom@swiss-belhotel.com",
    },
    {
      name: "lat",
      label: "Garis Lintang (Latitude GPS)",
      type: "number",
      validation: { required: true },
      defaultValue: hotel.geo?.lat ?? -6.2088,
    },
    {
      name: "lng",
      label: "Garis Bujur (Longitude GPS)",
      type: "number",
      validation: { required: true },
      defaultValue: hotel.geo?.lng ?? 106.8456,
    },
    {
      name: "geofence_radius_meters",
      label: "Radius Geofence (Meter)",
      type: "number",
      validation: { required: true },
      defaultValue: hotel.geofence_radius_meters ?? 200,
      helperText: "Ambang batas validasi GPS inspektur live-camera (PRD-F-04: 50m - 5000m)",
    },
    {
      name: "ballroom_capacity",
      label: "Kapasitas Ballroom (MICE Pax)",
      type: "number",
      defaultValue: mice.ballroom_capacity !== undefined ? Number(mice.ballroom_capacity) : 0,
      helperText: "Kapasitas maksimum peserta kegiatan rapat/event pemerintah",
    },
    {
      name: "meeting_rooms",
      label: "Jumlah Ruang Pertemuan (Meeting Rooms)",
      type: "number",
      defaultValue: mice.meeting_rooms !== undefined ? Number(mice.meeting_rooms) : 0,
    },
    {
      name: "has_videotron",
      label: "Memiliki Layar Videotron / LED Screen",
      type: "checkbox",
      defaultValue: Boolean(mice.has_videotron),
    },
  ];

  async function handleSubmit(data: Record<string, unknown>) {
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      const code = String(data.code || hotel.code).trim().toUpperCase();
      const name = String(data.name || hotel.name).trim();
      const imageUrl = data.image_url !== undefined ? (String(data.image_url).trim() || null) : hotel.image_url;
      const brandId = String(data.brand_id || hotel.brand_id);
      const regionId = String(data.region_id || hotel.region_id);
      const provinceId = String(data.province_id || hotel.province_id || "");
      const cityId = data.city_id ? String(data.city_id).trim() : null;
      let city = String(data.city || hotel.city || "").trim();

      if (!city && cityId) {
        const found = cities.find((c) => c.id === cityId);
        if (found) city = found.name;
      }

      const hasFb = data.has_fb === "false" ? false : true;
      const status = String(data.status || hotel.status || "ACTIVE");
      const openingDate = data.opening_date ? String(data.opening_date) : null;
      const terminateDate = data.terminate_date ? String(data.terminate_date) : null;
      const gmId = data.gm_id ? String(data.gm_id) : null;
      const romId = data.rom_id ? String(data.rom_id) : null;
      const latitude = Number(data.lat ?? lat);
      const longitude = Number(data.lng ?? lng);
      const radius = Number(data.geofence_radius_meters ?? geofenceRadius);

      const ballroomCapacity = Number(data.ballroom_capacity ?? mice.ballroom_capacity ?? 0);
      const meetingRooms = Number(data.meeting_rooms ?? mice.meeting_rooms ?? 0);
      const hasVideotron = Boolean(data.has_videotron);

      const miceFacilities =
        ballroomCapacity > 0 || meetingRooms > 0 || hasVideotron
          ? {
              ballroom_capacity: ballroomCapacity,
              meeting_rooms: meetingRooms,
              has_videotron: hasVideotron,
            }
          : undefined;

      // Kumpulkan PIC kontak dari form (baik dari select atau input teks)
      const contacts: HotelContactCreateRequest[] = [];

      // GM
      let gmName = data.gm_contact_name ? String(data.gm_contact_name).trim() : "";
      let gmPhone = data.gm_contact_phone ? String(data.gm_contact_phone).trim() : null;
      let gmEmail = data.gm_contact_email ? String(data.gm_contact_email).trim() : null;
      if (!gmName && data.gm_contact_select && data.gm_contact_select !== "MANUAL") {
        const parts = String(data.gm_contact_select).split("|");
        gmName = parts[0] || "";
        gmPhone = parts[1] || null;
        gmEmail = parts[2] || null;
      }
      if (gmName) {
        contacts.push({
          contact_type: "GM",
          name: gmName,
          email: gmEmail,
          phone: gmPhone,
          is_primary: true,
        });
      }

      // SALES
      let salesName = data.sales_contact_name ? String(data.sales_contact_name).trim() : "";
      let salesPhone = data.sales_contact_phone ? String(data.sales_contact_phone).trim() : null;
      let salesEmail = data.sales_contact_email ? String(data.sales_contact_email).trim() : null;
      if (!salesName && data.sales_contact_select && data.sales_contact_select !== "MANUAL") {
        const parts = String(data.sales_contact_select).split("|");
        salesName = parts[0] || "";
        salesPhone = parts[1] || null;
        salesEmail = parts[2] || null;
      }
      if (salesName) {
        contacts.push({
          contact_type: "SALES",
          name: salesName,
          email: salesEmail,
          phone: salesPhone,
          is_primary: false,
        });
      }

      // FINANCE
      let finName = data.finance_contact_name ? String(data.finance_contact_name).trim() : "";
      let finPhone = data.finance_contact_phone ? String(data.finance_contact_phone).trim() : null;
      let finEmail = data.finance_contact_email ? String(data.finance_contact_email).trim() : null;
      if (!finName && data.finance_contact_select && data.finance_contact_select !== "MANUAL") {
        const parts = String(data.finance_contact_select).split("|");
        finName = parts[0] || "";
        finPhone = parts[1] || null;
        finEmail = parts[2] || null;
      }
      if (finName) {
        contacts.push({
          contact_type: "FINANCE",
          name: finName,
          email: finEmail,
          phone: finPhone,
          is_primary: false,
        });
      }

      // ROM
      let romName = data.rom_contact_name ? String(data.rom_contact_name).trim() : "";
      let romEmail = data.rom_contact_email ? String(data.rom_contact_email).trim() : null;
      if (!romName && data.rom_contact_select && data.rom_contact_select !== "MANUAL") {
        const parts = String(data.rom_contact_select).split("|");
        romName = parts[0] || "";
        romEmail = parts[2] || null;
      }
      if (romName) {
        contacts.push({
          contact_type: "ROM",
          name: romName,
          email: romEmail,
          phone: null,
          is_primary: false,
        });
      }

      const payload = {
        code,
        name,
        image_url: imageUrl,
        brand_id: brandId,
        region_id: regionId,
        province_id: provinceId || undefined,
        city_id: cityId || undefined,
        city,
        has_fb: hasFb,
        geo: {
          lat: latitude,
          lng: longitude,
        },
        geofence_radius_meters: radius,
        mice_facilities: miceFacilities,
        gm_id: gmId || null,
        rom_id: romId || null,
        opening_date: openingDate || null,
        terminate_date: terminateDate || null,
        status: status as "ACTIVE" | "TEMPORARILY_CLOSED" | "TERMINATED",
        contacts: contacts.length > 0 ? contacts : undefined,
      };

      const identifier = String(hotel.id ?? hotel.code);
      const result = await updateHotelAction(identifier, payload);
      if (!result.ok) {
        setErrorMessage(result.message ?? "Gagal memperbarui properti hotel.");
        setSubmitting(false);
        return;
      }

      setCurrentStatus(status);
      setSuccessMessage(`Data hotel ${name} (${code}) berhasil diperbarui!`);
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setErrorMessage(null);

    const identifier = String(hotel.id ?? hotel.code);
    const res = await deleteHotelAction(identifier);
    setDeleting(false);

    if (!res.ok) {
      setErrorMessage(res.message ?? "Gagal menghapus properti hotel.");
      setConfirmDelete(false);
      return;
    }

    setSuccessMessage(`Hotel ${hotel.name} (${hotel.code}) berhasil dihapus (soft-delete). Mengalihkan...`);
    setTimeout(() => {
      router.push("/dashboard/hotels");
      router.refresh();
    }, 1200);
  }

  function handleFormChange(values: Record<string, unknown>) {
    if (values.lat !== undefined && !isNaN(Number(values.lat))) {
      setLat(Number(values.lat));
    }
    if (values.lng !== undefined && !isNaN(Number(values.lng))) {
      setLng(Number(values.lng));
    }
    if (values.geofence_radius_meters !== undefined && !isNaN(Number(values.geofence_radius_meters))) {
      setGeofenceRadius(Number(values.geofence_radius_meters));
    }
    if (values.name) {
      setHotelName(String(values.name));
    }
    if (values.status) {
      setCurrentStatus(String(values.status));
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/hotels"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card/70 text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Master Data Properti
              </span>
              <span className="text-muted-foreground/40">•</span>
              <span className="font-mono text-xs font-bold text-primary">{hotel.code}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Edit Properti: {hotel.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/hotel/${hotel.code}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Analytics Drilldown
          </Link>
          <Link
            href="/dashboard/hotels"
            className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Kembali
          </Link>
        </div>
      </div>

      {/* Feedback Alerts */}
      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-600">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 2-Column Master Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Kolom Kiri: Form Edit (@incodiy/cavaform) */}
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-elegant backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between border-b border-border/40 pb-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Perbarui Profil Properti
                </h2>
                <p className="text-xs text-muted-foreground">
                  Kelola konfigurasi alamat, geofence, fasilitas MICE, serta hierarki manajemen hotel
                </p>
              </div>
              <Building2 className="h-5 w-5 text-primary" />
            </div>

            <CavaForm
              fields={formFields}
              onSubmit={handleSubmit}
              onChange={handleFormChange}
              config={{
                submitLabel: submitting ? "Menyimpan Perubahan..." : "Simpan Perubahan Hotel",
              }}
              className="space-y-4"
            />
          </div>
        </div>

        {/* Kolom Kanan: Peta Geofence (@incodiy/cavaloc), FSM Status & Aksi Kritis */}
        <div className="space-y-6 lg:col-span-5">
          {/* Status FSM Card */}
          <div className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-elegant backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status Operasional Saat Ini
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <StatusPill tone={STATUS_TONE[currentStatus] ?? "off"}>
                    {currentStatus}
                  </StatusPill>
                  {hotel.brand_tier && (
                    <span className="rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {hotel.brand_tier}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-muted-foreground">Brand:</span>
                <p className="text-xs font-semibold text-foreground">{hotel.brand ?? "—"}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/40 pt-4 text-xs">
              <div>
                <span className="text-muted-foreground">Wilayah:</span>
                <p className="font-medium text-foreground">{hotel.region ?? "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Kota:</span>
                <p className="font-medium text-foreground">{hotel.city ?? "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">General Manager:</span>
                <p className="font-medium text-foreground">{hotel.gm_name ?? "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Regional ROM:</span>
                <p className="font-medium text-foreground">{hotel.rom_name ?? "—"}</p>
              </div>
            </div>
          </div>

          {/* Preview Titik Koordinat & Geofence (@incodiy/cavaloc) */}
          <div className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-elegant backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="text-base font-semibold text-foreground">
                  Peta Lokasi & Geofence
                </h3>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-primary">
                Radius: {geofenceRadius}m
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-border/60">
              <MapView
                lat={lat}
                lng={lng}
                title={hotelName || hotel.name}
                address={`Koordinat: ${lat.toFixed(5)}, ${lng.toFixed(5)} — Radius: ${geofenceRadius}m`}
                zoom={14}
                height={260}
                interactive={true}
                pinColor="#0ea5e9"
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/40 pt-4 text-xs">
              <div className="rounded-lg border border-border/40 bg-muted/20 p-2.5">
                <span className="text-muted-foreground">Latitude:</span>
                <p className="font-mono font-semibold text-foreground">{lat}</p>
              </div>
              <div className="rounded-lg border border-border/40 bg-muted/20 p-2.5">
                <span className="text-muted-foreground">Longitude:</span>
                <p className="font-mono font-semibold text-foreground">{lng}</p>
              </div>
            </div>
          </div>

          {/* Zona Tindakan Kritis (Soft Delete) */}
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 shadow-elegant">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <Trash2 className="h-4 w-4" />
              Tindakan Kritis Properti
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Menghapus hotel ini akan menyimpannya sebagai arsip nonaktif (*soft delete*). Seluruh riwayat sesi audit dan kuotasi historis tetap terjaga.
            </p>

            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Hapus Hotel Ini
              </button>
            ) : (
              <div className="mt-4 space-y-3 rounded-xl border border-destructive/40 bg-destructive/15 p-4 text-xs">
                <p className="font-semibold text-destructive">
                  Apakah Anda yakin ingin menghapus properti {hotel.name} ({hotel.code})?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3.5 py-1.5 font-semibold text-destructive-foreground transition hover:opacity-90 disabled:opacity-50"
                  >
                    {deleting ? "Menghapus..." : "Ya, Hapus Sekarang"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 font-semibold text-muted-foreground transition hover:bg-muted"
                  >
                    Batalkan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
