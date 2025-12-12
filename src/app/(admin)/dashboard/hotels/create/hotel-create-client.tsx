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
  ShieldCheck,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { createHotelAction, type Brand, type Region, type Province, type City } from "@/app/actions/hotels";
import type { HotelContactCreateRequest } from "@/app/actions/hotel-contacts";

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

interface HotelCreateClientProps {
  brands: Brand[];
  regions: Region[];
  provinces: Province[];
  cities: City[];
  gms: Array<{ id: string; name: string }>;
  roms: Array<{ id: string; name: string }>;
  contacts?: HotelContact[];
}

export function HotelCreateClient({
  brands,
  regions,
  provinces,
  cities,
  gms,
  roms,
  contacts = [],
}: HotelCreateClientProps) {
  const router = useRouter();

  const [lat, setLat] = useState<number>(-6.2088);
  const [lng, setLng] = useState<number>(106.8456);
  const [geofenceRadius, setGeofenceRadius] = useState<number>(200);
  const [hotelName, setHotelName] = useState<string>("");
  const [hotelCode, setHotelCode] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const formFields: FieldSchema[] = [
    {
      name: "code",
      label: "Kode Hotel (Unik, 2-10 Karakter)",
      type: "text",
      placeholder: "Contoh: SBCW",
      validation: { required: true },
      helperText: "Singkatan kode properti kapital unik untuk referensi sistem & audit",
    },
    {
      name: "name",
      label: "Nama Properti Hotel",
      type: "text",
      placeholder: "Contoh: Swiss-Belhotel Cirebon",
      validation: { required: true },
    },
    {
      name: "image_url",
      label: "URL Foto Fasad Hotel",
      type: "text",
      placeholder: "https://... (Foto fasad tampak depan hotel)",
      helperText: "Tautan gambar fasad arsitektur resolusi tinggi (rasio 16:9)",
    },
    {
      name: "brand_id",
      label: "Brand & Kategori Klasifikasi",
      type: "select",
      validation: { required: true },
      options: brandOptions,
    },
    {
      name: "city_id",
      label: "Master Kota / Kabupaten (3NF)",
      type: "select",
      options: cityOptions,
      helperText: "Pilih dari Master Kota resmi untuk pemetaan otomatis",
    },
    {
      name: "city",
      label: "Nama Kota / Area (Label Tampilan)",
      type: "text",
      placeholder: "Contoh: Cirebon",
      validation: { required: true },
      helperText: "Nama kota kanonikal yang akan ditampilkan di katalog",
    },
    {
      name: "province_id",
      label: "Provinsi",
      type: "select",
      validation: { required: true },
      options: provinceOptions,
    },
    {
      name: "region_id",
      label: "Wilayah Operasional (Region)",
      type: "select",
      validation: { required: true },
      options: regionOptions,
    },
    {
      name: "has_fb",
      label: "Fasilitas F&B (Restoran / Room Service)",
      type: "select",
      options: [
        { value: "true", label: "F&B Tersedia (Restoran / Room Service Beroperasi)" },
        { value: "false", label: "Room Only (Tanpa Layanan Makanan & Minuman)" },
      ],
      defaultValue: "true",
      helperText: "Menentukan apakah modul audit F&B dan checklist restoran diaktifkan",
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
      defaultValue: "ACTIVE",
    },
    {
      name: "opening_date",
      label: "Tanggal Pembukaan (Opening Date)",
      type: "date",
    },
    {
      name: "terminate_date",
      label: "Tanggal Terminasi (Opsional)",
      type: "date",
      helperText: "Diisi bila hotel dijadwalkan selesai masa kontrak operasional",
    },
    {
      name: "gm_id",
      label: "Akun GM Sistem (User Login)",
      type: "select",
      options: gmOptions,
      helperText: "Akun login GM di sistem untuk akses mobile/web",
    },
    {
      name: "rom_id",
      label: "Akun ROM Sistem (User Login)",
      type: "select",
      options: romOptions,
    },
    // Kontak Personil Lapangan (Excel PIC Data — Smart Select 3NF)
    {
      name: "gm_contact_select",
      label: "Pilih Kontak PIC GM dari Master",
      type: "select",
      options: gmContactOptions,
      helperText: "Pilih dari daftar kontak GM yang ada untuk mengisi otomatis, atau pilih Input Baru",
    },
    {
      name: "gm_contact_name",
      label: "Nama Kontak GM (PIC)",
      type: "text",
      placeholder: "Nama lengkap General Manager",
      helperText: "Kontak PIC GM operasional properti",
    },
    {
      name: "gm_contact_phone",
      label: "No. HP / WhatsApp GM",
      type: "text",
      placeholder: "+62 812-xxxx-xxxx",
    },
    {
      name: "gm_contact_email",
      label: "Email Resmi GM",
      type: "text",
      placeholder: "gm@swiss-belhotel.com",
    },
    {
      name: "sales_contact_select",
      label: "Pilih Kontak PIC Sales dari Master",
      type: "select",
      options: salesContactOptions,
      helperText: "Pilih dari daftar kontak Sales untuk mengisi otomatis, atau pilih Input Baru",
    },
    {
      name: "sales_contact_name",
      label: "Nama Kontak Sales (PIC)",
      type: "text",
      placeholder: "Nama Sales Manager / DOS",
    },
    {
      name: "sales_contact_phone",
      label: "No. HP / WhatsApp Sales",
      type: "text",
      placeholder: "+62 812-xxxx-xxxx",
    },
    {
      name: "sales_contact_email",
      label: "Email Resmi Sales",
      type: "text",
      placeholder: "sales@swiss-belhotel.com",
    },
    {
      name: "finance_contact_select",
      label: "Pilih Kontak PIC Finance dari Master",
      type: "select",
      options: financeContactOptions,
      helperText: "Pilih dari daftar kontak Finance untuk mengisi otomatis, atau pilih Input Baru",
    },
    {
      name: "finance_contact_name",
      label: "Nama Kontak Finance (PIC)",
      type: "text",
      placeholder: "Nama Financial Controller / Chief Accountant",
    },
    {
      name: "finance_contact_phone",
      label: "No. HP / WhatsApp Finance",
      type: "text",
      placeholder: "+62 812-xxxx-xxxx",
    },
    {
      name: "finance_contact_email",
      label: "Email Resmi Finance",
      type: "text",
      placeholder: "finance@swiss-belhotel.com",
    },
    {
      name: "rom_contact_select",
      label: "Pilih PIC ROM dari Master",
      type: "select",
      options: romContactOptions,
      helperText: "Pilih Regional Operations Manager (ROM) penanggung jawab",
    },
    {
      name: "rom_contact_name",
      label: "Nama PIC ROM",
      type: "text",
      placeholder: "Nama Regional Operations Manager",
    },
    {
      name: "rom_contact_email",
      label: "Email PIC ROM",
      type: "text",
      placeholder: "rom@swiss-belhotel.com",
    },
    {
      name: "lat",
      label: "Garis Lintang (Latitude GPS)",
      type: "number",
      placeholder: "-6.2088",
      validation: { required: true },
      defaultValue: -6.2088,
    },
    {
      name: "lng",
      label: "Garis Bujur (Longitude GPS)",
      type: "number",
      placeholder: "106.8456",
      validation: { required: true },
      defaultValue: 106.8456,
    },
    {
      name: "geofence_radius_meters",
      label: "Radius Geofence (Meter)",
      type: "number",
      placeholder: "200",
      validation: { required: true },
      defaultValue: 200,
      helperText: "Ambang batas validasi GPS inspektur live-camera (PRD-F-04: 50m - 5000m)",
    },
    {
      name: "ballroom_capacity",
      label: "Kapasitas Ballroom (MICE Pax)",
      type: "number",
      placeholder: "500",
      helperText: "Kapasitas maksimum peserta kegiatan rapat/event pemerintah",
    },
    {
      name: "meeting_rooms",
      label: "Jumlah Ruang Pertemuan (Meeting Rooms)",
      type: "number",
      placeholder: "5",
    },
    {
      name: "has_videotron",
      label: "Memiliki Layar Videotron / LED Screen",
      type: "checkbox",
    },
  ];

  async function handleSubmit(data: Record<string, unknown>) {
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      const code = String(data.code || "").trim().toUpperCase();
      const name = String(data.name || "").trim();
      const imageUrl = data.image_url ? String(data.image_url).trim() : null;
      const brandId = String(data.brand_id || "");
      const regionId = String(data.region_id || "");
      const provinceId = String(data.province_id || "");
      const cityId = data.city_id ? String(data.city_id).trim() : null;
      let city = String(data.city || "").trim();

      // Jika city kosong tapi city_id dipilih, autofill dari nama city master
      if (!city && cityId) {
        const found = cities.find((c) => c.id === cityId);
        if (found) city = found.name;
      }

      const hasFb = data.has_fb === "false" ? false : true;
      const status = String(data.status || "ACTIVE") as "ACTIVE" | "TEMPORARILY_CLOSED" | "TERMINATED";
      const openingDate = data.opening_date ? String(data.opening_date) : null;
      const terminateDate = data.terminate_date ? String(data.terminate_date) : null;
      const gmId = data.gm_id ? String(data.gm_id) : null;
      const romId = data.rom_id ? String(data.rom_id) : null;
      const latitude = Number(data.lat ?? lat);
      const longitude = Number(data.lng ?? lng);
      const radius = Number(data.geofence_radius_meters ?? geofenceRadius);

      const ballroomCapacity = data.ballroom_capacity ? Number(data.ballroom_capacity) : 0;
      const meetingRooms = data.meeting_rooms ? Number(data.meeting_rooms) : 0;
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
        province_id: provinceId,
        city_id: cityId || null,
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
        status,
        contacts: contacts.length > 0 ? contacts : undefined,
      };

      const result = await createHotelAction(payload);
      if (!result.ok) {
        setErrorMessage(result.message ?? "Gagal menambahkan properti hotel.");
        setSubmitting(false);
        return;
      }

      setSuccessMessage(`Hotel ${name} (${code}) berhasil didaftarkan ke sistem!`);
      setTimeout(() => {
        router.push("/dashboard/hotels");
        router.refresh();
      }, 1200);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
      setSubmitting(false);
    }
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
    if (values.code) {
      setHotelCode(String(values.code));
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
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Tambah Hotel Baru
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/hotels"
            className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Batalkan
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
        {/* Kolom Kiri: Form Input (@incodiy/cavaform) */}
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-elegant backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between border-b border-border/40 pb-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Informasi Profil & Operasional
                </h2>
                <p className="text-xs text-muted-foreground">
                  Lengkapi data entitas hotel sesuai master data resmi korporat
                </p>
              </div>
              <Building2 className="h-5 w-5 text-primary" />
            </div>

            <CavaForm
              fields={formFields}
              onSubmit={handleSubmit}
              onChange={handleFormChange}
              config={{
                submitLabel: submitting ? "Mendaftarkan Hotel..." : "Daftarkan Hotel Baru",
              }}
              className="space-y-4"
            />
          </div>
        </div>

        {/* Kolom Kanan: Peta Geofence (@incodiy/cavaloc) & Konteks */}
        <div className="space-y-6 lg:col-span-5">
          {/* Preview Titik Koordinat & Geofence */}
          <div className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-elegant backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="text-base font-semibold text-foreground">
                  Lokasi GPS & Radius Geofence
                </h3>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-primary">
                Radius: {geofenceRadius}m
              </span>
            </div>

            <p className="mb-4 text-xs text-muted-foreground">
              Visualisasi titik koordinat WGS84 pada peta. Radius lingkaran geofence digunakan untuk memvalidasi presensi inspeksi langsung di tempat via aplikasi seluler (*Live Camera*).
            </p>

            <div className="overflow-hidden rounded-xl border border-border/60">
              <MapView
                lat={lat}
                lng={lng}
                title={hotelName ? (hotelCode ? `${hotelName} (${hotelCode})` : hotelName) : "Pratinjau Lokasi Hotel"}
                address={`Koordinat: ${lat.toFixed(5)}, ${lng.toFixed(5)} — Radius: ${geofenceRadius}m`}
                zoom={14}
                height={280}
                interactive={true}
                pinColor="#0ea5e9"
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/40 pt-4 text-xs">
              <div className="rounded-lg border border-border/40 bg-muted/20 p-2.5">
                <span className="text-muted-foreground">Lintang (Lat):</span>
                <p className="font-mono font-semibold text-foreground">{lat}</p>
              </div>
              <div className="rounded-lg border border-border/40 bg-muted/20 p-2.5">
                <span className="text-muted-foreground">Bujur (Lng):</span>
                <p className="font-mono font-semibold text-foreground">{lng}</p>
              </div>
            </div>
          </div>

          {/* Panduan Integrasi Otomatis */}
          <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-elegant backdrop-blur-xl">
            <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Ketentuan Pembuatan Hotel (PRD & Constraint)
            </h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>
                  <strong>6 Departemen Otomatis:</strong> Sistem akan otomatis membentuk departemen FO, HK, KFB, SEC, ENG, dan SALES untuk hotel ini.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>
                  <strong>Validasi Geofence (F-04):</strong> Auditor yang melakukan checklist di lokasi wajib berada di dalam lingkaran radius {geofenceRadius} meter.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>
                  <strong>Fasilitas MICE:</strong> Data ballroom & ruang rapat langsung terintegrasi dengan kalkulator penawaran harga (*CRM Quotations*).
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
