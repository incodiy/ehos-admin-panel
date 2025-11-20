"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CavaForm, type FieldSchema } from "@incodiy/cavaform";
import {
  ListChecks,
  ArrowLeft,
  ShieldAlert,
  Info,
  CheckCircle2,
  Lock,
  Archive,
  GitFork,
  Trash2,
  Plus,
  Layers,
  Sparkles,
  AlertTriangle,
  FileCheck2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Pencil,
} from "lucide-react";
import type { components } from "@/lib/api/openapi";
import {
  configLockTemplateAction,
  configNewVersionAction,
  configArchiveTemplateAction,
  configDeleteTemplateAction,
  configAddSectionAction,
  configDeleteSectionAction,
  configAddItemAction,
  configUpdateItemAction,
  configDeleteItemAction,
  type RubricType,
} from "@/app/actions/config";
import { StatusPill } from "@/components/admin/data-table";

type TemplateDetail = components["schemas"]["TemplateDetail"];
type SectionWithItems = components["schemas"]["TemplateDetail"]["sections"][number];
type ChecklistItem = NonNullable<SectionWithItems["items"]>[number];

interface ChecklistEditClientProps {
  templateDetail: TemplateDetail;
  returnTo?: string;
}

const STATUS_TONE: Record<string, "on" | "wait" | "off"> = {
  LOCKED: "on",
  DRAFT: "wait",
  ARCHIVED: "off",
};

