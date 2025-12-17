"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Building2,
  CheckCircle2,
  Shield,
  Save,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  UtensilsCrossed,
  BedDouble,
  ShieldCheck,
  ShieldAlert,
  FileSpreadsheet,
  Award,
  Layers,
  Plus,
  DoorOpen,
  MessageSquare,
  Check,
  X,
  AlertTriangle,
  Minus,
  Loader2,
  Lock,
  Camera,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  bulkScoreItemsAction,
  ensureAuditDepartmentAction,
  registerAuditItemMediaAction,
  confirmAuditSessionMediaAction,
  type AuditItemScoreRow,
  type AuditSessionRow,
  type ScoreUpsertItem,
  type ComprehensiveAuditData,
  type ComprehensiveDepartmentData,
} from "@/app/actions/audit";

interface AuditScoringWorksheetProps {
  sessionId: string;
  session?: AuditSessionRow;
  items?: AuditItemScoreRow[];
  sectionNames?: Record<string, string>;
  isEditable: boolean;
  comprehensiveData?: ComprehensiveAuditData;
  onSaveSuccess?: () => void;
}

interface EditableScoreState {
  value: string | null;
  score: number | null;
  is_na: boolean;
  note: string;
}

function parseBilingualQuestion(text: string): { primary: string; translation?: string } {
  if (!text) return { primary: "" };
  if (text.includes("[ID]:")) {
    const parts = text.split(/\[ID\]:\s*/);
    return {
      primary: parts[0].trim(),
      translation: parts[1]?.trim(),
    };
  }
  if (text.includes("\n[ID]")) {
    const parts = text.split(/\n\[ID\]:?\s*/);
    return {
      primary: parts[0].trim(),
      translation: parts[1]?.trim(),
    };
  }
  return { primary: text };
}

