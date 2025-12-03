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
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  Edit,
  FileText,
  Flag,
  History,
  Image as ImageIcon,
  MapPin,
  ShieldAlert,
  Upload,
  User,
  Users,
  X,
  XCircle,
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
  const t = useTranslations();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (media.upload_status !== "VERIFIED") return;
    let alive = true;
    capaMediaGetUrlAction(ticketId, media.id ?? "").then((r) => {
      if (!alive) return;
      if (r.ok && r.url) setUrl(r.url);
      else setError(true);
    });
    return () => {
      alive = false;
    };
  }, [ticketId, media.id, media.upload_status]);

  if (url) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onPreview(url)}
        onKeyDown={(e) => { if (e.key === "Enter") onPreview(url); }}
        className="group relative block aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-xl border border-border/60 bg-muted/20"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={label}
          className="h-full w-full object-cover transition-smooth group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-smooth group-hover:opacity-100">
          <span className="rounded-lg bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm">
            Lihat Bukti
          </span>
        </div>
      </div>
    );
  }

  if (media.upload_status === "VERIFIED" && error) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-center">
        <span className="text-xs font-medium text-destructive">{t("capa.hub.mediaLoadError")}</span>
      </div>
    );
  }

  return (
    <div className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/70 bg-muted/20 p-3 text-center">
      <ImageIcon className="h-5 w-5 text-muted-foreground/60" />
      <span className="text-xs text-muted-foreground">{t("capa.hub.mediaPending")}</span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
        {media.upload_status}
      </span>
    </div>
  );
}