const RUBRIC_BADGES: Record<string, { label: string; cls: string }> = {
  TRAFFIC_LIGHT: { label: "Traffic Light (90/45/0)", cls: "bg-rose-500/15 text-rose-600 dark:text-rose-400" },
  NUMERIC_SCALE: { label: "Numeric Scale (0-100)", cls: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
  MULTI_ROOM: { label: "Multi-Room (Sampling)", cls: "bg-violet-500/15 text-violet-600 dark:text-violet-400" },
  BINARY_COUNT: { label: "Binary Count (1/0)", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
};

export function ChecklistEditClient({ templateDetail, returnTo }: ChecklistEditClientProps) {
  const router = useRouter();
  const template = templateDetail.template;
  const sections = templateDetail.sections || [];

  const isDraft = template.status === "DRAFT";
  const isLocked = template.status === "LOCKED";
  const isArchived = template.status === "ARCHIVED";

  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals & Panels
  const [showAddSection, setShowAddSection] = useState(false);
  const [addItemForSection, setAddItemForSection] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{ sectionId: string; item: ChecklistItem } | null>(null);
  const [showForkModal, setShowForkModal] = useState(false);
  const [forkVersionInput, setForkVersionInput] = useState("");
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);
  const [showLifecycleGuide, setShowLifecycleGuide] = useState(true);

  // Expand / collapse state for sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    sections.forEach((sec) => {
      initial[sec.id] = true;
    });
    return initial;
  });

  const toggleSection = (secId: string) => {
    setExpandedSections((prev) => ({ ...prev, [secId]: !prev[secId] }));
  };

  // Telemetry Calculations
  const totalSections = sections.length;
  const totalItems = sections.reduce((acc, s) => acc + (s.items?.length || 0), 0);
  const totalWeight = sections.reduce(
    (acc, s) => acc + (s.items?.reduce((w, i) => w + (Number(i.weight) || 0), 0) || 0),
    0
  );
  const lifeSafetyItems = sections.reduce(
    (acc, s) => acc + (s.items?.filter((i) => i.is_life_safety).length || 0),
    0
  );

  // Section CavaForm Schema
  const sectionFields: FieldSchema[] = [
    {
      name: "code",
      label: "Kode Section (Unik)",
      type: "text",
      placeholder: "Contoh: SEC-01, HK-ROOM",
      validation: { required: true, minLength: 1, maxLength: 50 },
    },
    {
      name: "name",
      label: "Nama Bagian / Kategori Inspeksi",
      type: "text",
      placeholder: "Contoh: Kebersihan Area Kamar Tidur",
      validation: { required: true, minLength: 1, maxLength: 255 },
    },
    {
      name: "sort_order",
      label: "Urutan Tampil (Sort Order)",
      type: "number",
      defaultValue: (totalSections + 1) * 10,
    },
  ];

  // Item CavaForm Schema
  const itemFields: FieldSchema[] = [
    {
      name: "code",
      label: "Kode Butir Pertanyaan",
      type: "text",
      placeholder: "Contoh: HK.01, SEC.04",
      validation: { required: true, minLength: 1, maxLength: 50 },
    },
    {
      name: "question_text",
      label: "Teks Standar / Pertanyaan Inspeksi",
      type: "textarea",
      placeholder: "Deskripsikan standar spesifik yang wajib dipenuhi oleh unit hotel...",
      validation: { required: true, minLength: 3 },
    },
    {
      name: "rubric_type",
      label: "Jenis Rubrik Penilaian (PRD-F-01)",
      type: "select",
      options: [
        { label: "Traffic Light (90: Yes, 45: Review, 0: No)", value: "TRAFFIC_LIGHT" },
        { label: "Numeric Scale (Nilai terukur / persentase, 0-100)", value: "NUMERIC_SCALE" },
        { label: "Multi-Room (Sampling multi-kamar, kelipatan 90)", value: "MULTI_ROOM" },
        { label: "Binary Count (1: Ada / Sesuai, 0: Tidak Ada)", value: "BINARY_COUNT" },
      ],
      validation: { required: true },
      defaultValue: "TRAFFIC_LIGHT",
    },
    {
      name: "max_score",
      label: "Skor Maksimal",
      type: "number",
      placeholder: "90 untuk Traffic Light, 100 untuk Numeric, 1 untuk Binary",
      validation: { required: true },
      defaultValue: 90,
    },
    {
      name: "weight",
      label: "Bobot Pertanyaan (Multiplier)",
      type: "number",
      validation: { required: true },
      defaultValue: 1.0,
    },
    {
      name: "na_allowed",
      label: "Toleransi Pilihan N/A (Bisa Tidak Berlaku)",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "is_life_safety",
      label: "Life-Safety Hazard Flag (PRD-F-03 — Auto Tiket CAPA P1 SLA 1x24 Jam)",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "sort_order",
      label: "Urutan Tampil",
      type: "number",
      defaultValue: 10,
    },
  ];

  // Action Handlers
  const handleLockTemplate = async () => {
    if (!confirm("Apakah Anda yakin ingin mengunci (LOCK) template ini? Setelah dikunci, struktur section dan pertanyaan menjadi permanen (immutable) demi integritas audit historis.")) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      const res = await configLockTemplateAction(template.id);
      if (!res.ok) {
        setErrorMessage(res.message || "Gagal mengunci template.");
      } else {
        setSuccessMessage("Template berhasil dikunci (LOCKED) dan siap digunakan untuk sesi audit.");
        router.refresh();
      }
    } catch {
      setErrorMessage("Terjadi kesalahan jaringan.");
    } finally {
      setBusy(false);
    }
  };

  const handleArchiveTemplate = async () => {
    if (!confirm("Apakah Anda yakin ingin mengarsipkan template ini? Template arsip tidak akan muncul lagi pada opsi pembuatan sesi audit baru.")) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      const res = await configArchiveTemplateAction(template.id);
      if (!res.ok) {
        setErrorMessage(res.message || "Gagal mengarsipkan template.");
      } else {
        setSuccessMessage("Template berhasil diarsipkan (ARCHIVED).");
        router.refresh();
      }
    } catch {
      setErrorMessage("Terjadi kesalahan jaringan.");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteTemplate = async () => {
    setBusy(true);
    setErrorMessage(null);
    try {
      const res = await configDeleteTemplateAction(template.id);
      if (!res.ok) {
        setErrorMessage(res.message || "Gagal menghapus template.");
        setBusy(false);
      } else {
        router.push("/dashboard/config/checklist");
        router.refresh();
      }
    } catch {
      setErrorMessage("Terjadi kesalahan jaringan.");
      setBusy(false);
    }
  };

  const handleForkVersion = async () => {
    if (!forkVersionInput.trim()) {
      alert("Masukkan nomor versi baru.");
      return;
    }
    setBusy(true);
    setErrorMessage(null);
    try {
      const res = await configNewVersionAction(template.id, forkVersionInput.trim());
      if (!res.ok) {
        setErrorMessage(res.message || "Gagal membuat versi baru.");
        setBusy(false);
      } else {
        const created = res.data as { id?: string } | undefined;
        if (created?.id) {
          router.push(`/dashboard/config/checklist/${created.id}/edit`);
        } else {
          router.push("/dashboard/config/checklist");
        }
        router.refresh();
      }
    } catch {
      setErrorMessage("Terjadi kesalahan jaringan.");
      setBusy(false);
    }
  };

  const handleAddSectionSubmit = async (values: Record<string, unknown>) => {
    setBusy(true);
    setErrorMessage(null);
    try {
      const res = await configAddSectionAction(template.id, {
        code: String(values.code || "").trim(),
        name: String(values.name || "").trim(),
        sort_order: Number(values.sort_order || 10),
      });
      if (!res.ok) {
        setErrorMessage(res.message || "Gagal menambahkan section.");
      } else {
        setShowAddSection(false);
        setSuccessMessage("Section berhasil ditambahkan.");
        router.refresh();
      }
    } catch {
      setErrorMessage("Terjadi kesalahan jaringan.");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteSection = async (secId: string) => {
    if (!confirm("Hapus section ini beserta seluruh butir pertanyaannya?")) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      const res = await configDeleteSectionAction(template.id, secId);
      if (!res.ok) {
        setErrorMessage(res.message || "Gagal menghapus section.");
      } else {
        setSuccessMessage("Section berhasil dihapus.");
        router.refresh();
      }
    } catch {
      setErrorMessage("Terjadi kesalahan jaringan.");
    } finally {
      setBusy(false);
    }
  };

  const handleAddItemSubmit = async (values: Record<string, unknown>) => {
    if (!addItemForSection) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      const res = await configAddItemAction(template.id, addItemForSection, {
        code: String(values.code || "").trim(),
        question_text: String(values.question_text || "").trim(),
        rubric_type: String(values.rubric_type || "TRAFFIC_LIGHT") as RubricType,
        max_score: Number(values.max_score || 90),
        weight: Number(values.weight || 1.0),
        na_allowed: Boolean(values.na_allowed),
        is_life_safety: Boolean(values.is_life_safety),
        sort_order: Number(values.sort_order || 10),
      });
      if (!res.ok) {
        setErrorMessage(res.message || "Gagal menambahkan butir pertanyaan.");
      } else {
        setAddItemForSection(null);
        setSuccessMessage("Butir pertanyaan berhasil ditambahkan.");
        router.refresh();
      }
    } catch {
      setErrorMessage("Terjadi kesalahan jaringan.");
    } finally {
      setBusy(false);
    }
  };

  const handleEditItemSubmit = async (values: Record<string, unknown>) => {
    if (!editingItem) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      const res = await configUpdateItemAction(template.id, editingItem.sectionId, editingItem.item.id, {
        question_text: String(values.question_text || "").trim(),
        rubric_type: String(values.rubric_type || editingItem.item.rubric_type) as RubricType,
        max_score: Number(values.max_score || editingItem.item.max_score),
        weight: Number(values.weight || editingItem.item.weight),
        na_allowed: Boolean(values.na_allowed),
        is_life_safety: Boolean(values.is_life_safety),
        sort_order: Number(values.sort_order || editingItem.item.sort_order),
      });
      if (!res.ok) {
        setErrorMessage(res.message || "Gagal memperbarui rubrik butir.");
      } else {
        setEditingItem(null);
        setSuccessMessage("Rubrik butir berhasil diperbarui.");
        router.refresh();
      }
    } catch {
      setErrorMessage("Terjadi kesalahan jaringan.");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteItem = async (secId: string, itemId: string) => {
    if (!confirm("Hapus butir pertanyaan ini?")) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      const res = await configDeleteItemAction(template.id, secId, itemId);
      if (!res.ok) {
        setErrorMessage(res.message || "Gagal menghapus butir pertanyaan.");
      } else {
        setSuccessMessage("Butir pertanyaan berhasil dihapus.");
        router.refresh();
      }
    } catch {
      setErrorMessage("Terjadi kesalahan jaringan.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {returnTo ? (
              <Link
                href={returnTo}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke Sesi Audit
              </Link>
            ) : (
              <Link
                href="/dashboard/config/checklist"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke Bank Checklist
              </Link>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ListChecks className="w-6 h-6 text-primary" />
              {template.name}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted border border-border/60 text-muted-foreground">
              {template.version}
            </span>
            <StatusPill tone={STATUS_TONE[template.status] ?? "wait"}>{template.status}</StatusPill>
          </div>
          <p className="text-xs text-muted-foreground">
            Departemen: <strong className="text-foreground">{template.department}</strong> | Brand Tier:{" "}
            <strong className="text-foreground">{template.brand_tier || "Universal (Semua Tier)"}</strong>
          </p>
        </div>
      </div>

      {/* Alert Messages */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive animate-in fade-in">
          <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold">Pemberitahuan Sistem</p>
            <p className="text-destructive/90">{errorMessage}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-emerald-600 dark:text-emerald-400 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
          <div className="text-sm font-medium">{successMessage}</div>
        </div>
      )}

      {/* Contextual Lifecycle & Usage Guidance Card */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          isLocked
            ? "bg-amber-500/10 border-amber-500/25 text-amber-900 dark:text-amber-200"
            : isDraft
            ? "bg-primary/10 border-primary/25 text-foreground"
            : "bg-muted/30 border-border/60 text-muted-foreground"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 p-2 rounded-xl bg-background/80 shadow-sm shrink-0">
              {isLocked ? (
                <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              ) : isDraft ? (
                <Pencil className="w-5 h-5 text-primary" />
              ) : (
                <Archive className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                {isLocked
                  ? "Template Berstatus LOCKED (Snapshot Resmi Terkunci)"
                  : isDraft
                  ? "Template Berstatus DRAFT (Mode Penyusunan & Revisi)"
                  : "Template Berstatus ARCHIVED (Arsip Standar Historis)"}
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-background/80 border border-border/50">
                  {template.status}
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isLocked
                  ? "Standar audit resmi aktif grup Swiss-Belhotel. Dikunci permanen demi kepatuhan hukum dan integritas data audit historis."
                  : isDraft
                  ? "Anda bebas menambah/mengubah section, butir pertanyaan, bobot, dan rubrik sebelum dikunci."
                  : "Standar versi terdahulu yang dinonaktifkan. Data audit historis tetap tersimpan utuh dan aman."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowLifecycleGuide(!showLifecycleGuide)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 bg-background/80 text-xs font-semibold text-foreground hover:bg-background transition-all shrink-0 self-start sm:self-auto"
          >
            <Info className="w-3.5 h-3.5 text-primary" />
            <span>{showLifecycleGuide ? "Sembunyikan Panduan" : "Pelajari Alur & Cara Edit"}</span>
            {showLifecycleGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expandable Lifecycle Diagram & Step-by-Step Guide */}
        {showLifecycleGuide && (
          <div className="mt-5 pt-4 border-t border-border/40 space-y-4 text-xs animate-in fade-in">
            {/* Visual Lifecycle Diagram */}
            <div className="p-3.5 rounded-xl bg-background/90 border border-border/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                Siklus Hidup (Lifecycle) Master Template di EHOS
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div
                  className={`p-2.5 rounded-lg border ${
                    isDraft ? "border-primary bg-primary/10" : "border-border/60 bg-muted/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">1. DRAFT</span>
                    {isDraft && <span className="text-[10px] font-bold text-primary">● Aktif</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Bebas tambah/edit section & butir pertanyaan. Belum bisa dipakai audit.
                  </p>
                </div>
                <div
                  className={`p-2.5 rounded-lg border ${
                    isLocked ? "border-amber-500 bg-amber-500/10" : "border-border/60 bg-muted/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">2. LOCKED</span>
                    {isLocked && <span className="text-[10px] font-bold text-amber-600">● Aktif</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Snapshot resmi aktif. Terkunci read-only. Dipakai membuat sesi audit.
                  </p>
                </div>
                <div
                  className={`p-2.5 rounded-lg border ${
                    isArchived ? "border-slate-500 bg-slate-500/10" : "border-border/60 bg-muted/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">3. ARCHIVED</span>
                    {isArchived && <span className="text-[10px] font-bold text-muted-foreground">● Aktif</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Standar lama diarsipkan. Tidak muncul di opsi buat audit baru.
                  </p>
                </div>
              </div>
            </div>

            {/* Contextual Action Guide */}
            {isLocked && (
              <div className="p-3.5 rounded-xl bg-background/90 border border-border/60 space-y-2">
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <GitFork className="w-4 h-4 text-primary" />
                  Bagaimana Cara Mengedit atau Menambah Data pada Template LOCKED?
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground leading-relaxed pl-1">
                  <li>
                    <strong className="text-foreground">Langkah 1:</strong> Klik tombol{" "}
                    <strong className="text-foreground">Buka Versi Baru (Fork Version)</strong> di panel kanan dan
                    masukkan nomor versi baru (misal: <code>{template.version}.1</code> atau <code>2027</code>).
                  </li>
                  <li>
                    <strong className="text-foreground">Langkah 2:</strong> Sistem akan menduplikasi struktur template ke
                    versi baru berstatus <strong className="text-foreground">DRAFT</strong>.
                  </li>
                  <li>
                    <strong className="text-foreground">Langkah 3:</strong> Pada versi{" "}
                    <strong className="text-foreground">DRAFT</strong> tersebut, Anda bebas menambah section baru,
                    mengubah butir pertanyaan, bobot, atau scoring rubrik.
                  </li>
                  <li>
                    <strong className="text-foreground">Langkah 4:</strong> Setelah selesai, klik{" "}
                    <strong className="text-foreground">Kunci & Aktifkan Template</strong> agar versi baru resmi berlaku
                    untuk sesi-sesi audit mendatang.
                  </li>
                </ol>
              </div>
            )}

            {isDraft && (
              <div className="p-3.5 rounded-xl bg-background/90 border border-border/60 space-y-2">
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Panduan Penyusunan Template DRAFT:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-muted-foreground leading-relaxed pl-1">
                  <li>
                    Gunakan tombol <strong className="text-foreground">+ Tambah Section</strong> untuk membagi klausul
                    audit ke dalam kategori terstruktur (seperti <em>Linen</em>, <em>Preventive Maintenance</em>, dll.).
                  </li>
                  <li>
                    Gunakan tombol <strong className="text-foreground">+ Tambah Butir</strong> pada masing-masing
                    section untuk menyusun pertanyaan, memilih rubrik (<em>Traffic Light</em>, <em>Binary</em>, dll.),
                    dan menandai butir kritis <strong className="text-red-600">Life Safety</strong>.
                  </li>
                  <li>
                    Setelah seluruh parameter lengkap dan diverifikasi, klik tombol{" "}
                    <strong className="text-foreground">Kunci & Aktifkan Template (Lock Template)</strong> di panel
                    kanan agar template siap digunakan untuk membuat sesi audit.
                  </li>
                </ul>
              </div>
            )}

            {isArchived && (
              <div className="p-3.5 rounded-xl bg-background/90 border border-border/60 space-y-2">
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <Archive className="w-4 h-4 text-muted-foreground" />
                  Informasi Status ARCHIVED:
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Template ini sudah diarsipkan dan tidak lagi digunakan untuk membuat sesi audit baru. Namun seluruh
                  laporan audit terdahulu yang mengacu pada template ini tetap valid dan tersimpan utuh di sistem. Jika
                  Anda ingin menggunakan kembali atau menyempurnakan klausul template ini, klik tombol{" "}
                  <strong className="text-foreground">Buka Versi Baru (Fork Version)</strong> untuk membuat versi turunan
                  baru berstatus <strong className="text-foreground">DRAFT</strong>.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Primary Column (7 cols): Section & Item Builder */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Struktur Bagian & Butir Pertanyaan
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Kelola bagian audit (sections) dan parameter rubrik pertanyaan (items).
              </p>
            </div>
            {isDraft && !showAddSection && (
              <button
                type="button"
                onClick={() => setShowAddSection(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Section
              </button>
            )}
          </div>

          {/* Form Tambah Section */}
          {isDraft && showAddSection && (
            <div className="p-5 rounded-2xl bg-card border border-primary/30 shadow-sm space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" />
                  Form Section Kategori Baru
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddSection(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Batal
                </button>
              </div>
              <CavaForm
                fields={sectionFields}
                onSubmit={handleAddSectionSubmit}
                config={{
                  submitLabel: busy ? "Menyimpan Section..." : "Simpan Section",
                }}
              />
            </div>
          )}

          {/* Section & Items List */}
          {sections.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-border/60 bg-muted/20">
              <ListChecks className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
              <p className="text-sm font-medium text-foreground">Belum ada section yang dibuat</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {isDraft
                  ? "Mulai dengan membuat section kategori audit pertama Anda menggunakan tombol di atas."
                  : "Template ini tidak memiliki section aktif."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map((sec) => {
                const isOpen = expandedSections[sec.id] !== false;
                const items = sec.items || [];

                return (
                  <div
                    key={sec.id}
                    className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm"
                  >
                    {/* Section Header */}
                    <div className="p-4 bg-muted/30 border-b border-border/40 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => toggleSection(sec.id)}
                        className="flex items-center gap-2.5 text-left flex-1 hover:text-primary transition-colors"
                      >
                        {isOpen ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-muted border border-border/60 text-foreground">
                          {sec.code}
                        </span>
                        <span className="text-sm font-semibold text-foreground">{sec.name}</span>
                        <span className="text-xs text-muted-foreground">({items.length} butir)</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {isDraft && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setAddItemForSection(sec.id);
                                setEditingItem(null);
                              }}
                              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              Tambah Butir
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSection(sec.id)}
                              className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title="Hapus Section"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Section Content & Items */}
                    {isOpen && (
                      <div className="p-4 space-y-3">
                        {/* Form Tambah Butir ke Section ini */}
                        {isDraft && addItemForSection === sec.id && (
                          <div className="p-4 rounded-xl bg-muted/20 border border-primary/20 space-y-3 mb-4 animate-in fade-in">
                            <div className="flex items-center justify-between border-b border-border/40 pb-2">
                              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                <Plus className="w-3.5 h-3.5 text-primary" />
                                Tambah Butir Pertanyaan ({sec.code})
                              </h4>
                              <button
                                type="button"
                                onClick={() => setAddItemForSection(null)}
                                className="text-xs text-muted-foreground hover:text-foreground"
                              >
                                Batal
                              </button>
                            </div>
                            <CavaForm
                              fields={itemFields}
                              onSubmit={handleAddItemSubmit}
                              config={{
                                submitLabel: busy ? "Menyimpan Butir..." : "Simpan Butir Pertanyaan",
                              }}
                            />
                          </div>
                        )}

                        {items.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-3 italic">
                            Belum ada pertanyaan pada bagian ini.
                          </p>
                        ) : (
                          <div className="space-y-2.5">
                            {items.map((it) => {
                              const rubricMeta =
                                RUBRIC_BADGES[it.rubric_type] || {
                                  label: it.rubric_type,
                                  cls: "bg-muted text-foreground",
                                };

                              return (
                                <div
                                  key={it.id}
                                  className="p-3.5 rounded-xl border border-border/40 bg-background hover:border-border transition-colors space-y-2"
                                >
                                  {editingItem?.item.id === it.id ? (
                                    <div className="space-y-3 p-2 bg-muted/20 rounded-lg">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-primary">
                                          Edit Rubrik: {it.code}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => setEditingItem(null)}
                                          className="text-xs text-muted-foreground hover:text-foreground"
                                        >
                                          Batal
                                        </button>
                                      </div>
                                      <CavaForm
                                        fields={itemFields}
                                        initialValues={{
                                          code: it.code,
                                          question_text: it.question_text,
                                          rubric_type: it.rubric_type,
                                          max_score: it.max_score,
                                          weight: it.weight,
                                          na_allowed: it.na_allowed,
                                          is_life_safety: it.is_life_safety,
                                          sort_order: it.sort_order,
                                        }}
                                        onSubmit={handleEditItemSubmit}
                                        config={{
                                          submitLabel: busy ? "Memperbarui..." : "Update Rubrik",
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-1">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs font-mono font-bold text-foreground">
                                              {it.code}
                                            </span>
                                            <span
                                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${rubricMeta.cls}`}
                                            >
                                              {rubricMeta.label}
                                            </span>
                                            {it.is_life_safety && (
                                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white flex items-center gap-1">
                                                <AlertTriangle className="w-2.5 h-2.5" />
                                                Life-Safety (P1 1x24h)
                                              </span>
                                            )}
                                            {it.na_allowed && (
                                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground">
                                                Toleransi N/A
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-xs text-foreground font-medium leading-relaxed">
                                            {it.question_text}
                                          </p>
                                        </div>

                                        {isDraft && (
                                          <div className="flex items-center gap-1 shrink-0">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setEditingItem({ sectionId: sec.id, item: it })
                                              }
                                              className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                              title="Edit Rubrik"
                                            >
                                              <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteItem(sec.id, it.id)}
                                              className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                              title="Hapus Butir"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-4 text-[11px] text-muted-foreground border-t border-border/30 pt-2">
                                        <span>
                                          Skor Max: <strong>{it.max_score}</strong>
                                        </span>
                                        <span>
                                          Bobot: <strong>{it.weight}x</strong>
                                        </span>
                                        <span>
                                          Urutan: <strong>#{it.sort_order}</strong>
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Secondary Column (5 cols): Metadata, Telemetry & Lifecycle Controls */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Lifecycle Controls */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Kontrol Status & Lifecycle
            </h3>

            <div className="p-3 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground">Status Aktif Saat Ini</p>
                <div className="mt-1">
                  <StatusPill tone={STATUS_TONE[template.status] ?? "wait"}>{template.status}</StatusPill>
                </div>
              </div>
              <span className="text-xs font-mono text-muted-foreground">{template.version}</span>
            </div>

            {/* Action Buttons based on FSM state */}
            <div className="space-y-2 pt-2">
              {isDraft && (
                <>
                  <button
                    type="button"
                    disabled={busy || totalItems === 0}
                    onClick={handleLockTemplate}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Lock className="w-4 h-4" />
                    Kunci Template (Lock Version)
                  </button>
                  {totalItems === 0 && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 text-center">
                      Minimal tambahkan 1 section & 1 butir sebelum dapat di-lock.
                    </p>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmDeleteModal(true)}
                    className="w-full py-2 px-4 rounded-xl text-xs font-semibold bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus Draft Template
                  </button>
                </>
              )}

              {isLocked && (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setForkVersionInput(`${template.version.split(".")[0]}.${Number(template.version.split(".")[1] || 1) + 1}`);
                      setShowForkModal(true);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <GitFork className="w-4 h-4" />
                    Buka Versi Baru (Fork Version)
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleArchiveTemplate}
                    className="w-full py-2 px-4 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-colors flex items-center justify-center gap-2 border border-border/60"
                  >
                    <Archive className="w-4 h-4" />
                    Arsipkan Template (Archive)
                  </button>
                </>
              )}

              {isArchived && (
                <div className="p-3 rounded-xl bg-zinc-500/10 border border-zinc-500/20 text-xs text-zinc-500 text-center leading-relaxed">
                  Template ini telah diarsipkan secara permanen. Anda dapat membuka versi baru dari template yang masih berstatus LOCKED.
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Telemetry Metrics */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-sky-500" />
              Telemetri Rubrik & Bobot
            </h3>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                <p className="text-[11px] text-muted-foreground">Total Section</p>
                <p className="text-xl font-bold text-foreground mt-0.5">{totalSections}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                <p className="text-[11px] text-muted-foreground">Total Pertanyaan</p>
                <p className="text-xl font-bold text-foreground mt-0.5">{totalItems}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                <p className="text-[11px] text-muted-foreground">Akumulasi Bobot</p>
                <p className="text-xl font-bold text-foreground mt-0.5">{totalWeight.toFixed(1)}x</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
                <p className="text-[11px]">Life-Safety</p>
                <p className="text-xl font-bold mt-0.5">{lifeSafetyItems}</p>
              </div>
            </div>
          </div>

          {/* Card 3: Architecture Reference */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
              <Info className="w-4 h-4 text-primary" />
              Prinsip Penilaian EHOS (PRD-F-02)
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Scoring engine menghitung nilai secara <strong>bottom-up</strong>: nilai tiap butir &times; bobot &rarr; total subkategori &rarr; nilai departemen &rarr; total hotel berbobot dengan ambang kelulusan <strong>PASS &ge; 80%</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Modal Fork Version */}
      {showForkModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <GitFork className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Buka Versi Baru (Fork)</h3>
                <p className="text-xs text-muted-foreground">Kloning template LOCKED ke DRAFT baru</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Seluruh section dan butir pertanyaan dari versi <strong>{template.version}</strong> akan diduplikasi ke versi baru untuk dapat disunting kembali tanpa merusak riwayat audit sebelumnya.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Nomor Versi Baru</label>
              <input
                type="text"
                value={forkVersionInput}
                onChange={(e) => setForkVersionInput(e.target.value)}
                placeholder="Contoh: v2027.2"
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
              <button
                type="button"
                onClick={() => setShowForkModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleForkVersion}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
              >
                {busy ? "Memproses Fork..." : "Buat Versi Baru"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete */}
      {confirmDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-destructive/30 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Hapus Draft Template?</h3>
                <p className="text-xs text-muted-foreground">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Template DRAFT <strong>{template.name} ({template.version})</strong> akan dihapus dari sistem.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
              <button
                type="button"
                onClick={() => setConfirmDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleDeleteTemplate}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground disabled:opacity-50"
              >
                {busy ? "Menghapus..." : "Konfirmasi Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChecklistEditClient;
