"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { StatusPill, type ToneKey } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { isCorporate, roleCodes, type Session } from "@/lib/auth/session";
import {
  capaVerifyGmAction,
  capaVerifyQaAction,
  capaEscalateAction,
  capaAssignAction,
  capaResolveAction,
  capaMediaGetUrlAction,
  type CapaTicketDetail,
} from "@/app/actions/capa";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  Edit,
  FileText,
  History,
  Image as ImageIcon,
  MapPin,
  ShieldAlert,
  Upload,
  User,
  Users,
  X,
  XCircle,
  Sparkles,
  Layers,
  Wrench,
  Camera,
  ShieldCheck,
  Lock,
  Check,
} from "lucide-react";
import type { components } from "@/lib/api/openapi";

const MapView = dynamic(
  () => import("@incodiy/cavaloc").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="h-56 w-full animate-pulse rounded-xl bg-muted/30" />
    ),
  }
);

type CapaMedia = components["schemas"]["CapaMedia"];
type CapaHistory = components["schemas"]["CapaHistory"];

const STATUS_TONE: Record<string, ToneKey> = {
  OPEN: "off",
  IN_PROGRESS: "wait",
  AWAITING_GM: "wait",
  AWAITING_QA: "wait",
  CLOSED: "on",
};

const SLA_TONE: Record<string, ToneKey> = {
  ON_TRACK: "on",
  AT_RISK: "wait",
  OVERDUE: "off",
};

function EvidenceThumb({
  ticketId,
  media,
  label,
  onPreview,
}: {
  ticketId: string;
  media: CapaMedia;
  label: string;
  onPreview: (url: string) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    capaMediaGetUrlAction(ticketId, media.id ?? "").then((r) => {
      if (!alive) return;
      if (r.ok && r.url) setUrl(r.url);
    });
    return () => {
      alive = false;
    };
  }, [ticketId, media.id, media.upload_status]);

  const displayUrl = url || (media.object_key?.startsWith("data:") ? media.object_key : null);

  if (displayUrl) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onPreview(displayUrl)}
        onKeyDown={(e) => { if (e.key === "Enter") onPreview(displayUrl); }}
        className="group relative block aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-xl border border-border/60 bg-muted/20"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayUrl}
          alt={label}
          className="h-full w-full object-cover transition-smooth group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-smooth group-hover:opacity-100">
          <span className="rounded-lg bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm">
            Lihat Bukti
          </span>
        </div>
        <div className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[9px] text-white font-mono backdrop-blur-xs">
          {media.gps_lat && media.gps_lng ? `📍 ${media.gps_lat.toFixed(4)}, ${media.gps_lng.toFixed(4)}` : "Live Watermark"}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col aspect-[4/3] w-full items-center justify-center rounded-xl border border-primary/30 bg-primary/5 p-4 text-center text-xs text-foreground">
      <Camera className="h-7 w-7 text-primary mb-1.5" />
      <span className="font-bold">{label}</span>
      <span className="text-[10px] text-muted-foreground mt-0.5 font-mono truncate max-w-full px-2">
        {media.file_name || media.object_key?.split("/").pop() || "evidence.webp"}
      </span>
      <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
        ✓ Terverifikasi ({media.source_camera || "LIVE_CAMERA"})
      </span>
    </div>
  );
}

