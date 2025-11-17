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
} from "@/app/actions/hotels";
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

interface HotelEditClientProps {
  hotel: Hotel;
  brands: Brand[];
  regions: Region[];
  provinces: Province[];
  gms: Array<{ id: string; name: string }>;
  roms: Array<{ id: string; name: string }>;
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
  gms,
  roms,
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
      name: "brand_id",
      label: "Brand & Kategori Klasifikasi",
      type: "select",
      validation: { required: true },
      options: brandOptions,
      defaultValue: hotel.brand_id,
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
      name: "province_id",
      label: "Provinsi",
      type: "select",
      validation: { required: true },
      options: provinceOptions,
      defaultValue: hotel.province_id ?? "",
    },
    {
      name: "city",
      label: "Kota / Kabupaten",
      type: "text",
      validation: { required: true },
      defaultValue: hotel.city ?? "",
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
      defaultValue: (hotel as Record<string, unknown>).opening_date ? String((hotel as Record<string, unknown>).opening_date) : "",
    },
    {
      name: "gm_id",
      label: "Penugasan General Manager (GM)",
      type: "select",
      options: gmOptions,
      defaultValue: (hotel as Record<string, unknown>).gm_id ? String((hotel as Record<string, unknown>).gm_id) : "",
    },
    {
      name: "rom_id",
      label: "Penugasan Regional Ops Manager (ROM)",
      type: "select",
      options: romOptions,
      defaultValue: (hotel as Record<string, unknown>).rom_id ? String((hotel as Record<string, unknown>).rom_id) : "",
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
      const brandId = String(data.brand_id || hotel.brand_id);
      const regionId = String(data.region_id || hotel.region_id);
      const provinceId = String(data.province_id || hotel.province_id || "");
      const city = String(data.city || hotel.city || "").trim();
      const status = String(data.status || hotel.status || "ACTIVE");
      const openingDate = data.opening_date ? String(data.opening_date) : null;
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

      const payload = {
        code,
        name,
        brand_id: brandId,
        region_id: regionId,
        province_id: provinceId || undefined,
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
        status: status as "ACTIVE" | "TEMPORARILY_CLOSED" | "TERMINATED",
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