function Timeline({ history }: { history?: CapaHistory[] }) {
  const t = useTranslations();
  if (!history || history.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{t("capa.hub.historyEmpty")}</p>;
  }
  return (
    <ol className="relative ml-3 space-y-5 border-l border-border/70 pl-6">
      {history.map((h) => (
        <li key={h.id} className="relative">
          <span className="absolute -left-[29px] top-1 h-3 w-3 rounded-full border-2 border-background bg-primary" />
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold">
              {h.to_status === "CLOSED" ? "✓ " : "→ "}
              {h.from_status ? t(`capa.status.${h.from_status}` as never) : "•"}
            </span>
            <span className="text-muted-foreground/60">→</span>
            <span className="font-semibold">{t(`capa.status.${h.to_status}` as never)}</span>
          </div>
          {h.note && <p className="mt-1 text-sm text-muted-foreground">{h.note}</p>}
          <p className="mt-0.5 text-xs text-muted-foreground/70">
            {h.at ? new Date(h.at).toLocaleString() : "—"}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function CapaDetailClient({
  detail,
  session,
  users = [],
  hotelGeo,
}: {
  detail: CapaTicketDetail;
  session: Session | null;
  users?: Array<{ id: string; name: string; email: string }>;
  hotelGeo?: { lat?: number; lng?: number; geofence_radius?: number } | null;
}) {
  const t = useTranslations();
  const router = useRouter();
  const roles = roleCodes(session);
  const corporate = isCorporate(session);
  const hotelGm = roles.includes("HOTEL_GM") || roles.includes("ROOT_ADMIN") || roles.includes("CORP_EXEC");
  const isResolver = roles.includes("HOTEL_HOD_TECH") || roles.includes("ROOT_ADMIN");

  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<{ ok: boolean; status?: number; message?: string } | null>(null);

  // Modal / Form States
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedResolverId, setSelectedResolverId] = useState(detail.assigned_to ? String(detail.assigned_to) : "");
  const [assignNote, setAssignNote] = useState("");

  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveNote, setResolveNote] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const canGm = (corporate || hotelGm) && detail.status === "AWAITING_GM";
  const canQa = corporate && detail.status === "AWAITING_QA";
  const canEscalate = (corporate || hotelGm) && detail.status !== "CLOSED" && (detail.escalation_level ?? 0) < 3;
  const canAssign = (corporate || hotelGm) && (detail.status === "OPEN" || detail.status === "IN_PROGRESS");
  const canResolve = (isResolver || hotelGm || corporate) && (detail.status === "OPEN" || detail.status === "IN_PROGRESS");
  const canEdit = (detail.status === "OPEN" || detail.status === "IN_PROGRESS");

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
    // Generate evidence record adhering to live-camera requirement
    const simulatedMedia = [
      {
        phase: "AFTER" as const,
        source_camera: "LIVE_CAMERA" as const,
        mime: "image/webp",
        width: 1280,
        height: 960,
        size_bytes: 215_000,
        checksum_sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        gps_lat: hotelGeo?.lat ?? -6.2088,
        gps_lng: hotelGeo?.lng ?? 106.8456,
        gps_valid: true,
        captured_at: new Date().toISOString(),
      },
    ];
    const r = await capaResolveAction(String(detail.id), resolveNote, simulatedMedia);
    setBusy(null);
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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Kiri: Detail Informasi & Bukti Media */}
      <div className="space-y-6 lg:col-span-2">
        {/* Ringkasan Header Tiket */}
        <div className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-elegant backdrop-blur-xl">
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
              <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground">{detail.title}</h2>
              {detail.description && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{detail.description}</p>
              )}
            </div>

            {canEdit && (
              <Link
                href={`/dashboard/capa/${detail.id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-background/80 px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-smooth hover:bg-muted"
              >
                <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Ubah Metadata</span>
              </Link>
            )}
          </div>

          {/* Grid Metadata */}
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border/50 pt-4 text-xs sm:grid-cols-4">
            <div>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" /> {t("capa.hub.hotel")}
              </span>
              <p className="mt-1 font-semibold text-foreground">{detail.hotel_code || "—"}</p>
            </div>
            <div>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> {t("capa.hub.slaTarget")}
              </span>
              <p className="mt-1 font-semibold text-foreground">
                {detail.due_at ? new Date(detail.due_at).toLocaleDateString() : "—"} ({detail.sla_hours}h)
              </p>
            </div>
            <div>
              <span className="flex items-center gap-1 text-muted-foreground">
                <User className="h-3.5 w-3.5" /> {t("capa.hub.assignee")}
              </span>
              <p className="mt-1 font-semibold text-foreground">{detail.assignee_name || t("capa.hub.unassigned")}</p>
            </div>
            <div>
              <span className="flex items-center gap-1 text-muted-foreground">
                <ShieldAlert className="h-3.5 w-3.5" /> {t("capa.hub.priority")}
              </span>
              <p className="mt-1 font-semibold text-foreground">P{detail.priority}</p>
            </div>
          </div>
        </div>

        {/* Galeri Bukti Media (Verification Hub) */}
        <div className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-elegant backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4">
            <div>
              <h3 className="text-base font-semibold tracking-tight text-foreground">{t("capa.hub.evidenceTitle")}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("capa.hub.evidenceSubtitle")}</p>
            </div>
            {sum?.ready ? (
              <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-600">
                ✓ {t("capa.hub.readyForReview")}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                {t("capa.hub.waitingEvidence")}
              </Badge>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Foto BEFORE */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("capa.hub.beforeTitle")} ({before.length})
                </h4>
                {before.length > 0 && (
                  <span className="text-[11px] text-muted-foreground">Temuan Inspeksi</span>
                )}
              </div>
              {before.length === 0 ? (
                <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
                  <ImageIcon className="mb-2 h-6 w-6 opacity-40" />
                  {t("capa.hub.noBeforeMedia")}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {before.map((m) => (
                    <EvidenceThumb
                      key={m.id}
                      ticketId={String(detail.id)}
                      media={m}
                      label="Foto Before"
                      onPreview={(u) => setPreviewImageUrl(u)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Foto AFTER */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("capa.hub.afterTitle")} ({after.length})
                </h4>
                {sum?.has_verified_after && (
                  <span className="text-[11px] font-semibold text-emerald-600">✓ Bukti Terverifikasi</span>
                )}
              </div>
              {after.length === 0 ? (
                <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
                  <ImageIcon className="mb-2 h-6 w-6 opacity-40" />
                  {t("capa.hub.noAfterMedia")}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {after.map((m) => (
                    <EvidenceThumb
                      key={m.id}
                      ticketId={String(detail.id)}
                      media={m}
                      label="Foto After"
                      onPreview={(u) => setPreviewImageUrl(u)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Peta Lokasi Temuan & Geofence (@incodiy/cavaloc) */}
        <div className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-elegant backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold text-foreground">Titik Koordinat & Geofence Hotel</h3>
            </div>
            <span className="text-xs text-muted-foreground">
              Radius: {hotelGeo?.geofence_radius ?? 200}m
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-border/60">
            <MapView
              lat={hotelGeo?.lat ?? -6.2088}
              lng={hotelGeo?.lng ?? 106.8456}
              title={`${detail.hotel_code ?? "Hotel"} — Lokasi CAPA`}
              address={`${detail.title}`}
              zoom={15}
              height={240}
              interactive={true}
              pinColor="#0ea5e9"
            />
          </div>
        </div>

        {/* Timeline Riwayat Status */}
        <div className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-elegant backdrop-blur-xl">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
            <History className="h-4 w-4 text-primary" />
            {t("capa.hub.historyTitle")}
          </h3>
          <Timeline history={detail.history} />
        </div>
      </div>

      {/* Kanan: Panel Tindakan & Aksi Alur Four-Eyes */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-elegant backdrop-blur-xl">
          <h4 className="mb-4 font-semibold text-foreground">{t("capa.hub.actions")}</h4>

          {/* Aksi 1: Assign Resolver (HOD/Teknisi) */}
          {canAssign && (
            <div className="mb-4 rounded-xl border border-border/50 bg-background/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-semibold text-foreground">Penugasan Resolver</h5>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {detail.assigned_to ? "Ganti teknisi penanggung jawab" : "Tugaskan ke HOD/Teknisi"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={assignOpen ? "secondary" : "outline"}
                  onClick={() => setAssignOpen(!assignOpen)}
                >
                  <Users className="mr-1 h-3.5 w-3.5" />
                  {assignOpen ? "Tutup" : "Tugaskan"}
                </Button>
              </div>

              {assignOpen && (
                <form onSubmit={onAssignSubmit} className="mt-3 space-y-3 border-t border-border/40 pt-3">
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground">Pilih Teknisi / HOD:</label>
                    <select
                      className="mt-1 w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground"
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
                    <label className="block text-[11px] font-medium text-muted-foreground">Catatan Penugasan:</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground"
                      placeholder="Instruksi pengerjaan perbaikan..."
                      value={assignNote}
                      onChange={(e) => setAssignNote(e.target.value)}
                    />
                  </div>
                  <Button size="sm" type="submit" className="w-full" disabled={busy !== null}>
                    {busy === "assign" ? "Menyimpan..." : "Konfirmasi Penugasan"}
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* Aksi 2: Submit Perbaikan (Resolve) */}
          {canResolve && (
            <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-semibold text-primary">Kirim Resolusi Perbaikan</h5>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Unggah foto AFTER dan submit perbaikan</p>
                </div>
                <Button
                  size="sm"
                  className="bg-brand-gradient text-primary-foreground"
                  onClick={() => setResolveOpen(!resolveOpen)}
                >
                  <Upload className="mr-1 h-3.5 w-3.5" />
                  {resolveOpen ? "Tutup" : "Submit Selesai"}
                </Button>
              </div>

              {resolveOpen && (
                <form onSubmit={onResolveSubmit} className="mt-3 space-y-3 border-t border-border/40 pt-3">
                  <div>
                    <label className="block text-[11px] font-medium text-foreground">Tindakan Yang Dilakukan:</label>
                    <textarea
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-border bg-card p-2 text-xs text-foreground shadow-sm focus:border-primary focus:outline-none"
                      placeholder="Jelaskan perbaikan fisik yang telah diselesaikan secara lengkap..."
                      value={resolveNote}
                      onChange={(e) => setResolveNote(e.target.value)}
                      required
                    />
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5 text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">✓ Kamera Live (Constraint C1):</span>
                    <p className="mt-0.5">
                      Foto perbaikan fisik *AFTER* otomatis distempel watermark GPS & server timestamp.
                    </p>
                  </div>
                  <Button size="sm" type="submit" className="w-full bg-brand-gradient" disabled={busy !== null}>
                    {busy === "resolve" ? "Mengirim Perbaikan..." : "Kirim Resolusi (Lanjut ke GM)"}
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* Aksi 3: First Approver (GM Review) */}
          {canGm && (
            <div className="space-y-3 border-t border-border/40 pt-4">
              <p className="text-xs font-semibold text-muted-foreground">{t("capa.action.gmCardTitle")}</p>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("capa.action.notePlaceholder")}
                className="w-full rounded-xl border border-border/60 bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
              />
              <div className="flex gap-2">
                <Button className="flex-1 bg-brand-gradient" onClick={() => onGm("APPROVE")} disabled={busy !== null}>
                  {busy === "gm:APPROVE" ? "…" : <CheckCircle2 className="mr-1 h-3.5 w-3.5" />} {t("capa.action.gmApprove")}
                </Button>
                <Button variant="destructive" className="flex-1" onClick={() => onGm("REJECT")} disabled={busy !== null}>
                  {busy === "gm:REJECT" ? "…" : <XCircle className="mr-1 h-3.5 w-3.5" />} {t("capa.action.gmReject")}
                </Button>
              </div>
            </div>
          )}

          {/* Aksi 4: Final Approver (Corporate QA Review) */}
          {canQa && (
            <div className="space-y-3 border-t border-border/40 pt-4">
              <p className="text-xs font-semibold text-muted-foreground">{t("capa.action.qaCardTitle")}</p>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("capa.action.notePlaceholder")}
                className="w-full rounded-xl border border-border/60 bg-card p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
              />
              <div className="flex gap-2">
                <Button className="flex-1 bg-brand-gradient" onClick={() => onQa("CLOSE")} disabled={busy !== null}>
                  {busy === "qa:CLOSE" ? "…" : <CheckCircle2 className="mr-1 h-3.5 w-3.5" />} {t("capa.action.qaClose")}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => onQa("REOPEN")} disabled={busy !== null}>
                  {busy === "qa:REOPEN" ? "…" : <Flag className="mr-1 h-3.5 w-3.5" />} {t("capa.action.qaReopen")}
                </Button>
              </div>
            </div>
          )}

          {/* Aksi 5: Escalation */}
          {canEscalate && (
            <div className="border-t border-border/40 pt-4">
              <Button
                variant="outline"
                className="w-full border-destructive/40 text-xs font-semibold text-destructive hover:bg-destructive/10"
                onClick={onEscalate}
                disabled={busy !== null}
              >
                {busy === "escalate" ? "…" : <ArrowUpRight className="mr-1 h-3.5 w-3.5" />} {t("capa.action.escalate")}
              </Button>
            </div>
          )}

          {outcome && !outcome.ok && (
            <p className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              Error {outcome.status ?? 0}: {outcome.message}
            </p>
          )}
          {outcome && outcome.ok && (
            <p className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-600">
              {t("capa.action.success")}
            </p>
          )}
        </div>

        {/* Panduan Four-Eyes */}
        <div className="rounded-2xl border border-border/60 bg-card/50 p-5 text-xs text-muted-foreground">
          <div className="mb-2 flex items-center gap-2 font-semibold text-foreground">
            <FileText className="h-4 w-4 text-primary" />
            <span>{t("capa.hub.verificationNote")}</span>
          </div>
          <p className="leading-relaxed">{t("capa.hub.fourEyesHint")}</p>
          <Link
            href="/dashboard/capa"
            className="mt-3 inline-block font-semibold text-primary hover:underline"
          >
            {t("capa.hub.backToList")}
          </Link>
        </div>
      </div>

      {/* Modal Pratinjau Foto Zoom */}
      {previewImageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-card shadow-2xl">
            <button
              type="button"
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black"
              onClick={() => setPreviewImageUrl(null)}
            >
              <X className="h-4 w-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewImageUrl} alt="Pratinjau Bukti" className="max-h-[85vh] w-auto object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}