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
import { createHotelAction, type Brand, type Region, type Province } from "@/app/actions/hotels";

const MapView = dynamic(
  () => import("@incodiy/cavaloc").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full animate-pulse rounded-xl bg-muted/40" />
    ),
  }
);

interface HotelCreateClientProps {
  brands: Brand[];
  regions: Region[];
  provinces: Province[];
  gms: Array<{ id: string; name: string }>;
  roms: Array<{ id: string; name: string }>;
}

export function HotelCreateClient({
  brands,
  regions,
  provinces,
  gms,
  roms,
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

  const gmOptions = [
    { value: "", label: "— Tanpa GM (Belum Ditentukan) —" },
    ...gms.filter((g) => Boolean(g.id)).map((g) => ({ value: g.id as string, label: g.name })),
  ];

  const romOptions = [
    { value: "", label: "— Tanpa ROM (Belum Ditentukan) —" },
    ...roms.filter((r) => Boolean(r.id)).map((r) => ({ value: r.id as string, label: r.name })),
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
      name: "brand_id",
      label: "Brand & Kategori Klasifikasi",
      type: "select",
      validation: { required: true },
      options: brandOptions,
    },
    {
      name: "region_id",
      label: "Wilayah Operasional (Region)",
      type: "select",
      validation: { required: true },
      options: regionOptions,
    },
    {
      name: "province_id",
      label: "Provinsi",
      type: "select",
      validation: { required: true },
      options: provinceOptions,
    },
    {
      name: "city",
      label: "Kota / Kabupaten",
      type: "text",
      placeholder: "Contoh: Cirebon",
      validation: { required: true },
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
      name: "gm_id",
      label: "Penugasan General Manager (GM)",
      type: "select",
      options: gmOptions,
    },
    {
      name: "rom_id",
      label: "Penugasan Regional Ops Manager (ROM)",
      type: "select",
      options: romOptions,
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
      const brandId = String(data.brand_id || "");
      const regionId = String(data.region_id || "");
      const provinceId = String(data.province_id || "");
      const city = String(data.city || "").trim();
      const status = String(data.status || "ACTIVE") as "ACTIVE" | "TEMPORARILY_CLOSED" | "TERMINATED";
      const openingDate = data.opening_date ? String(data.opening_date) : null;
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

      const payload = {
        code,
        name,
        brand_id: brandId,
        region_id: regionId,
        province_id: provinceId,
        city,
        geo: {
          lat: latitude,
          lng: longitude,
        },
        geofence_radius_meters: radius,
        mice_facilities: miceFacilities,
        gm_id: gmId || null,
        rom_id: romId || null,
        opening_date: openingDate || null,
        status,
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