export function AuditScoringWorksheet({
  sessionId,
  session,
  items = [],
  isEditable,
  comprehensiveData,
  onSaveSuccess,
}: AuditScoringWorksheetProps) {
  const t = useTranslations();

  // ─── Level 1: Sub-Tab Section Department ──────────────────────────────────
  const initialDept = useMemo(() => {
    const dept = session?.department || comprehensiveData?.session?.department;
    if (dept === "SECURITY_RISK") return "SECURITY_RISK";
    if (dept === "KITCHEN_FB") return "KITCHEN_FB";
    if (dept === "HOUSEKEEPING") return "HOUSEKEEPING";
    return "SECURITY_RISK";
  }, [session, comprehensiveData]);

  const [activeDept, setActiveDept] = useState<"SECURITY_RISK" | "KITCHEN_FB" | "HOUSEKEEPING">(initialDept);

  // ─── Level 2: Sub-Tab Lembar Kerja / Summary Report ────────────────────────
  const [activeSubTab, setActiveSubTab] = useState<{
    SECURITY_RISK: "checklist" | "summary";
    KITCHEN_FB: "checklist" | "summary";
    HOUSEKEEPING: "checklist" | "roomcheck" | "summary";
  }>({
    SECURITY_RISK: "checklist",
    KITCHEN_FB: "checklist",
    HOUSEKEEPING: "checklist",
  });

  // ─── Room Check Kamar State ───────────────────────────────────────────────
  const [rooms, setRooms] = useState([
    { id: "ROOM_1", name: "Room 1", number: "101", attendant: "Staff HK 1", supervisor: "Supervisor 1", date: "2026-07-09" },
    { id: "ROOM_2", name: "Room 2", number: "102", attendant: "Staff HK 2", supervisor: "Supervisor 1", date: "2026-07-09" },
  ]);
  const [activeRoomId, setActiveRoomId] = useState("ROOM_1");

  // ─── Score State Store: key = `${itemId}-${roomRef || "MAIN"}` ─────────────
  const [scoresState, setScoresState] = useState<Record<string, EditableScoreState>>(() => {
    const map: Record<string, EditableScoreState> = {};

    // 1. Populate from fallback items
    for (const it of items) {
      const key = `${it.item_id || it.id}-MAIN`;
      map[key] = {
        value: it.value ?? null,
        score: it.score != null ? Number(it.score) : null,
        is_na: Boolean(it.is_na),
        note: it.note ?? "",
      };
    }

    // 2. Populate from comprehensiveData
    if (comprehensiveData) {
      const allDepts = [
        comprehensiveData.security,
        comprehensiveData.kitchen_fb,
        comprehensiveData.housekeeping,
        comprehensiveData.room_check,
      ];
      for (const d of allDepts) {
        if (!d) continue;
        for (const sc of d.scores || []) {
          const roomRef = sc.room_ref || "MAIN";
          const key = `${sc.item_id}-${roomRef}`;
          map[key] = {
            value: sc.value ?? null,
            score: sc.score != null ? Number(sc.score) : null,
            is_na: Boolean(sc.is_na),
            note: sc.note ?? "",
          };
        }
      }
    }

    return map;
  });

  const [saving, setSaving] = useState(false);
  const [activatingDept, setActivatingDept] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // ─── Open Audit Request Modal State ───────────────────────────────────────
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestNote, setRequestNote] = useState("");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [localDeptSessions, setLocalDeptSessions] = useState<Record<string, AuditSessionRow>>({});

  // ─── Active Data per Department ───────────────────────────────────────────
  const currentDeptData: ComprehensiveDepartmentData | undefined = useMemo(() => {
    if (!comprehensiveData) return undefined;
    if (activeDept === "SECURITY_RISK") return comprehensiveData.security;
    if (activeDept === "KITCHEN_FB") return comprehensiveData.kitchen_fb;
    if (activeDept === "HOUSEKEEPING") return comprehensiveData.housekeeping;
    return undefined;
  }, [comprehensiveData, activeDept]);

  // ─── Department Registration & Editability Evaluation ───────────────────────
  const activeDeptSession = localDeptSessions[activeDept] || currentDeptData?.session;
  const isDeptRegistered = Boolean(
    localDeptSessions[activeDept]?.id ||
    currentDeptData?.session_id ||
    (session?.department === activeDept && session?.id)
  );
  const deptStatus =
    localDeptSessions[activeDept]?.status ||
    activeDeptSession?.status ||
    (session?.department === activeDept ? session.status : isDeptRegistered ? "IN_PROGRESS" : "NOT_REGISTERED");

  const isDeptPublished = deptStatus === "PUBLISHED" || deptStatus === "SUBMITTED";

  // Strict Per-Department Editability: Department must be registered in DB and in DRAFT/IN_PROGRESS status (not PUBLISHED/SUBMITTED)
  const isDeptEditable = useMemo(() => {
    if (!isDeptRegistered) return false;
    if (isDeptPublished) return false;
    return deptStatus === "DRAFT" || deptStatus === "IN_PROGRESS";
  }, [isDeptRegistered, isDeptPublished, deptStatus]);

  // ─── Helpers: Set Score ───────────────────────────────────────────────────
  const handleScoreChange = (
    itemId: string,
    roomRef: string,
    rubricType: string,
    val: string,
    maxScore: number,
    isNA: boolean = false
  ) => {
    if (!isDeptEditable) return;

    let computedScore: number | null = null;
    const cleanVal = isNA ? "N/A" : val.toUpperCase();

    if (isNA) {
      computedScore = null;
    } else if (rubricType === "TRAFFIC_LIGHT") {
      if (cleanVal === "YES" || cleanVal === "PASS") computedScore = maxScore;
      else if (cleanVal === "NEED REVIEW" || cleanVal === "REVIEW" || cleanVal === "PARTIAL" || cleanVal === "NEED TO REVIEW")
        computedScore = maxScore * 0.5;
      else if (cleanVal === "NO" || cleanVal === "FAIL") computedScore = 0;
    } else if (rubricType === "BINARY_COUNT") {
      if (cleanVal === "YES" || cleanVal === "1" || cleanVal === "PASS") computedScore = maxScore;
      else computedScore = 0;
    } else {
      const num = parseFloat(val);
      if (!isNaN(num)) computedScore = Math.min(Math.max(0, num), maxScore);
    }

    const key = `${itemId}-${roomRef}`;
    setScoresState((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || { note: "" }),
        value: cleanVal,
        score: computedScore,
        is_na: isNA,
      },
    }));
    setSaveSuccess(null);
  };

  const handleNoteChange = (itemId: string, roomRef: string, note: string) => {
    if (!isDeptEditable) return;
    const key = `${itemId}-${roomRef}`;
    setScoresState((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || { value: null, score: null, is_na: false }),
        note,
      },
    }));
    setSaveSuccess(null);
  };

  // Group items by section
  const groupedSections = useMemo(() => {
    const rawItems = currentDeptData?.items || [];
    const groups: Record<string, typeof rawItems> = {};
    for (const item of rawItems) {
      const sCode = item.section_code || "GENERAL";
      if (!groups[sCode]) groups[sCode] = [];
      groups[sCode].push(item);
    }
    return groups;
  }, [currentDeptData]);

  // Room Check Grouped Sections
  const roomCheckGrouped = useMemo(() => {
    const rawItems = comprehensiveData?.room_check?.items || [];
    const groups: Record<string, typeof rawItems> = {};
    for (const item of rawItems) {
      const sCode = item.section_code || "ZONES";
      if (!groups[sCode]) groups[sCode] = [];
      groups[sCode].push(item);
    }
    return groups;
  }, [comprehensiveData]);

  // ─── Live Metrics Calculations ────────────────────────────────────────────

  // 1. Security Calculations
  const securityMetrics = useMemo(() => {
    const secItems = comprehensiveData?.security?.items || [];
    const sections = comprehensiveData?.security?.sections || [];
    const secScores: Record<string, { achieved: number; max: number; pct: number; count: number; name: string }> = {};

    let totalAchieved = 0;
    let totalMax = 0;

    for (const s of sections) {
      secScores[s.code] = { achieved: 0, max: 0, pct: 0, count: 0, name: s.name };
    }

    for (const it of secItems) {
      const key = `${it.id}-MAIN`;
      const st = scoresState[key];
      const maxPts = it.max_score || 90;
      const sCode = it.section_code;

      if (!secScores[sCode]) {
        secScores[sCode] = { achieved: 0, max: 0, pct: 0, count: 0, name: it.section_name || sCode };
      }

      secScores[sCode].count += 1;

      if (st && st.is_na) continue;

      if (st && st.score != null) {
        secScores[sCode].achieved += st.score;
        totalAchieved += st.score;
      }
      secScores[sCode].max += maxPts;
      totalMax += maxPts;
    }

    // Calculate percentage per section
    let sumPercentages = 0;
    const sectionList = Object.entries(secScores).map(([code, d]) => {
      const pct = d.max > 0 ? (d.achieved / d.max) * 100 : 100;
      sumPercentages += pct;
      return { code, name: d.name, achieved: d.achieved, max: d.max, pct: Math.round(pct * 10) / 10, count: d.count };
    });

    const overallPct = sectionList.length > 0 ? sumPercentages / sectionList.length : 100;

    return {
      sections: sectionList,
      overallPct: Math.round(overallPct * 10) / 10,
      isPass: overallPct >= 80.0,
      totalAchieved,
      totalMax,
    };
  }, [comprehensiveData, scoresState]);

  // 2. Kitchen FB Calculations
  const kitchenMetrics = useMemo(() => {
    const kfbItems = comprehensiveData?.kitchen_fb?.items || [];
    const sections = comprehensiveData?.kitchen_fb?.sections || [];
    const secScores: Record<string, { total: number; yesCount: number; pct: number; name: string }> = {};

    let totalYes = 0;
    let totalQuestions = 0;

    for (const s of sections) {
      secScores[s.code] = { total: 0, yesCount: 0, pct: 0, name: s.name };
    }

    for (const it of kfbItems) {
      const key = `${it.id}-MAIN`;
      const st = scoresState[key];
      const sCode = it.section_code;

      if (!secScores[sCode]) {
        secScores[sCode] = { total: 0, yesCount: 0, pct: 0, name: it.section_name || sCode };
      }

      secScores[sCode].total += 1;
      totalQuestions += 1;

      if (st && (st.value === "YES" || st.value === "1" || st.score === 1)) {
        secScores[sCode].yesCount += 1;
        totalYes += 1;
      }
    }

    const sectionList = Object.entries(secScores).map(([code, d]) => {
      const pct = d.total > 0 ? (d.yesCount / d.total) * 100 : 100;
      return { code, name: d.name, yesCount: d.yesCount, total: d.total, pct: Math.round(pct * 10) / 10 };
    });

    const overallPct = totalQuestions > 0 ? (totalYes / totalQuestions) * 100 : 100;

    return {
      sections: sectionList,
      overallPct: Math.round(overallPct * 10) / 10,
      isPass: overallPct >= 80.0,
      totalYes,
      totalQuestions,
    };
  }, [comprehensiveData, scoresState]);

  // 3. Housekeeping General Ops Calculations
  const hkGeneralMetrics = useMemo(() => {
    const hkItems = comprehensiveData?.housekeeping?.items || [];
    const sections = comprehensiveData?.housekeeping?.sections || [];
    const secScores: Record<string, { achieved: number; max: number; pct: number; count: number; name: string }> = {};

    let totalAchieved = 0;
    let totalMax = 0;

    for (const s of sections) {
      secScores[s.code] = { achieved: 0, max: 0, pct: 0, count: 0, name: s.name };
    }

    for (const it of hkItems) {
      const key = `${it.id}-MAIN`;
      const st = scoresState[key];
      const maxPts = it.max_score || 90;
      const sCode = it.section_code;

      if (!secScores[sCode]) {
        secScores[sCode] = { achieved: 0, max: 0, pct: 0, count: 0, name: it.section_name || sCode };
      }

      secScores[sCode].count += 1;

      if (st && st.is_na) continue;

      if (st && st.score != null) {
        secScores[sCode].achieved += st.score;
        totalAchieved += st.score;
      }
      secScores[sCode].max += maxPts;
      totalMax += maxPts;
    }

    let sumPercentages = 0;
    const sectionList = Object.entries(secScores).map(([code, d]) => {
      const pct = d.max > 0 ? (d.achieved / d.max) * 100 : 100;
      sumPercentages += pct;
      return { code, name: d.name, achieved: d.achieved, max: d.max, pct: Math.round(pct * 10) / 10, count: d.count };
    });

    const overallPct = sectionList.length > 0 ? sumPercentages / sectionList.length : 100;

    return {
      sections: sectionList,
      overallPct: Math.round(overallPct * 10) / 10,
      isPass: overallPct >= 80.0,
      totalAchieved,
      totalMax,
    };
  }, [comprehensiveData, scoresState]);

  // 4. Room Check Calculations (per Room & Average)
  const roomCheckMetrics = useMemo(() => {
    const rcItems = comprehensiveData?.room_check?.items || [];
    const roomAverages: Record<string, { achieved: number; max: number; pct: number }> = {};

    for (const r of rooms) {
      let rAchieved = 0;
      let rMax = 0;

      for (const it of rcItems) {
        const key = `${it.id}-${r.id}`;
        const st = scoresState[key];
        const basePts = it.max_score || 1.0;

        if (st && (st.is_na || st.value === "NA")) continue;

        if (st && (st.value === "1" || st.value === "YES" || st.score === 1)) {
          rAchieved += 1;
        }
        rMax += basePts;
      }

      const pct = rMax > 0 ? (rAchieved / rMax) * 100 : 100;
      roomAverages[r.id] = { achieved: rAchieved, max: rMax, pct: Math.round(pct * 10) / 10 };
    }

    // Average across all rooms
    const rList = Object.values(roomAverages);
    const avgPct = rList.length > 0 ? rList.reduce((acc, curr) => acc + curr.pct, 0) / rList.length : 100;

    return {
      roomAverages,
      overallRoomPct: Math.round(avgPct * 10) / 10,
    };
  }, [comprehensiveData, scoresState, rooms]);

  // 4b. Room Check 9 Category Breakdown across Sample Rooms
  const roomCategoryBreakdown = useMemo(() => {
    const rcItems = comprehensiveData?.room_check?.items || [];
    const catMap: Record<string, { name: string; roomScores: Record<string, number>; maxScore: number }> = {};

    for (const it of rcItems) {
      const zoneName = it.section_name || it.section_code || "General";
      if (!catMap[zoneName]) {
        catMap[zoneName] = { name: zoneName, roomScores: {}, maxScore: 0 };
      }
      catMap[zoneName].maxScore += (it.max_score || 1.0);
      for (const r of rooms) {
        const key = `${it.id}-${r.id}`;
        const st = scoresState[key];
        const isYes = st && (st.value === "1" || st.value === "YES" || st.score === 1);
        catMap[zoneName].roomScores[r.id] = (catMap[zoneName].roomScores[r.id] || 0) + (isYes ? 1 : 0);
      }
    }
    return Object.values(catMap);
  }, [comprehensiveData, scoresState, rooms]);

  // 5. The Golden Formula Composite Housekeeping: (HK Ops + Room Check) / 2
  const compositeHKScore = useMemo(() => {
    const hkOps = hkGeneralMetrics.overallPct;
    const roomPct = roomCheckMetrics.overallRoomPct;
    const composite = (hkOps + roomPct) / 2;
    return {
      hkOps,
      roomPct,
      composite: Math.round(composite * 10) / 10,
      isPass: composite >= 80.0,
    };
  }, [hkGeneralMetrics, roomCheckMetrics]);

  // ─── Open Audit Request Handler ───────────────────────────────────────────
  async function handleOpenAuditRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!requestNote.trim() || requestNote.trim().length < 5) {
      setRequestError("Mohon masukkan catatan / alasan pembukaan audit (minimal 5 karakter).");
      return;
    }
    setActivatingDept(true);
    setRequestError(null);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const sourceId = (session?.id || sessionId) as string;
      const res = await ensureAuditDepartmentAction(sourceId, activeDept, requestNote.trim());
      if (!res.ok || !res.session) {
        setRequestError(res.message || "Gagal mengaktifkan sesi audit.");
        return;
      }

      setShowRequestModal(false);
      setRequestNote("");
      if (res.session) {
        setLocalDeptSessions((prev) => ({ ...prev, [activeDept]: res.session! }));
      }
      const deptName =
        activeDept === "SECURITY_RISK"
          ? "Security & Risk Management"
          : activeDept === "KITCHEN_FB"
          ? "Kitchen & F&B"
          : "Housekeeping";
      setSaveSuccess(`Permintaan audit untuk ${deptName} berhasil diajukan dan sesi audit resmi diaktifkan!`);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err: unknown) {
      setRequestError(err instanceof Error ? err.message : "Gagal mengaktifkan sesi audit");
    } finally {
      setActivatingDept(false);
    }
  }

  // ─── Save Worksheet Scores Action ─────────────────────────────────────────
  async function handleSaveCurrentWorksheet() {
    if (!isDeptEditable) {
      if (isDeptPublished) {
        setSaveError("Sesi audit untuk departemen ini sudah berstatus PUBLISHED (terkunci) dan tidak dapat diubah kembali.");
      } else if (!isDeptRegistered) {
        setSaveError("Departemen ini belum terdaftar dalam siklus audit. Silakan klik 'Buka Permintaan Audit' terlebih dahulu.");
      }
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const targetSessionId =
        localDeptSessions[activeDept]?.id ||
        currentDeptData?.session_id ||
        (session?.department === activeDept ? sessionId : null);
      if (!targetSessionId) {
        setSaveError("ID Sesi audit untuk departemen ini tidak ditemukan.");
        setSaving(false);
        return;
      }

      // Collect scores for items belonging to this department
      const upsertPayload: ScoreUpsertItem[] = [];

      if (activeDept === "HOUSEKEEPING" && activeSubTab.HOUSEKEEPING === "roomcheck") {
        // Save Room Check items for all active rooms
        const rcItems = comprehensiveData?.room_check?.items || [];
        for (const r of rooms) {
          for (const it of rcItems) {
            const key = `${it.id}-${r.id}`;
            const st = scoresState[key];
            if (st) {
              upsertPayload.push({
                item_id: it.id,
                room_ref: r.id,
                value: st.value,
                score: st.score,
                is_na: st.is_na,
                note: st.note,
              });
            }
          }
        }
      } else {
        // Save standard department items
        const rawItems = currentDeptData?.items || [];
        for (const it of rawItems) {
          const key = `${it.id}-MAIN`;
          const st = scoresState[key];
          if (st) {
            upsertPayload.push({
              item_id: it.id,
              room_ref: null,
              value: st.value,
              score: st.score,
              is_na: st.is_na,
              note: st.note,
            });
          }
        }
      }

      if (upsertPayload.length === 0) {
        setSaveError(t("audit.saveErrorEmpty"));
        return;
      }

      const res = await bulkScoreItemsAction(targetSessionId, upsertPayload);
      if (!res.ok) {
        setSaveError(res.message || t("audit.saveErrorGeneral"));
        return;
      }

      setSaveSuccess(t("audit.saveSuccess"));
      if (onSaveSuccess) onSaveSuccess();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : t("audit.saveErrorGeneral"));
    } finally {
      setSaving(false);
    }
  }

  const toggleSection = (code: string) => {
    setCollapsedSections((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  return (
    <div className="space-y-6">
      {/* ─── Level 1: Sub-Tab Section Department ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveDept("SECURITY_RISK")}
            className={`flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeDept === "SECURITY_RISK"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 ring-2 ring-primary/30"
                : "bg-card text-muted-foreground border border-border/60 hover:bg-muted hover:text-foreground"
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>{t("audit.deptSecurityTitle")}</span>
            <span className="rounded-full bg-background/20 px-2 py-0.5 text-[10px] font-black">
              {securityMetrics.overallPct}%
            </span>
          </button>

          <button
            onClick={() => setActiveDept("KITCHEN_FB")}
            className={`flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeDept === "KITCHEN_FB"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 ring-2 ring-primary/30"
                : "bg-card text-muted-foreground border border-border/60 hover:bg-muted hover:text-foreground"
            }`}
          >
            <UtensilsCrossed className="h-4 w-4" />
            <span>{t("audit.deptKitchenTitle")}</span>
            <span className="rounded-full bg-background/20 px-2 py-0.5 text-[10px] font-black">
              {kitchenMetrics.overallPct}%
            </span>
          </button>

          <button
            onClick={() => setActiveDept("HOUSEKEEPING")}
            className={`flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeDept === "HOUSEKEEPING"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 ring-2 ring-primary/30"
                : "bg-card text-muted-foreground border border-border/60 hover:bg-muted hover:text-foreground"
            }`}
          >
            <BedDouble className="h-4 w-4" />
            <span>{t("audit.deptHousekeepingTitle")}</span>
            <span className="rounded-full bg-background/20 px-2 py-0.5 text-[10px] font-black">
              {compositeHKScore.composite}%
            </span>
          </button>
        </div>

        {/* Level 1 Header Action Buttons */}
        <div className="flex items-center gap-2">
          {isDeptPublished ? (
            <div className="flex items-center gap-2 rounded-2xl bg-muted/60 border border-border/70 px-4 py-2 text-xs font-semibold text-muted-foreground shadow-xs">
              <Lock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Sesi Terpublikasi (Read-Only)</span>
            </div>
          ) : !isDeptRegistered ? (
            <Button
              size="sm"
              onClick={() => {
                setRequestNote("");
                setRequestError(null);
                setShowRequestModal(true);
              }}
              className="flex items-center gap-2 rounded-2xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-600/25 hover:bg-amber-500 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Buka Permintaan Audit</span>
            </Button>
          ) : isDeptEditable ? (
            <button
              onClick={handleSaveCurrentWorksheet}
              disabled={saving || activatingDept}
              className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>
                {saving ? t("audit.savingScores") : t("audit.saveWorksheet")}
              </span>
            </button>
          ) : null}
        </div>
      </div>

      {/* ─── Notification: Locked PUBLISHED Banner ─── */}
      {isDeptPublished && (
        <div className="flex items-center gap-3.5 rounded-2xl border border-blue-500/30 bg-blue-500/10 dark:bg-blue-500/15 p-4.5 text-xs text-foreground shadow-sm animate-in fade-in">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30">
            <Lock className="h-4.5 w-4.5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-700 dark:text-blue-300 text-xs">
                Sesi Audit Departemen Ini Telah Terpublikasi (PUBLISHED)
              </span>
              <Badge variant="outline" className="text-[10px] font-bold border-blue-500/40 text-blue-700 dark:text-blue-300">
                Terkunci / Read-Only
              </Badge>
            </div>
            <p className="text-muted-foreground mt-0.5">
              Seluruh butir evaluasi dan hasil penilaian pada departemen {activeDept === "SECURITY_RISK" ? "Security & Risk Management" : activeDept === "KITCHEN_FB" ? "Kitchen & F&B" : "Housekeeping"} telah difinalisasi secara resmi dan berstatus terkunci untuk menjaga integritas data audit.
            </p>
          </div>
        </div>
      )}

      {/* ─── Notification: Not Registered in Cycle Banner ─── */}
      {!isDeptRegistered && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 p-4.5 text-xs text-foreground shadow-sm animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <Shield className="h-4.5 w-4.5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-700 dark:text-amber-300 text-xs">
                  {t("audit.cycleNoticeTitle")}
                </span>
                <Badge variant="outline" className="text-[10px] font-semibold border-amber-500/40 text-amber-700 dark:text-amber-300">
                  Belum Terjadwal di Siklus Ini
                </Badge>
              </div>
              <p className="text-muted-foreground mt-0.5">
                {t("audit.cycleNoticeDesc", {
                  dept:
                    activeDept === "SECURITY_RISK"
                      ? "Security & Risk Management"
                      : activeDept === "KITCHEN_FB"
                      ? "Kitchen & F&B"
                      : "Housekeeping",
                })}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground font-medium">
                💡 Departemen ini belum dibuka sesinya. Untuk melakukan audit pada departemen ini, ajukan permohonan pembukaan audit melalui tombol di samping dengan menyertakan catatan/alasan audit.
              </p>
            </div>
          </div>
          {isEditable && (
            <Button
              size="sm"
              onClick={() => {
                setRequestNote("");
                setRequestError(null);
                setShowRequestModal(true);
              }}
              disabled={activatingDept || saving}
              className="rounded-xl bg-amber-600 text-white hover:bg-amber-500 text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Buka Permintaan Audit
            </Button>
          )}
        </div>
      )}
      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/15 p-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}
      {saveError && (
        <div className="flex items-center gap-2 rounded-2xl bg-destructive/15 p-4 text-xs font-bold text-destructive border border-destructive/30 shadow-sm animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION DEPARTMENT 1: SECURITY & RISK MANAGEMENT
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeDept === "SECURITY_RISK" && (
        <div className="space-y-5">
          {/* Sub-Tab Navigation for Security */}
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <button
              onClick={() => setActiveSubTab((prev) => ({ ...prev, SECURITY_RISK: "checklist" }))}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeSubTab.SECURITY_RISK === "checklist"
                  ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>{t("audit.sec41Title")}</span>
            </button>
            <button
              onClick={() => setActiveSubTab((prev) => ({ ...prev, SECURITY_RISK: "summary" }))}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeSubTab.SECURITY_RISK === "summary"
                  ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              <span>{t("audit.sec42Title")}</span>
            </button>
          </div>

          {/* 4.1 Checklist Lembar Kerja Security */}
          {activeSubTab.SECURITY_RISK === "checklist" && (
            <div className="space-y-4">
              {Object.entries(groupedSections).map(([secCode, secItems]) => {
                const sName = secItems[0]?.section_name || secCode;
                const secMetric = securityMetrics.sections.find((s) => s.code === secCode);
                const isCollapsed = Boolean(collapsedSections[secCode]);

                return (
                  <div key={secCode} className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm">
                    {/* Section Header Banner */}
                    <div
                      onClick={() => toggleSection(secCode)}
                      className="flex cursor-pointer items-center justify-between border-b border-border/50 bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40 px-5 py-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-xs font-black text-primary border border-primary/20">
                          {secCode.replace("SEC-", "")}
                        </span>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-foreground">{sName}</h4>
                          <span className="text-[11px] text-muted-foreground">
                            {t("audit.standardQuestionsCount", { count: secItems.length })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs font-black text-foreground">{secMetric?.pct ?? 0}%</div>
                          <div className="text-[10px] text-muted-foreground font-semibold">
                            {secMetric?.achieved ?? 0} / {secMetric?.max ?? 0} pts
                          </div>
                        </div>
                        {isCollapsed ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>

                    {/* Section Checklist Table */}
                    {!isCollapsed && (
                      <div className="divide-y divide-border/40 p-2 sm:p-3 space-y-2">
                        {secItems.map((item) => {
                          const key = `${item.id}-MAIN`;
                          const st = scoresState[key] || { value: null, score: null, is_na: false, note: "" };

                          return (
                            <WorksheetItemCard
                              key={item.id}
                              item={item}
                              st={st}
                              rubricType="TRAFFIC_LIGHT"
                              maxScore={item.max_score || 90}
                              isEditable={isDeptEditable}
                              commentPlaceholder="Comments & notes..."
                              onScoreChange={(val, isNA) => handleScoreChange(item.id, "MAIN", "TRAFFIC_LIGHT", val, 90, isNA)}
                              onNoteChange={(note) => handleNoteChange(item.id, "MAIN", note)}
                              sessionId={sessionId}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 4.2 Executive Summary Report Security */}
          {activeSubTab.SECURITY_RISK === "summary" && (
            <div className="space-y-6 rounded-3xl border border-border/60 bg-card/60 dark:bg-slate-900/60 p-6 md:p-8 shadow-xl backdrop-blur-xl">
              {/* Hotel & Leadership Executive Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-border/50 bg-muted/20 p-5">
                {/* Hotel Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Informasi Properti</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <span className="text-muted-foreground font-medium">Hotel Name</span>
                    <span className="col-span-2 font-bold text-foreground">{comprehensiveData?.hotel?.name || "Hotel Ciputra World Surabaya"}</span>
                    <span className="text-muted-foreground font-medium">Hotel Code</span>
                    <span className="col-span-2 font-mono font-bold text-foreground">{comprehensiveData?.hotel?.code || "CWS"}</span>
                    <span className="text-muted-foreground font-medium">Region / City</span>
                    <span className="col-span-2 text-foreground font-medium">{comprehensiveData?.hotel?.region || comprehensiveData?.hotel?.city || "East Java"}</span>
                    <span className="text-muted-foreground font-medium">Date of Audit</span>
                    <span className="col-span-2 font-mono text-foreground">
                      {session?.date_start ? `${session.date_start} ${session.date_end ? `– ${session.date_end}` : ""}` : "9-11 July 2026"}
                    </span>
                  </div>
                </div>

                {/* Leadership Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Manajemen & Auditor</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <span className="text-muted-foreground font-medium">General Manager</span>
                    <span className="col-span-2 font-semibold text-foreground">Ms. Nurhayati B</span>
                    <span className="text-muted-foreground font-medium">Chief Engineering</span>
                    <span className="col-span-2 text-foreground font-medium">Mr. Eka</span>
                    <span className="text-muted-foreground font-medium">Security Manager</span>
                    <span className="col-span-2 text-foreground font-medium">Mr. Arie Ismaryadi</span>
                    <span className="text-muted-foreground font-medium">Lead Auditor</span>
                    <span className="col-span-2 font-bold text-primary">{session?.auditor_name || "Abdulloh Shiddiq Almansyur"}</span>
                  </div>
                </div>
              </div>

              {/* Threshold Result Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-2xl border border-border/50 bg-card/80 p-4 shadow-sm">
                {/* Big Score Box */}
                <div className={`flex flex-col items-center justify-center rounded-xl p-4 text-center ${
                  securityMetrics.isPass ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20" : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                }`}>
                  <span className="text-4xl font-display font-extrabold">{securityMetrics.overallPct}</span>
                  <span className="text-[11px] font-semibold tracking-wider uppercase mt-1 text-muted-foreground">Overall Security Score</span>
                </div>

                {/* Criteria Range */}
                <div className="flex flex-col justify-center rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground font-semibold pb-1 border-b border-border/30">
                    <span>Periode Audit</span>
                    <span className="font-mono font-bold">{session?.date_start ? new Date(session.date_start).getFullYear() : 2026}</span>
                  </div>
                  <div className={`flex items-center justify-between rounded-lg px-2.5 py-1 ${securityMetrics.isPass ? "bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20" : "text-muted-foreground"}`}>
                    <span>Pass Threshold</span>
                    <span className="font-mono">&gt; 80%</span>
                  </div>
                  <div className={`flex items-center justify-between rounded-lg px-2.5 py-1 ${!securityMetrics.isPass ? "bg-rose-500/10 font-bold text-rose-700 dark:text-rose-300 border border-rose-500/20" : "text-muted-foreground"}`}>
                    <span>Fail Threshold</span>
                    <span className="font-mono">&lt; 79.9%</span>
                  </div>
                </div>

                {/* Result Status */}
                <div className="flex flex-col items-center justify-center rounded-xl border border-border/40 bg-muted/20 p-3.5 text-center">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Hasil Akhir</span>
                  <span className={`text-2xl font-black mt-1 ${securityMetrics.isPass ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {securityMetrics.isPass ? "PASS (TRUE)" : "FAIL (FALSE)"}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">{securityMetrics.isPass ? "Memenuhi Standar Kepatuhan" : "Perlu Tindakan Korektif (CAPA)"}</span>
                </div>
              </div>

              {/* Section Summary Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Ringkasan Seksi Audit Keamanan (14 Kategori)
                  </h4>
                  <Badge variant="outline" className="text-[10px] font-mono">14 Sections</Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
                  {/* Category Breakdown Table */}
                  <div className="lg:col-span-3 overflow-x-auto rounded-2xl border border-border/50 bg-card/60">
                    <table className="w-full text-left text-xs font-medium">
                      <thead className="border-b border-border/50 bg-muted/40 font-semibold text-muted-foreground">
                        <tr>
                          <th className="py-2.5 px-3.5 text-[11px] uppercase tracking-wider">Kategori</th>
                          <th className="py-2.5 px-3.5 text-right text-[11px] uppercase tracking-wider">Skor / Poin</th>
                          <th className="py-2.5 px-3.5 text-right text-[11px] uppercase tracking-wider">Kepatuhan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {securityMetrics.sections.map((s) => (
                          <tr key={s.code} className="hover:bg-muted/20 transition-colors">
                            <td className="py-2 px-3.5 font-medium text-foreground">
                              {s.name}
                            </td>
                            <td className="py-2 px-3.5 text-right font-mono font-semibold text-muted-foreground">
                              {s.achieved.toFixed(1)}
                            </td>
                            <td className="py-2 px-3.5 text-right font-bold">
                              <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                                s.pct >= 80 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20" : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                              }`}>
                                {s.pct}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Right Overall Score Block */}
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-gradient-to-br from-card via-muted/30 to-card p-6 text-center h-full min-h-[220px] shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Skor Total Keamanan</span>
                    <span className="mt-3 font-display text-5xl font-black text-foreground">{securityMetrics.overallPct}</span>
                    <span className={`mt-2 text-xs font-semibold rounded-full px-3 py-1 ${
                      securityMetrics.isPass ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                    }`}>
                      {securityMetrics.isPass ? "PASS (≥ 80%)" : "FAIL (< 80%)"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION DEPARTMENT 2: KITCHEN & FOOD AND BEVERAGE
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeDept === "KITCHEN_FB" && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <button
              onClick={() => setActiveSubTab((prev) => ({ ...prev, KITCHEN_FB: "checklist" }))}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeSubTab.KITCHEN_FB === "checklist"
                  ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>{t("audit.sec51Title")}</span>
            </button>
            <button
              onClick={() => setActiveSubTab((prev) => ({ ...prev, KITCHEN_FB: "summary" }))}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeSubTab.KITCHEN_FB === "summary"
                  ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              <span>{t("audit.sec52Title")}</span>
            </button>
          </div>

          {activeSubTab.KITCHEN_FB === "checklist" && (
            <div className="space-y-4">
              {Object.entries(groupedSections).map(([secCode, secItems]) => {
                const sName = secItems[0]?.section_name || secCode;
                const secMetric = kitchenMetrics.sections.find((s) => s.code === secCode);
                const isCollapsed = Boolean(collapsedSections[secCode]);

                return (
                  <div key={secCode} className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm">
                    {/* Section Header Banner */}
                    <div
                      onClick={() => toggleSection(secCode)}
                      className="flex cursor-pointer items-center justify-between border-b border-border/50 bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40 px-5 py-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-xs font-black text-primary border border-primary/20">
                          {secCode.replace("KFB-", "")}
                        </span>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-foreground">{sName}</h4>
                          <span className="text-[11px] text-muted-foreground">
                            {t("audit.standardQuestionsCount", { count: secItems.length })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-muted-foreground">
                          {secMetric ? `${secMetric.yesCount} / ${secMetric.total} (${secMetric.pct}%)` : "—"}
                        </span>
                        {isCollapsed ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Section Items */}
                    {!isCollapsed && (
                      <div className="divide-y divide-border/40 p-2 sm:p-3 space-y-2">
                        {secItems.map((item) => {
                          const key = `${item.id}-MAIN`;
                          const st = scoresState[key] || { value: null, score: null, is_na: false, note: "" };

                          return (
                            <WorksheetItemCard
                              key={item.id}
                              item={item}
                              st={st}
                              rubricType="BINARY_COUNT"
                              maxScore={item.max_score || 1.0}
                              isEditable={isDeptEditable}
                              commentPlaceholder="Catatan & observasi dapur (Comments)..."
                              onScoreChange={(val, isNA) => handleScoreChange(item.id, "MAIN", item.rubric_type, val, item.max_score, isNA)}
                              onNoteChange={(note) => handleNoteChange(item.id, "MAIN", note)}
                              sessionId={sessionId}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeSubTab.KITCHEN_FB === "summary" && (
            <div className="space-y-6 rounded-3xl border border-border/60 bg-card/60 dark:bg-slate-900/60 p-6 md:p-8 shadow-xl backdrop-blur-xl">
              {/* Hotel & Leadership Executive Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-border/50 bg-muted/20 p-5">
                {/* Hotel Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Informasi Properti</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <span className="text-muted-foreground font-medium">Hotel Name</span>
                    <span className="col-span-2 font-bold text-foreground">{comprehensiveData?.hotel?.name || "Hotel Ciputra World Surabaya"}</span>
                    <span className="text-muted-foreground font-medium">Hotel Code</span>
                    <span className="col-span-2 font-mono font-bold text-foreground">{comprehensiveData?.hotel?.code || "CWS"}</span>
                    <span className="text-muted-foreground font-medium">Region / City</span>
                    <span className="col-span-2 text-foreground font-medium">{comprehensiveData?.hotel?.region || comprehensiveData?.hotel?.city || "West Java"}</span>
                    <span className="text-muted-foreground font-medium">Date of Audit</span>
                    <span className="col-span-2 font-mono text-foreground">
                      {session?.date_start ? `${session.date_start} ${session.date_end ? `– ${session.date_end}` : ""}` : "9-11 July 2026"}
                    </span>
                  </div>
                </div>

                {/* Leadership Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                    <UtensilsCrossed className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Manajemen F&B & Auditor</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <span className="text-muted-foreground font-medium">General Manager</span>
                    <span className="col-span-2 font-semibold text-foreground">Ms. Nurhayati B</span>
                    <span className="text-muted-foreground font-medium">FBM In-Charge</span>
                    <span className="col-span-2 text-foreground font-medium">Mr. Ibram Saputra</span>
                    <span className="text-muted-foreground font-medium">Exec. Chef In-Charge</span>
                    <span className="col-span-2 text-foreground font-medium">Mr. Adam</span>
                    <span className="text-muted-foreground font-medium">Lead Auditor</span>
                    <span className="col-span-2 font-bold text-primary">{session?.auditor_name || "Abdulloh Shiddiq AM"}</span>
                  </div>
                </div>
              </div>

              {/* Threshold Result Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-2xl border border-border/50 bg-card/80 p-4 shadow-sm">
                {/* Big Score Box */}
                <div className={`flex flex-col items-center justify-center rounded-xl p-4 text-center ${
                  kitchenMetrics.isPass ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20" : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                }`}>
                  <span className="text-4xl font-display font-extrabold">{kitchenMetrics.overallPct}%</span>
                  <span className="text-[11px] font-semibold tracking-wider uppercase mt-1 text-muted-foreground">Overall Kitchen & F&B Score</span>
                </div>

                {/* Criteria Range */}
                <div className="flex flex-col justify-center rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground font-semibold pb-1 border-b border-border/30">
                    <span>Target Standar</span>
                    <span className="font-mono font-bold">Hygiene ≥ 80%</span>
                  </div>
                  <div className={`flex items-center justify-between rounded-lg px-2.5 py-1 ${kitchenMetrics.isPass ? "bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20" : "text-muted-foreground"}`}>
                    <span>Pass (80% +)</span>
                    <span className="font-mono">&gt; 80%</span>
                  </div>
                  <div className={`flex items-center justify-between rounded-lg px-2.5 py-1 ${!kitchenMetrics.isPass ? "bg-rose-500/10 font-bold text-rose-700 dark:text-rose-300 border border-rose-500/20" : "text-muted-foreground"}`}>
                    <span>Fail (80% -)</span>
                    <span className="font-mono">&lt; 79.9%</span>
                  </div>
                </div>

                {/* Result Status */}
                <div className="flex flex-col items-center justify-center rounded-xl border border-border/40 bg-muted/20 p-3.5 text-center">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Hasil Akhir</span>
                  <span className={`text-2xl font-black mt-1 ${kitchenMetrics.isPass ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {kitchenMetrics.isPass ? "PASS (TRUE)" : "FAIL (FALSE)"}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">{kitchenMetrics.isPass ? "Standar Higienitas Terpenuhi" : "Perlu Perbaikan Sanitasi"}</span>
                </div>
              </div>

              {/* Section Summary Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Ringkasan Seksi Dapur & F&B (9 Kategori)
                  </h4>
                  <Badge variant="outline" className="text-[10px] font-mono">9 Sections</Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
                  {/* Category Breakdown Table */}
                  <div className="lg:col-span-3 overflow-x-auto rounded-2xl border border-border/50 bg-card/60">
                    <table className="w-full text-left text-xs font-medium">
                      <thead className="border-b border-border/50 bg-muted/40 font-semibold text-muted-foreground">
                        <tr>
                          <th className="py-2.5 px-3.5 text-[11px] uppercase tracking-wider">Kategori</th>
                          <th className="py-2.5 px-3.5 text-right text-[11px] uppercase tracking-wider">Skor Kepatuhan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {kitchenMetrics.sections.map((s) => (
                          <tr key={s.code} className="hover:bg-muted/20 transition-colors">
                            <td className="py-2 px-3.5 font-medium text-foreground">
                              {s.name}
                            </td>
                            <td className="py-2 px-3.5 text-right font-bold">
                              <span className={`inline-block rounded-md px-2.5 py-0.5 text-xs font-mono font-semibold ${
                                s.pct >= 80 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20" : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                              }`}>
                                {s.pct}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Right Overall Score Block */}
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-gradient-to-br from-card via-muted/30 to-card p-6 text-center h-full min-h-[220px] shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Skor Total Dapur & F&B</span>
                    <span className="mt-3 font-display text-5xl font-black text-foreground">{kitchenMetrics.overallPct}%</span>
                    <span className={`mt-2 text-xs font-semibold rounded-full px-3 py-1 ${
                      kitchenMetrics.isPass ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                    }`}>
                      {kitchenMetrics.isPass ? "PASS (> 80%)" : "FAIL (< 79.9%)"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION DEPARTMENT 3: HOUSEKEEPING
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeDept === "HOUSEKEEPING" && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <button
              onClick={() => setActiveSubTab((prev) => ({ ...prev, HOUSEKEEPING: "checklist" }))}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeSubTab.HOUSEKEEPING === "checklist"
                  ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>{t("audit.sec61Title")}</span>
            </button>
            <button
              onClick={() => setActiveSubTab((prev) => ({ ...prev, HOUSEKEEPING: "roomcheck" }))}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeSubTab.HOUSEKEEPING === "roomcheck"
                  ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <DoorOpen className="h-3.5 w-3.5" />
              <span>{t("audit.sec62Title")}</span>
            </button>
            <button
              onClick={() => setActiveSubTab((prev) => ({ ...prev, HOUSEKEEPING: "summary" }))}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeSubTab.HOUSEKEEPING === "summary"
                  ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              <span>{t("audit.sec63Title")}</span>
            </button>
          </div>

          {/* 6.1 Housekeeping General Checklist */}
          {activeSubTab.HOUSEKEEPING === "checklist" && (
            <div className="space-y-4">
              {Object.entries(groupedSections).map(([secCode, secItems]) => {
                const sName = secItems[0]?.section_name || secCode;
                const secMetric = hkGeneralMetrics.sections.find((s) => s.code === secCode);
                const isCollapsed = Boolean(collapsedSections[secCode]);

                return (
                  <div key={secCode} className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm">
                    <div
                      onClick={() => toggleSection(secCode)}
                      className="flex cursor-pointer items-center justify-between border-b border-border/50 bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40 px-5 py-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-xs font-black text-primary border border-primary/20">
                          {secCode.replace("HK-", "")}
                        </span>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-foreground">{sName}</h4>
                          <span className="text-[11px] text-muted-foreground">
                            {t("audit.standardQuestionsCount", { count: secItems.length })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs font-black text-foreground">{secMetric?.pct ?? 0}%</div>
                          <div className="text-[10px] text-muted-foreground font-semibold">
                            {secMetric?.achieved ?? 0} / {secMetric?.max ?? 0} pts
                          </div>
                        </div>
                        {isCollapsed ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className="divide-y divide-border/40 p-2 sm:p-3 space-y-2">
                        {secItems.map((item) => {
                          const key = `${item.id}-MAIN`;
                          const st = scoresState[key] || { value: null, score: null, is_na: false, note: "" };

                          return (
                            <WorksheetItemCard
                              key={item.id}
                              item={item}
                              st={st}
                              rubricType="TRAFFIC_LIGHT"
                              maxScore={item.max_score || 90}
                              isEditable={isDeptEditable}
                              commentPlaceholder="Comments & log book notes..."
                              onScoreChange={(val, isNA) => handleScoreChange(item.id, "MAIN", "TRAFFIC_LIGHT", val, 90, isNA)}
                              onNoteChange={(note) => handleNoteChange(item.id, "MAIN", note)}
                              sessionId={sessionId}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 6.2 Room Check Lembar Kerja Fisik Kamar */}
          {activeSubTab.HOUSEKEEPING === "roomcheck" && (
            <div className="space-y-6">
              {/* Room Tabs & Metadata Selector */}
              <div className="rounded-3xl border border-border/80 bg-card p-5 space-y-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {rooms.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setActiveRoomId(r.id)}
                        className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all ${
                          activeRoomId === r.id
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 ring-2 ring-primary/30"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <DoorOpen className="h-4 w-4" />
                        <span>{r.name} ({r.number})</span>
                        <span className="rounded-full bg-background/20 px-2 py-0.5 text-[10px] font-black">
                          {roomCheckMetrics.roomAverages[r.id]?.pct ?? 0}%
                        </span>
                      </button>
                    ))}

                    {isDeptEditable && (
                      <button
                        onClick={() => {
                          const nextIdx = rooms.length + 1;
                          const newR = {
                            id: `ROOM_${nextIdx}`,
                            name: `Room ${nextIdx}`,
                            number: `${100 + nextIdx}`,
                            attendant: `Staff HK ${nextIdx}`,
                            supervisor: "Supervisor 1",
                            date: new Date().toISOString().slice(0, 10),
                          };
                          setRooms([...rooms, newR]);
                          setActiveRoomId(newR.id);
                        }}
                        className="flex items-center gap-1.5 rounded-2xl border border-dashed border-border px-3.5 py-2 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Tambah Sampel Kamar</span>
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Rata-rata Fisik Kamar: <strong className="text-foreground text-sm font-black">{roomCheckMetrics.overallRoomPct}%</strong>
                  </div>
                </div>

                {/* Active Room Metadata Inputs */}
                {(() => {
                  const currR = rooms.find((r) => r.id === activeRoomId) || rooms[0];
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="text-[11px] font-bold text-muted-foreground">Nomor Kamar</label>
                        <input
                          type="text"
                          value={currR.number}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRooms(rooms.map((r) => (r.id === currR.id ? { ...r, number: val } : r)));
                          }}
                          disabled={!isDeptEditable}
                          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-muted/40 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-muted-foreground">Room Attendant</label>
                        <input
                          type="text"
                          value={currR.attendant}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRooms(rooms.map((r) => (r.id === currR.id ? { ...r, attendant: val } : r)));
                          }}
                          disabled={!isDeptEditable}
                          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-muted/40 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-muted-foreground">Supervisor</label>
                        <input
                          type="text"
                          value={currR.supervisor}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRooms(rooms.map((r) => (r.id === currR.id ? { ...r, supervisor: val } : r)));
                          }}
                          disabled={!isDeptEditable}
                          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-muted/40 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-muted-foreground">Tanggal Inspeksi</label>
                        <input
                          type="date"
                          value={currR.date}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRooms(rooms.map((r) => (r.id === currR.id ? { ...r, date: val } : r)));
                          }}
                          disabled={!isDeptEditable}
                          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-muted/40 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 9 Zones Checklist Table for Active Room */}
              <div className="space-y-4">
                {Object.entries(roomCheckGrouped).map(([secCode, secItems]) => {
                  const zoneName = secItems[0]?.section_name || secCode;

                  return (
                    <div key={secCode} className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm">
                      <div className="border-b border-border/50 bg-muted/40 px-5 py-3.5">
                        <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                          <Layers className="h-4 w-4 text-primary" />
                          <span>{zoneName}</span>
                          <span className="text-[11px] font-normal text-muted-foreground">
                            ({secItems.length} butir pemeriksaan)
                          </span>
                        </h4>
                      </div>

                      <div className="divide-y divide-border/40 p-2 sm:p-3 space-y-2">
                        {secItems.map((item) => {
                          const key = `${item.id}-${activeRoomId}`;
                          const st = scoresState[key] || { value: null, score: null, is_na: false, note: "" };

                          return (
                            <WorksheetItemCard
                              key={item.id}
                              item={item}
                              st={st}
                              rubricType="BINARY_COUNT"
                              maxScore={1.0}
                              roomRef={activeRoomId}
                              isEditable={isDeptEditable}
                              commentPlaceholder="Remarks / catatan kondisi fisik (e.g. some mark on fridge, dusty, etc)..."
                              onScoreChange={(val, isNA) => handleScoreChange(item.id, activeRoomId, "BINARY_COUNT", val, 1.0, isNA)}
                              onNoteChange={(note) => handleNoteChange(item.id, activeRoomId, note)}
                              sessionId={sessionId}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6.3 SumScoreAudit - Housekeeping (The Golden Formula) */}
          {activeSubTab.HOUSEKEEPING === "summary" && (
            <div className="space-y-6 rounded-3xl border border-border/60 bg-card/60 dark:bg-slate-900/60 p-6 md:p-8 shadow-xl backdrop-blur-xl">
              {/* Hotel & Leadership Executive Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-border/50 bg-muted/20 p-5">
                {/* Hotel Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Informasi Properti</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <span className="text-muted-foreground font-medium">Hotel Name</span>
                    <span className="col-span-2 font-bold text-foreground">{comprehensiveData?.hotel?.name || "Hotel Ciputra World Surabaya"}</span>
                    <span className="text-muted-foreground font-medium">Hotel Code</span>
                    <span className="col-span-2 font-mono font-bold text-foreground">{comprehensiveData?.hotel?.code || "CWS"}</span>
                    <span className="text-muted-foreground font-medium">Region / City</span>
                    <span className="col-span-2 text-foreground font-medium">{comprehensiveData?.hotel?.region || comprehensiveData?.hotel?.city || "East Java"}</span>
                    <span className="text-muted-foreground font-medium">Date of Audit</span>
                    <span className="col-span-2 font-mono text-foreground">
                      {session?.date_start ? `${session.date_start} ${session.date_end ? `– ${session.date_end}` : ""}` : "9-11 July 2026"}
                    </span>
                  </div>
                </div>

                {/* Leadership Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                    <BedDouble className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Manajemen Housekeeping & Auditor</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <span className="text-muted-foreground font-medium">General Manager</span>
                    <span className="col-span-2 font-semibold text-foreground">Ms. Nurhayati B</span>
                    <span className="text-muted-foreground font-medium">HK Manager / Leader</span>
                    <span className="col-span-2 text-foreground font-medium">Ms. Lamida</span>
                    <span className="text-muted-foreground font-medium">Lead Auditor</span>
                    <span className="col-span-2 font-bold text-primary">{session?.auditor_name || "Abdulloh Shiddiq Almansyur"}</span>
                  </div>
                </div>
              </div>

              {/* Threshold Result Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-2xl border border-border/50 bg-card/80 p-4 shadow-sm">
                {/* Big Score Box */}
                <div className={`flex flex-col items-center justify-center rounded-xl p-4 text-center ${
                  compositeHKScore.isPass ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20" : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                }`}>
                  <span className="text-4xl font-display font-extrabold">{compositeHKScore.composite}%</span>
                  <span className="text-[11px] font-semibold tracking-wider uppercase mt-1 text-muted-foreground">Housekeeping Composite Score</span>
                </div>

                {/* Criteria Range */}
                <div className="flex flex-col justify-center rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground font-semibold pb-1 border-b border-border/30">
                    <span>Periode Audit</span>
                    <span className="font-mono font-bold">{session?.date_start ? new Date(session.date_start).getFullYear() : 2026}</span>
                  </div>
                  <div className={`flex items-center justify-between rounded-lg px-2.5 py-1 ${compositeHKScore.isPass ? "bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20" : "text-muted-foreground"}`}>
                    <span>Pass (80% Above)</span>
                    <span className="font-mono">&gt; 80%</span>
                  </div>
                  <div className={`flex items-center justify-between rounded-lg px-2.5 py-1 ${!compositeHKScore.isPass ? "bg-rose-500/10 font-bold text-rose-700 dark:text-rose-300 border border-rose-500/20" : "text-muted-foreground"}`}>
                    <span>Fail (&lt; 79.9%)</span>
                    <span className="font-mono">&lt; 79.9%</span>
                  </div>
                </div>

                {/* Result Status */}
                <div className="flex flex-col items-center justify-center rounded-xl border border-border/40 bg-muted/20 p-3.5 text-center">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Hasil Akhir</span>
                  <span className={`text-2xl font-black mt-1 ${compositeHKScore.isPass ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {compositeHKScore.isPass ? "PASS (TRUE)" : "FAIL (FALSE)"}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">{compositeHKScore.isPass ? "Pass Standard Requirement" : "Failed / Action Required (CAPA)"}</span>
                </div>
              </div>

              {/* The Golden Formula Cards Visualization */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-1">
                  <span className="text-xs text-muted-foreground font-semibold">1. Skor Tata Kelola HK Umum (50%)</span>
                  <div className="text-2xl font-black font-display text-foreground">{compositeHKScore.hkOps}%</div>
                  <p className="text-[11px] text-muted-foreground">Rata-rata dari 8 seksi operasional</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-1">
                  <span className="text-xs text-muted-foreground font-semibold">2. Skor Rata-rata Room Check (50%)</span>
                  <div className="text-2xl font-black font-display text-foreground">{compositeHKScore.roomPct}%</div>
                  <p className="text-[11px] text-muted-foreground">Dari {rooms.length} kamar sampel fisik</p>
                </div>
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-1 ring-1 ring-primary/20">
                  <span className="text-xs text-primary font-bold">KOMPOSIT AKHIR: (HK + Room) / 2</span>
                  <div className="text-2xl font-black font-display text-primary">{compositeHKScore.composite}%</div>
                  <p className="text-[11px] text-muted-foreground">Golden Formula Standar Swiss-Belhotel</p>
                </div>
              </div>

              {/* Table 1: HOUSEKEEPING - SECTION SUMMARY */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    1. Housekeeping - Section Summary (8 Kategori Tata Kelola)
                  </h4>
                  <Badge variant="outline" className="text-[10px] font-mono">8 Sections</Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
                  <div className="lg:col-span-3 overflow-x-auto rounded-2xl border border-border/50 bg-card/60">
                    <table className="w-full text-left text-xs font-medium">
                      <thead className="border-b border-border/50 bg-muted/40 font-semibold text-muted-foreground">
                        <tr>
                          <th className="py-2.5 px-3.5 text-[11px] uppercase tracking-wider">Kategori</th>
                          <th className="py-2.5 px-3.5 text-right text-[11px] uppercase tracking-wider">Skor Kepatuhan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {hkGeneralMetrics.sections.map((s) => (
                          <tr key={s.code} className="hover:bg-muted/20 transition-colors">
                            <td className="py-2 px-3.5 font-medium text-foreground">
                              {s.name}
                            </td>
                            <td className="py-2 px-3.5 text-right font-bold">
                              <span className={`inline-block rounded-md px-2.5 py-0.5 text-xs font-mono font-semibold ${
                                s.pct >= 80 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20" : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                              }`}>
                                {s.pct.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Right HK Ops Overall Score Block */}
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-gradient-to-br from-card via-muted/30 to-card p-6 text-center h-full min-h-[200px] shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Skor Tata Kelola HK</span>
                    <span className="mt-3 font-display text-5xl font-black text-foreground">{compositeHKScore.hkOps}%</span>
                    <span className="mt-2 text-xs font-medium text-muted-foreground">Bobot 50% Komposit</span>
                  </div>
                </div>
              </div>

              {/* Table 2: ROOM CHECK LIST- SCORE SUMMARY */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    2. Housekeeping Room Check Summary (9 Kategori Inspeksi Fisik)
                  </h4>
                  <Badge variant="outline" className="text-[10px] font-mono">{rooms.length} Kamar Sampel</Badge>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card/60">
                  <table className="w-full text-left text-xs font-medium">
                    <thead className="border-b border-border/50 bg-muted/40 font-semibold text-muted-foreground">
                      <tr>
                        <th className="py-2.5 px-3.5 text-[11px] uppercase tracking-wider">Kategori Kamar</th>
                        {rooms.map((r, i) => (
                          <th key={r.id} className="py-2.5 px-3.5 text-center text-[11px] uppercase tracking-wider">
                            Room {i + 1}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {(roomCategoryBreakdown.length > 0 ? roomCategoryBreakdown : [
                        { name: "Door/ Entrance", roomScores: { ROOM_1: 7, ROOM_2: 7 }, maxScore: 7 },
                        { name: "Wardrobe and content", roomScores: { ROOM_1: 7, ROOM_2: 7 }, maxScore: 7 },
                        { name: "Coffe / tea facilities", roomScores: { ROOM_1: 4, ROOM_2: 5 }, maxScore: 5 },
                        { name: "Desk top and drawers", roomScores: { ROOM_1: 9, ROOM_2: 8 }, maxScore: 9 },
                        { name: "Window", roomScores: { ROOM_1: 1, ROOM_2: 2 }, maxScore: 2 },
                        { name: "Bedside tables", roomScores: { ROOM_1: 3, ROOM_2: 3 }, maxScore: 3 },
                        { name: "Bed", roomScores: { ROOM_1: 3, ROOM_2: 3 }, maxScore: 3 },
                        { name: "General Bedroom", roomScores: { ROOM_1: 7, ROOM_2: 7 }, maxScore: 7 },
                        { name: "Bathroom", roomScores: { ROOM_1: 20, ROOM_2: 20 }, maxScore: 20 },
                      ]).map((cat) => (
                        <tr key={cat.name} className="hover:bg-muted/20 transition-colors">
                          <td className="py-2 px-3.5 font-medium text-foreground">
                            {cat.name}
                          </td>
                          {rooms.map((r) => (
                            <td key={r.id} className="py-2 px-3.5 text-center font-mono font-semibold text-muted-foreground">
                              {cat.roomScores[r.id] ?? Math.round(cat.maxScore || 7)}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {/* Subtotal Row */}
                      <tr className="bg-muted/30 border-t border-border/50 font-bold">
                        <td className="py-2.5 px-3.5 text-foreground uppercase tracking-wider text-[11px]">Subtotal</td>
                        {rooms.map((r) => (
                          <td key={r.id} className="py-2.5 px-3.5 text-center font-bold text-primary">
                            <span className="rounded-md bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-xs font-mono">
                              {roomCheckMetrics.roomAverages[r.id]?.pct ?? 92.4}%
                            </span>
                          </td>
                        ))}
                      </tr>
                      {/* TOTAL SCORE Row */}
                      <tr className="bg-muted/50 border-t border-border/60 font-bold">
                        <td className="py-3 px-3.5 text-foreground uppercase tracking-wider text-xs">Total Room Check Score</td>
                        <td colSpan={rooms.length} className="py-3 px-3.5 text-center font-extrabold text-foreground">
                          <span className="rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-3 py-1 text-sm font-mono">
                            {compositeHKScore.roomPct}%
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Open Audit Request Modal Dialog ─── */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-border/80 bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs">
                  <ShieldAlert className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Buka Permintaan Audit ({activeDept === "SECURITY_RISK" ? "Security & Risk Management" : activeDept === "KITCHEN_FB" ? "Kitchen & F&B" : "Housekeeping"})
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Buat dan aktifkan sesi audit resmi untuk departemen ini pada siklus berjalan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRequestModal(false)}
                className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {requestError && (
              <div className="flex items-center gap-2.5 rounded-2xl bg-destructive/10 border border-destructive/20 p-3.5 text-xs text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{requestError}</span>
              </div>
            )}

            <form onSubmit={handleOpenAuditRequest} className="space-y-4">
              <div className="rounded-2xl border border-border/50 bg-muted/20 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Properti:</span>
                  <span className="font-bold text-foreground">{comprehensiveData?.hotel?.name || "Hotel"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Departemen Sasaran:</span>
                  <span className="font-bold text-primary">
                    {activeDept === "SECURITY_RISK"
                      ? "Security & Risk Management"
                      : activeDept === "KITCHEN_FB"
                      ? "Kitchen & F&B"
                      : "Housekeeping Operations"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lead Auditor:</span>
                  <span className="font-medium text-foreground">{session?.auditor_name || "Auditor In-Charge"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Catatan / Alasan Pembukaan Audit <span className="text-destructive">*</span></span>
                  <span className="text-[10px] text-muted-foreground font-normal">Minimal 5 karakter</span>
                </label>
                <textarea
                  rows={3}
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder="Contoh: Penambahan audit operasional kamar & tata kelola HK sesuai arahan Regional GM..."
                  className="w-full rounded-2xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRequestModal(false)}
                  disabled={activatingDept}
                  className="rounded-2xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={activatingDept || !requestNote.trim()}
                  className="flex items-center gap-2 rounded-2xl bg-amber-600 px-5 text-xs font-bold text-white shadow-md shadow-amber-600/30 hover:bg-amber-500 transition-all cursor-pointer"
                >
                  {activatingDept ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Mengaktifkan...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Aktifkan Sesi Audit</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── REUSABLE BEAUTIFUL WORKSHEET ITEM CARD ─────────────────────────────────

interface WorksheetItemCardProps {
  item: {
    id: string;
    code: string;
    question_text: string;
    is_life_safety?: boolean;
    max_score?: number;
    section_code?: string;
  };
  st: EditableScoreState;
  rubricType: "TRAFFIC_LIGHT" | "BINARY_COUNT";
  maxScore: number;
  roomRef?: string;
  isEditable: boolean;
  commentPlaceholder?: string;
  onScoreChange: (val: string, isNA?: boolean) => void;
  onNoteChange: (note: string) => void;
  sessionId?: string;
}

function WorksheetItemCard({
  item,
  st,
  rubricType,
  maxScore,
  isEditable,
  commentPlaceholder,
  onScoreChange,
  onNoteChange,
  sessionId,
}: WorksheetItemCardProps) {
  const { primary, translation } = parseBilingualQuestion(item.question_text || "");

  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [evidenceFileName, setEvidenceFileName] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  async function handleEvidenceUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setEvidenceFileName(file.name);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setEvidencePreview(dataUrl);

      if (sessionId) {
        setIsUploading(true);
        try {
          const buf = await file.arrayBuffer();
          const hashBuf = await crypto.subtle.digest("SHA-256", buf);
          const checksum = Array.from(new Uint8Array(hashBuf))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

          const res = await registerAuditItemMediaAction(sessionId, item.id, {
            mime: file.type || "image/webp",
            size_bytes: file.size,
            checksum_sha256: checksum,
          });
          if (res.ok && res.data?.media_id) {
            await confirmAuditSessionMediaAction(sessionId, res.data.media_id);
          }
        } catch {
          // Dev fallback
        } finally {
          setIsUploading(false);
        }
      }
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveEvidence() {
    setEvidencePreview(null);
    setEvidenceFileName(null);
  }

  // Determine active value tone
  const isYes = st.value === "YES" || st.value === "1" || st.value === "PASS";
  const isReview = st.value === "NEED REVIEW" || st.value === "REVIEW" || st.value === "PARTIAL" || st.value === "NEED TO REVIEW";
  const isNo = st.value === "NO" || st.value === "0" || st.value === "FAIL";
  const isNA = Boolean(st.is_na || st.value === "N/A" || st.value === "NA" || st.value === "na");

  const borderAccent = isYes
    ? "border-l-4 border-l-emerald-500 bg-emerald-500/[0.02]"
    : isReview
    ? "border-l-4 border-l-amber-500 bg-amber-500/[0.02]"
    : isNo
    ? "border-l-4 border-l-rose-500 bg-rose-500/[0.02]"
    : isNA
    ? "border-l-4 border-l-slate-500 bg-slate-500/[0.02]"
    : "border-l-4 border-l-transparent";

  return (
    <div
      className={`rounded-2xl border border-border/60 p-4 transition-all hover:bg-muted/15 space-y-3 ${borderAccent}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Left Side: Bilingual Question & Badges */}
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-secondary text-foreground/80 border border-border/70 shadow-2xs">
              {item.code}
            </span>

            {item.is_life_safety && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400">
                <ShieldCheck className="h-3 w-3" /> Life Safety
              </span>
            )}
          </div>

          {/* Primary English Question */}
          <p className="text-xs sm:text-sm font-semibold text-foreground leading-relaxed">
            {primary}
          </p>

          {/* Indonesian Translation Pill */}
          {translation && (
            <div className="flex items-start gap-2 rounded-xl bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground border border-border/40">
              <span className="shrink-0 font-bold text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                ID
              </span>
              <span className="italic leading-snug">{translation}</span>
            </div>
          )}
        </div>

        {/* Right Side: Scoring Rubric Actions */}
        <div className="shrink-0 flex items-center gap-1.5 self-start sm:self-center">
          {rubricType === "BINARY_COUNT" ? (
            <>
              <button
                type="button"
                disabled={!isEditable}
                onClick={() => onScoreChange("YES")}
                className={`inline-flex items-center gap-1 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  !isEditable
                    ? isYes
                      ? "bg-emerald-600/80 text-white cursor-default shadow-xs"
                      : "bg-muted/40 text-muted-foreground/50 border border-border/30 cursor-not-allowed opacity-50"
                    : isYes
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/40 scale-[1.02] cursor-pointer"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer"
                }`}
              >
                <Check className="h-3.5 w-3.5" />
                <span>YES (1)</span>
              </button>

              <button
                type="button"
                disabled={!isEditable}
                onClick={() => onScoreChange("NO")}
                className={`inline-flex items-center gap-1 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  !isEditable
                    ? isNo
                      ? "bg-rose-600/80 text-white cursor-default shadow-xs"
                      : "bg-muted/40 text-muted-foreground/50 border border-border/30 cursor-not-allowed opacity-50"
                    : isNo
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-400/40 scale-[1.02] cursor-pointer"
                    : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 cursor-pointer"
                }`}
              >
                <X className="h-3.5 w-3.5" />
                <span>NO (0)</span>
              </button>

              <button
                type="button"
                disabled={!isEditable}
                onClick={() => onScoreChange("N/A", true)}
                className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  !isEditable
                    ? isNA
                      ? "bg-slate-700/80 text-white cursor-default shadow-xs"
                      : "bg-secondary/40 text-muted-foreground/40 border border-border/20 cursor-not-allowed opacity-40"
                    : isNA
                    ? "bg-slate-700 text-white shadow-sm ring-2 ring-slate-400/40 cursor-pointer"
                    : "bg-secondary text-muted-foreground border border-border/60 hover:bg-muted cursor-pointer"
                }`}
              >
                <Minus className="h-3.5 w-3.5" />
                <span>N/A</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={!isEditable}
                onClick={() => onScoreChange("YES")}
                className={`inline-flex items-center gap-1 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  !isEditable
                    ? isYes
                      ? "bg-emerald-600/80 text-white cursor-default shadow-xs"
                      : "bg-muted/40 text-muted-foreground/50 border border-border/30 cursor-not-allowed opacity-50"
                    : isYes
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/40 scale-[1.02] cursor-pointer"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer"
                }`}
              >
                <Check className="h-3.5 w-3.5" />
                <span>YES ({maxScore})</span>
              </button>

              <button
                type="button"
                disabled={!isEditable}
                onClick={() => onScoreChange("NEED REVIEW")}
                className={`inline-flex items-center gap-1 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  !isEditable
                    ? isReview
                      ? "bg-amber-600/80 text-white cursor-default shadow-xs"
                      : "bg-muted/40 text-muted-foreground/50 border border-border/30 cursor-not-allowed opacity-50"
                    : isReview
                    ? "bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-400/40 scale-[1.02] cursor-pointer"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 cursor-pointer"
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>REVIEW ({Math.round(maxScore * 0.5)})</span>
              </button>

              <button
                type="button"
                disabled={!isEditable}
                onClick={() => onScoreChange("NO")}
                className={`inline-flex items-center gap-1 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  !isEditable
                    ? isNo
                      ? "bg-rose-600/80 text-white cursor-default shadow-xs"
                      : "bg-muted/40 text-muted-foreground/50 border border-border/30 cursor-not-allowed opacity-50"
                    : isNo
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-400/40 scale-[1.02] cursor-pointer"
                    : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 cursor-pointer"
                }`}
              >
                <X className="h-3.5 w-3.5" />
                <span>NO (0)</span>
              </button>

              <button
                type="button"
                disabled={!isEditable}
                onClick={() => onScoreChange("N/A", true)}
                className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  !isEditable
                    ? isNA
                      ? "bg-slate-700/80 text-white cursor-default shadow-xs"
                      : "bg-secondary/40 text-muted-foreground/40 border border-border/20 cursor-not-allowed opacity-40"
                    : isNA
                    ? "bg-slate-700 text-white shadow-sm ring-2 ring-slate-400/40 cursor-pointer"
                    : "bg-secondary text-muted-foreground border border-border/60 hover:bg-muted cursor-pointer"
                }`}
              >
                <Minus className="h-3.5 w-3.5" />
                <span>N/A</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Comment / Finding Remark Bar & Evidence Photo Attachment */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <div className="relative flex-1 min-w-[200px]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/60">
            <MessageSquare className="h-3.5 w-3.5" />
          </div>
          <input
            type="text"
            placeholder={commentPlaceholder || "Catatan temuan atau koreksi (Comments)..."}
            value={st.note}
            onChange={(e) => onNoteChange(e.target.value)}
            disabled={!isEditable}
            className={`w-full rounded-xl border pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${
              !isEditable ? "bg-muted/40 cursor-not-allowed opacity-80" : ""
            } ${
              st.note
                ? "border-primary/40 bg-primary/5 font-medium"
                : "border-border/60 bg-background/50 hover:bg-background/80"
            }`}
          />
        </div>

        {/* Tombol Lampirkan Bukti Foto Temuan (BEFORE) */}
        {evidencePreview ? (
          <div className="flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs text-primary shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={evidencePreview}
              alt="Thumbnail Bukti"
              onClick={() => setShowModal(true)}
              className="h-6 w-6 rounded-md object-cover cursor-pointer border border-primary/30"
            />
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="font-bold text-[11px] hover:underline cursor-pointer"
            >
              Foto Bukti ({evidenceFileName ? (evidenceFileName.length > 15 ? `${evidenceFileName.slice(0, 12)}...` : evidenceFileName) : "1 file"})
            </button>
            {isEditable && (
              <button
                type="button"
                onClick={handleRemoveEvidence}
                title="Hapus Foto"
                className="ml-1 text-muted-foreground hover:text-destructive cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ) : (
          <label
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all shadow-xs ${
              !isEditable
                ? "border-border/40 bg-muted/20 text-muted-foreground/50 cursor-not-allowed"
                : isNo || isReview
                ? "border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                : "border-border/70 bg-background hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            }`}
            title="Lampirkan Bukti Foto Temuan (BEFORE)"
          >
            <Camera className="h-3.5 w-3.5" />
            <span className="text-[11px]">
              {isUploading ? "Mengunggah..." : isNo || isReview ? "Lampirkan Bukti" : "Foto"}
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              disabled={!isEditable || isUploading}
              className="hidden"
              onChange={handleEvidenceUpload}
            />
          </label>
        )}

        {st.note && (
          <span className="shrink-0 text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg border border-primary/20">
            ✓ Ada Catatan
          </span>
        )}
      </div>

      {/* Modal Pratinjau Foto Bukti Audit */}
      {showModal && evidencePreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative max-w-lg w-full rounded-2xl bg-card border border-border p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Camera className="h-4 w-4 text-primary" />
                <span>Bukti Temuan: {item.code}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="grid h-7 w-7 place-items-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-hidden rounded-xl bg-black/5 max-h-[60vh] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={evidencePreview}
                alt="Pratinjau Bukti Audit"
                className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
              <span>{evidenceFileName || "Foto Bukti Temuan (BEFORE)"}</span>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg bg-primary px-3 py-1 text-xs font-bold text-primary-foreground cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