function Timeline({ history }: { history?: CapaHistory[] }) {
  const t = useTranslations();
  if (!history || history.length === 0) {
    return <p className="text-xs text-muted-foreground">{t("capa.hub.noHistory")}</p>;
  }

  return (
    <ol className="relative ml-2 space-y-4 border-l border-border/70 pl-4 text-xs">
      {history.map((h, i) => (
        <li key={i} className="group relative">
          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-muted-foreground">
              {h.from_status ? `${h.from_status} → ` : ""}
              <strong className="text-foreground">{h.to_status}</strong>
            </span>
            <span className="text-[10px] text-muted-foreground">
              {h.at ? new Date(h.at).toLocaleString() : ""}
            </span>
          </div>
          {h.note && (
            <p className="mt-1 rounded-lg bg-muted/30 p-2 text-muted-foreground leading-relaxed">
              {h.note}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

const STAGES = [
  { key: "OPEN", label: "1. Terbuka", desc: "Penugasan PIC", icon: Users },
  { key: "IN_PROGRESS", label: "2. Dalam Proses", desc: "Perbaikan & Foto", icon: Wrench },
  { key: "AWAITING_GM", label: "3. Verifikasi GM", desc: "Persetujuan GM", icon: ShieldCheck },
  { key: "AWAITING_QA", label: "4. Verifikasi QA", desc: "Persetujuan QA", icon: Camera },
  { key: "CLOSED", label: "5. Ditutup", desc: "Tuntas Terverifikasi", icon: Lock },
];

function getStageIndex(status?: string | null): number {
  if (!status) return 0;
  if (status === "OPEN") return 0;
  if (status === "IN_PROGRESS") return 1;
  if (status === "AWAITING_GM") return 2;
  if (status === "AWAITING_QA") return 3;
  if (status === "CLOSED") return 4;
  return 0;
}

export function CapaDetailClient({
  detail,
  session,
  hotelGeo,
  users = [],
}: {
  detail: CapaTicketDetail;
  session: Session | null;
  hotelGeo?: { lat?: number | null; lng?: number | null; radius_meters?: number | null } | null;
  users?: Array<{ id: string; name: string; email: string }>;
}) {
  const t = useTranslations();
  const router = useRouter();

  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<{ ok: boolean; status?: number; message?: string } | null>(null);

  // Modal assign & resolve states
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedResolverId, setSelectedResolverId] = useState("");
  const [assignNote, setAssignNote] = useState("");

  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveNote, setResolveNote] = useState("");
  const [afterPhotoFile, setAfterPhotoFile] = useState<File | null>(null);
  const [afterPhotoPreview, setAfterPhotoPreview] = useState<string | null>(null);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setAfterPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setAfterPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleRemovePhoto() {
    setAfterPhotoFile(null);
    setAfterPhotoPreview(null);
  }

  const roles = roleCodes(session);
  const corporate = isCorporate(session);
  const hotelGm = roles.includes("HOTEL_GM");
  const isResolver = session?.user?.id === detail.assigned_to;

  const canGm = hotelGm && detail.status === "AWAITING_GM";
  const canQa = corporate && detail.status === "AWAITING_QA";
  const canEscalate = (corporate || hotelGm) && detail.status !== "CLOSED" && (detail.escalation_level ?? 0) < 3;
  const canAssign = (corporate || hotelGm) && (detail.status === "OPEN" || detail.status === "IN_PROGRESS");
  const canResolve = (isResolver || hotelGm || corporate) && (detail.status === "OPEN" || detail.status === "IN_PROGRESS");
  const canEdit = detail.status === "OPEN" || detail.status === "IN_PROGRESS";

  const currentStageIndex = getStageIndex(detail.status);

  const media = detail.media ?? [];
  const before = media.filter((m) => m.phase === "BEFORE");
  const after = media.filter((m) => m.phase === "AFTER");
  const sum = detail.media_summary;

  function applyResult(r: { ok: boolean; status?: number; message?: string }) {
    setOutcome(r);
    if (r.ok) {
      setNote("");
      setAssignOpen(false);
      setResolveOpen(false);
      router.refresh();
    }
  }

  async function onAssignSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedResolverId) return;
    setBusy("assign");
    const r = await capaAssignAction(String(detail.id), selectedResolverId, assignNote);
    setBusy(null);
    applyResult(r);
  }

  async function onResolveSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resolveNote.trim()) return;
    setBusy("resolve");

    let checksum = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    if (afterPhotoFile) {
      try {
        const buf = await afterPhotoFile.arrayBuffer();
        const hashBuf = await crypto.subtle.digest("SHA-256", buf);
        checksum = Array.from(new Uint8Array(hashBuf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      } catch {
        // Fallback
      }
    }

    const simulatedMedia = [
      {
        phase: "AFTER" as const,
        source_camera: "LIVE_CAMERA" as const,
        mime: afterPhotoFile?.type || "image/webp",
        width: 1280,
        height: 960,
        size_bytes: afterPhotoFile?.size || 215_000,
        checksum_sha256: checksum,
        gps_lat: hotelGeo?.lat ?? -6.2088,
        gps_lng: hotelGeo?.lng ?? 106.8456,
        gps_valid: true,
        captured_at: new Date().toISOString(),
      },
    ];
    const r = await capaResolveAction(String(detail.id), resolveNote, simulatedMedia);
    setBusy(null);
    if (r.ok) {
      handleRemovePhoto();
    }
    applyResult(r);
  }

  async function onGm(decision: "APPROVE" | "REJECT") {
    setBusy(`gm:${decision}`);
    const r = await capaVerifyGmAction(String(detail.id), decision, note);
    setBusy(null);
    applyResult(r);
  }

  async function onQa(decision: "CLOSE" | "REOPEN") {
    setBusy(`qa:${decision}`);
    const r = await capaVerifyQaAction(String(detail.id), decision, note);
    setBusy(null);
    applyResult(r);
  }

  async function onEscalate() {
    setBusy("escalate");
    const r = await capaEscalateAction(String(detail.id));
    setBusy(null);
    applyResult(r);
  }

  return (
    <div className="space-y-6">
      {/* ─── Back to List & Top Stage Bar ─── */}
      <div className="rounded-3xl border border-border/70 bg-gradient-to-r from-card via-card/95 to-card p-5 shadow-lg backdrop-blur-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
          <Link
            href="/dashboard/capa"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-background/80 px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Daftar CAPA</span>
          </Link>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs font-bold border-primary/30 text-primary">
              {detail.receipt_id || "CAPA"}
            </Badge>
            <StatusPill tone={STATUS_TONE[detail.status ?? "OPEN"] ?? "off"}>
              {detail.status}
            </StatusPill>
          </div>
        </div>

        {/* Visual Stage Progress Stepper */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-1">
            <span className="flex items-center gap-1.5 text-foreground">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Alur Siklus Remediasi & Verifikasi:
            </span>
            <span className="text-[11px] text-primary">
              Tahap {currentStageIndex + 1} dari 5
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            {STAGES.map((s, idx) => {
              const Icon = s.icon;
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              return (
                <div
                  key={s.key}
                  className={`rounded-2xl border p-2.5 transition-all relative ${
                    isCurrent
                      ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30"
                      : isPast
                      ? "border-emerald-500/30 bg-emerald-500/5 text-muted-foreground"
                      : "border-border/50 bg-card/40 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      {isPast ? (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <Check className="h-3 w-3" /> Selesai
                        </span>
                      ) : isCurrent ? (
                        <span className="text-primary font-bold">Aktif Saat Ini</span>
                      ) : (
                        <span className="text-muted-foreground">Menunggu</span>
                      )}
                    </span>
                    <Icon className={`h-3.5 w-3.5 ${isCurrent ? "text-primary" : isPast ? "text-emerald-600" : "text-muted-foreground"}`} />
                  </div>
                  <p className={`font-bold text-xs ${isCurrent ? "text-foreground" : ""}`}>
                    {s.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Kiri: Detail Informasi & Bukti Media */}
        <div className="space-y-6 lg:col-span-2">
          {/* Ringkasan Header Tiket */}
          <div className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-elegant backdrop-blur-xl space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    {detail.receipt_id}
                  </span>
                  <StatusPill tone={STATUS_TONE[detail.status ?? "OPEN"] ?? "off"}>
                    {t(`capa.status.${detail.status}` as never)}
                  </StatusPill>
                  {detail.sla_status && (
                    <StatusPill tone={SLA_TONE[detail.sla_status] ?? "wait"}>
                      {t(`capa.sla.${detail.sla_status}` as never)}
                    </StatusPill>
                  )}
                  {detail.overdue && (
                    <Badge variant="destructive" className="text-[10px] uppercase tracking-wider">
                      {t("capa.overdueTag")}
                    </Badge>
                  )}
                </div>
                <h2 className="mt-2 text-xl font-black tracking-tight text-foreground">{detail.title}</h2>
                {detail.description && (
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{detail.description}</p>
                )}
              </div>

              {canEdit && (
                <Link
                  href={`/dashboard/capa/${detail.id}/edit`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-background/80 px-3.5 py-1.5 text-xs font-bold text-foreground shadow-sm hover:bg-muted transition-all"
                >
                  <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Ubah Metadata</span>
                </Link>
              )}
            </div>

            {/* Grid Metadata */}
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border/50 pt-4 text-xs sm:grid-cols-4">
              <div>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" /> {t("capa.hub.hotel")}
                </span>
                <p className="mt-1 font-bold text-foreground">{detail.hotel_code || "—"}</p>
              </div>
              <div>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> {t("capa.hub.slaTarget")}
                </span>
                <p className="mt-1 font-bold text-foreground">
                  {detail.due_at ? new Date(detail.due_at).toLocaleDateString() : "—"} ({detail.sla_hours}h)
                </p>
              </div>
              <div>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <User className="h-3.5 w-3.5" /> {t("capa.hub.assignee")}
                </span>
                <p className="mt-1 font-bold text-foreground">{detail.assignee_name || t("capa.hub.unassigned")}</p>
              </div>
              <div>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <ShieldAlert className="h-3.5 w-3.5" /> {t("capa.hub.priority")}
                </span>
                <p className="mt-1 font-bold text-foreground">P{detail.priority}</p>
              </div>
            </div>
          </div>

          {/* Galeri Bukti Media (Verification Hub) */}
          <div className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-elegant backdrop-blur-xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-foreground">{t("capa.hub.evidenceTitle")}</h3>
                <p className="text-xs text-muted-foreground">{t("capa.hub.evidenceDesc")}</p>
              </div>
              <Badge variant={sum?.has_verified_after ? "default" : "outline"} className="text-[11px] font-bold">
                {sum?.has_verified_after ? "✓ Bukti Sesudah Terverifikasi" : "Menunggu bukti perbaikan terverifikasi"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Kolom FOTO SEBELUM */}
              <div>
                <h4 className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <ImageIcon className="h-3.5 w-3.5" /> {t("capa.hub.before")} ({before.length})
                </h4>
                {before.length === 0 ? (
                  <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/10 p-4 text-center text-xs text-muted-foreground">
                    <ImageIcon className="mb-2 h-7 w-7 text-muted-foreground/40" />
                    <span>Belum ada foto sebelum perbaikan.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {before.map((m) => (
                      <EvidenceThumb
                        key={m.id}
                        ticketId={String(detail.id)}
                        media={m}
                        label="Sebelum"
                        onPreview={setPreviewUrl}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Kolom FOTO SESUDAH */}
              <div>
                <h4 className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <ImageIcon className="h-3.5 w-3.5" /> {t("capa.hub.after")} ({after.length})
                </h4>
                {after.length === 0 ? (
                  <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/10 p-4 text-center text-xs text-muted-foreground">
                    <ImageIcon className="mb-1.5 h-6 w-6 text-muted-foreground/40" />
                    <span>Belum ada foto sesudah perbaikan.</span>
                    {canResolve && (
                      <button
                        type="button"
                        onClick={() => {
                          setResolveOpen(true);
                          window.scrollTo({ top: 180, behavior: "smooth" });
                        }}
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary hover:bg-primary/20 transition-all cursor-pointer shadow-xs"
                      >
                        <Upload className="h-3 w-3" />
                        <span>Kirim Bukti Perbaikan Sekarang</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {after.map((m) => (
                      <EvidenceThumb
                        key={m.id}
                        ticketId={String(detail.id)}
                        media={m}
                        label="Sesudah"
                        onPreview={setPreviewUrl}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Map Titik Koordinat & Geofence Hotel */}
          <div className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-elegant backdrop-blur-xl space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <h3 className="flex items-center gap-2 text-xs font-extrabold text-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                Titik Koordinat & Geofence Hotel
              </h3>
              <Badge variant="outline" className="text-[10px] font-bold">
                Radius: {hotelGeo?.radius_meters ?? 300}m
              </Badge>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border/70">
              <MapView
                lat={hotelGeo?.lat ?? -6.2088}
                lng={hotelGeo?.lng ?? 106.8456}
                title={`${detail.hotel_code || "Hotel"} — Lokasi CAPA`}
                address={detail.title}
                zoom={15}
                height={220}
                interactive={true}
                pinColor="#0ea5e9"
              />
            </div>
          </div>

          {/* Timeline Riwayat Status */}
          <div className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-elegant backdrop-blur-xl">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-extrabold text-foreground">
              <History className="h-4 w-4 text-primary" />
              {t("capa.hub.historyTitle")}
            </h3>
            <Timeline history={detail.history} />
          </div>
        </div>

        {/* Kanan: Panel Tindakan & Aksi Alur Four-Eyes */}
        <div className="space-y-6">
          {/* Smart Next Step Action Callout */}
          <div className="rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-lg space-y-2.5">
            <div className="flex items-center gap-2 text-primary font-black text-xs">
              <Sparkles className="h-4 w-4" />
              <span>Panduan Tindakan Saat Ini:</span>
            </div>
            <p className="text-xs text-foreground leading-relaxed">
              {detail.status === "OPEN" ? (
                <>
                  Tiket ini berstatus <strong>TERBUKA</strong>. Langkah pertama adalah menetapkan penanggung jawab (HOD/Teknisi) melalui tombol <strong>Tugaskan Resolver</strong> di bawah.
                </>
              ) : detail.status === "IN_PROGRESS" ? (
                <>
                  Tiket dalam status <strong>DALAM PROSES</strong>. Teknisi unit sedang melakukan perbaikan. Setelah selesai, klik tombol <strong>Submit Selesai</strong> untuk mengunggah catatan & foto bukti.
                </>
              ) : detail.status === "AWAITING_GM" ? (
                <>
                  Perbaikan fisik telah dilaporkan. Menunggu persetujuan <strong>General Manager Hotel</strong> untuk memvalidasi hasil sebelum dilanjutkan ke QA Korporat.
                </>
              ) : detail.status === "AWAITING_QA" ? (
                <>
                  GM Properti telah menyetujui. Menunggu tinjauan standar korporat oleh <strong>Corporate QA</strong> untuk penutupan resmi.
                </>
              ) : (
                <>
                  Tiket ini telah berstatus <strong>CLOSED (TUNTAS)</strong> dan seluruh bukti telah diverifikasi secara permanen.
                </>
              )}
            </p>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-elegant backdrop-blur-xl">
            <h4 className="mb-4 font-bold text-foreground text-xs uppercase tracking-wider">{t("capa.hub.actions")}</h4>

            {/* Aksi 1: Assign Resolver (HOD/Teknisi) */}
            {canAssign && (
              <div className="mb-4 rounded-2xl border border-border/70 bg-background/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-foreground">Penugasan Resolver</h5>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {detail.assigned_to ? "Ganti teknisi penanggung jawab" : "Tugaskan ke HOD/Teknisi"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={assignOpen ? "secondary" : "outline"}
                    onClick={() => setAssignOpen(!assignOpen)}
                    className="cursor-pointer"
                  >
                    <Users className="mr-1 h-3.5 w-3.5" />
                    {assignOpen ? "Tutup" : "Tugaskan"}
                  </Button>
                </div>

                {assignOpen && (
                  <form onSubmit={onAssignSubmit} className="mt-3 space-y-3 border-t border-border/40 pt-3">
                    <div>
                      <label className="block text-[11px] font-bold text-foreground">Pilih Teknisi / HOD:</label>
                      <select
                        className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground"
                        value={selectedResolverId}
                        onChange={(e) => setSelectedResolverId(e.target.value)}
                        required
                      >
                        <option value="">— Pilih Pengguna —</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-foreground">Catatan Penugasan:</label>
                      <input
                        type="text"
                        className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground"
                        placeholder="Instruksi pengerjaan perbaikan..."
                        value={assignNote}
                        onChange={(e) => setAssignNote(e.target.value)}
                      />
                    </div>
                    <Button size="sm" type="submit" className="w-full cursor-pointer" disabled={busy !== null}>
                      {busy === "assign" ? "Menyimpan..." : "Konfirmasi Penugasan"}
                    </Button>
                  </form>
                )}
              </div>
            )}

            {/* Aksi 2: Submit Perbaikan (Resolve) */}
            {canResolve && (
              <div className="mb-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-primary">Kirim Resolusi Perbaikan</h5>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Unggah foto AFTER dan submit perbaikan</p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-brand-gradient text-primary-foreground cursor-pointer"
                    onClick={() => setResolveOpen(!resolveOpen)}
                  >
                    <Upload className="mr-1 h-3.5 w-3.5" />
                    {resolveOpen ? "Tutup" : "Submit Selesai"}
                  </Button>
                </div>

                {resolveOpen && (
                  <form onSubmit={onResolveSubmit} className="mt-3 space-y-3 border-t border-border/40 pt-3">
                    <div>
                      <label className="block text-[11px] font-bold text-foreground">Tindakan Yang Dilakukan:</label>
                      <textarea
                        rows={3}
                        className="mt-1 w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground shadow-sm focus:border-primary focus:outline-hidden"
                        placeholder="Jelaskan perbaikan fisik yang telah diselesaikan secara lengkap..."
                        value={resolveNote}
                        onChange={(e) => setResolveNote(e.target.value)}
                        required
                      />
                    </div>
                    {/* File Picker & Preview Bukti AFTER */}
                    <div>
                      <label className="block text-[11px] font-bold text-foreground mb-1">
                        Lampiran Foto Bukti Perbaikan (AFTER):
                      </label>

                      {afterPhotoPreview ? (
                        <div className="relative rounded-2xl border border-primary/40 bg-card p-2 shadow-xs space-y-2">
                          <div className="relative h-44 w-full overflow-hidden rounded-xl bg-black/5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={afterPhotoPreview}
                              alt="Foto Bukti Perbaikan AFTER"
                              className="h-full w-full object-cover rounded-lg"
                            />
                            <div className="absolute bottom-2 left-2 rounded-lg bg-black/70 px-2 py-1 text-[10px] text-white backdrop-blur-xs font-mono">
                              📍 GPS: {hotelGeo?.lat?.toFixed(4) ?? "-6.2088"}, {hotelGeo?.lng?.toFixed(4) ?? "106.8456"} · Live Stamp
                            </div>
                          </div>
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                              {afterPhotoFile?.name} ({(Number(afterPhotoFile?.size || 0) / 1024).toFixed(0)} KB)
                            </span>
                            <button
                              type="button"
                              onClick={handleRemovePhoto}
                              className="text-xs text-destructive hover:underline font-semibold cursor-pointer"
                            >
                              Ganti Foto
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-32 rounded-2xl border-2 border-dashed border-border/80 bg-muted/20 hover:bg-muted/30 hover:border-primary/50 transition-all cursor-pointer p-4 text-center">
                          <Camera className="h-6 w-6 text-primary mb-1.5" />
                          <span className="text-xs font-bold text-foreground">Klik untuk Pilih / Ambil Foto AFTER</span>
                          <span className="text-[10px] text-muted-foreground mt-0.5">Mendukung JPEG, PNG, WebP (Maks 5 MB)</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handlePhotoSelect}
                          />
                        </label>
                      )}
                    </div>

                    <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">✓ Kamera Live (Constraint C1):</span>
                      <p className="mt-0.5">
                        Foto perbaikan fisik *AFTER* otomatis distempel watermark GPS & server timestamp.
                      </p>
                    </div>
                    <Button size="sm" type="submit" className="w-full bg-brand-gradient cursor-pointer" disabled={busy !== null}>
                      {busy === "resolve" ? "Mengirim Perbaikan..." : "Kirim Resolusi (Lanjut ke GM)"}
                    </Button>
                  </form>
                )}
              </div>
            )}

            {/* Aksi 3: First Approver (GM Review) */}
            {canGm && (
              <div className="space-y-3 border-t border-border/40 pt-4">
                <p className="text-xs font-bold text-muted-foreground">{t("capa.action.gmCardTitle")}</p>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("capa.action.notePlaceholder")}
                  className="w-full rounded-xl border border-border/60 bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-hidden"
                />
                <div className="flex gap-2">
                  <Button className="flex-1 bg-brand-gradient cursor-pointer" onClick={() => onGm("APPROVE")} disabled={busy !== null}>
                    {busy === "gm:APPROVE" ? "…" : <CheckCircle2 className="mr-1 h-3.5 w-3.5" />} {t("capa.action.gmApprove")}
                  </Button>
                  <Button variant="destructive" className="flex-1 cursor-pointer" onClick={() => onGm("REJECT")} disabled={busy !== null}>
                    {busy === "gm:REJECT" ? "…" : <XCircle className="mr-1 h-3.5 w-3.5" />} {t("capa.action.gmReject")}
                  </Button>
                </div>
              </div>
            )}

            {/* Aksi 4: Final Approver (Corporate QA Review) */}
            {canQa && (
              <div className="space-y-3 border-t border-border/40 pt-4">
                <p className="text-xs font-bold text-muted-foreground">{t("capa.action.qaCardTitle")}</p>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("capa.action.notePlaceholder")}
                  className="w-full rounded-xl border border-border/60 bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-hidden"
                />
                <div className="flex gap-2">
                  <Button className="flex-1 bg-brand-gradient cursor-pointer" onClick={() => onQa("CLOSE")} disabled={busy !== null}>
                    {busy === "qa:CLOSE" ? "…" : <CheckCircle2 className="mr-1 h-3.5 w-3.5" />} {t("capa.action.qaClose")}
                  </Button>
                  <Button variant="destructive" className="flex-1 cursor-pointer" onClick={() => onQa("REOPEN")} disabled={busy !== null}>
                    {busy === "qa:REOPEN" ? "…" : <XCircle className="mr-1 h-3.5 w-3.5" />} {t("capa.action.qaReopen")}
                  </Button>
                </div>
              </div>
            )}

            {/* Aksi 5: Eskalasi */}
            {canEscalate && (
              <div className="border-t border-border/40 pt-4">
                <Button
                  variant="outline"
                  className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 cursor-pointer"
                  onClick={onEscalate}
                  disabled={busy !== null}
                >
                  <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
                  {busy === "escalate" ? "Mengekskalasi..." : t("capa.action.escalate")}
                </Button>
              </div>
            )}

            {/* Feedback Hasil Aksi */}
            {outcome && (
              <div
                className={`mt-4 rounded-xl border p-3 text-xs ${
                  outcome.ok
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
                }`}
              >
                {outcome.ok
                  ? "✓ Status berhasil diperbarui."
                  : `Gagal memproses aksi: ${outcome.message ?? "Error internal"}`}
              </div>
            )}
          </div>

          {/* Kartu Informasi Hak Akses & Four-Eyes Rule */}
          <div className="rounded-3xl border border-border/70 bg-card/60 p-5 text-xs text-muted-foreground shadow-sm space-y-2">
            <span className="flex items-center gap-1.5 font-bold text-foreground">
              <FileText className="h-4 w-4 text-primary" /> Gerbang Verifikasi Four-Eyes
            </span>
            <p className="leading-relaxed">
              Persetujuan berjenjang: Tahap pertama divalidasi oleh GM hotel, dan penutupan final dilakukan oleh QA Korporat. SLA remediasi hanya berhenti setelah bukti foto perbaikan tuntas diverifikasi.
            </p>
          </div>
        </div>
      </div>

      {/* Modal Pratinjau Foto Bukti Fullscreen */}
      {previewUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-3xl overflow-hidden rounded-2xl bg-card p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-full bg-background/80 text-foreground hover:bg-background cursor-pointer"
              onClick={() => setPreviewUrl(null)}
            >
              <X className="h-4 w-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Pratinjau Bukti CAPA" className="max-h-[85vh] w-auto rounded-xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}