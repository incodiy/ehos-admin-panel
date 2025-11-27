"use client";

import { useState, useMemo } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  Save,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  bulkScoreItemsAction,
  type AuditItemScoreRow,
  type AuditSessionRow,
  type ScoreUpsertItem,
} from "@/app/actions/audit";

interface AuditScoringWorksheetProps {
  sessionId: string;
  session?: AuditSessionRow;
  items: AuditItemScoreRow[];
  sectionNames?: Record<string, string>;
  isEditable: boolean;
  onSaveSuccess?: () => void;
}

interface EditableScoreState {
  value: string | null;
  score: number | null;
  is_na: boolean;
  note: string;
}

export function AuditScoringWorksheet({
  sessionId,
  items,
  sectionNames = {},
  isEditable,
  onSaveSuccess,
}: AuditScoringWorksheetProps) {

  // Local state for all item scores indexed by item_id
  const [scoresState, setScoresState] = useState<Record<string, EditableScoreState>>(() => {
    const map: Record<string, EditableScoreState> = {};
    for (const it of items) {
      const key = String(it.item_id || it.id);
      map[key] = {
        value: it.value ?? null,
        score: it.score != null ? Number(it.score) : null,
        is_na: Boolean(it.is_na),
        note: it.note ?? "",
      };
    }
    return map;
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Group items by section_code
  const groupedSections = useMemo(() => {
    const groups: Record<string, AuditItemScoreRow[]> = {};
    for (const item of items) {
      const secCode = item.section_code || "GENERAL";
      if (!groups[secCode]) {
        groups[secCode] = [];
      }
      groups[secCode].push(item);
    }
    // Sort items inside section by sort_order or code
    for (const secCode of Object.keys(groups)) {
      groups[secCode].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }
    return groups;
  }, [items]);

  // Handle score change for a specific item
  const handleSetScore = (
    itemId: string,
    rubricType: string,
    value: string,
    maxScore: number,
    isNA: boolean = false
  ) => {
    if (!isEditable) return;

    let computedScore: number | null = null;
    const cleanVal = isNA ? "N/A" : value.toUpperCase();

    if (isNA) {
      computedScore = null;
    } else if (rubricType === "TRAFFIC_LIGHT") {
      if (cleanVal === "YES" || cleanVal === "PASS") computedScore = maxScore;
      else if (cleanVal === "NEED REVIEW" || cleanVal === "REVIEW" || cleanVal === "PARTIAL")
        computedScore = maxScore * 0.5;
      else if (cleanVal === "NO" || cleanVal === "FAIL") computedScore = 0;
    } else if (rubricType === "BINARY_COUNT") {
      if (cleanVal === "YES" || cleanVal === "1" || cleanVal === "PASS") computedScore = maxScore;
      else computedScore = 0;
    } else if (rubricType === "NUMERIC_SCALE") {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        computedScore = Math.min(Math.max(0, num), maxScore);
      }
    }

    setScoresState((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || { note: "" }),
        value: cleanVal,
        score: computedScore,
        is_na: isNA,
      },
    }));
    setSaveSuccess(false);
  };

  const handleSetNote = (itemId: string, note: string) => {
    if (!isEditable) return;
    setScoresState((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || { value: null, score: null, is_na: false }),
        note,
      },
    }));
    setSaveSuccess(false);
  };

  // Live Section Stats Calculation
  const sectionStats = useMemo(() => {
    const stats: Record<string, { achieved: number; max: number; pct: number; answered: number; total: number }> =
      {};

    for (const [secCode, secItems] of Object.entries(groupedSections)) {
      let achieved = 0;
      let maxPossible = 0;
      let answered = 0;

      for (const item of secItems) {
        const key = String(item.item_id || item.id);
        const st = scoresState[key];
        const itemMax = Number(item.max_score ?? 90);

        if (st && st.value !== null) {
          answered += 1;
        }

        if (st && st.is_na) {
          // N/A is excluded from both achieved and max
          continue;
        }

        if (st && st.score != null) {
          achieved += st.score;
        }
        maxPossible += itemMax;
      }

      const pct = maxPossible > 0 ? (achieved / maxPossible) * 100 : 100;
      stats[secCode] = {
        achieved,
        max: maxPossible,
        pct: Math.round(pct * 10) / 10,
        answered,
        total: secItems.length,
      };
    }
    return stats;
  }, [groupedSections, scoresState]);

  // Overall Live Stats
  const overallStats = useMemo(() => {
    let totalAchieved = 0;
    let totalMax = 0;
    let totalAnswered = 0;
    const totalQuestions = items.length;
    let lifeSafetyFails = 0;

    for (const item of items) {
      const key = String(item.item_id || item.id);
      const st = scoresState[key];
      const itemMax = Number(item.max_score ?? 90);

      if (st && st.value !== null) {
        totalAnswered += 1;
      }

      if (item.is_life_safety && st && st.score === 0) {
        lifeSafetyFails += 1;
      }

      if (st && st.is_na) {
        continue;
      }

      if (st && st.score != null) {
        totalAchieved += st.score;
      }
      totalMax += itemMax;
    }

    const pct = totalMax > 0 ? (totalAchieved / totalMax) * 100 : 100;
    return {
      totalAchieved,
      totalMax,
      pct: Math.round(pct * 10) / 10,
      totalAnswered,
      totalQuestions,
      lifeSafetyFails,
      isPass: lifeSafetyFails === 0 && pct >= 80.0,
    };
  }, [items, scoresState]);

  // Save draft scores to backend
  const handleSaveDraft = async () => {
    if (!sessionId) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const payload: ScoreUpsertItem[] = items.map((it) => {
        const key = String(it.item_id || it.id);
        const st = scoresState[key];
        return {
          item_id: String(it.item_id || it.id),
          room_ref: it.room_ref ?? null,
          value: st?.value ?? null,
          score: st?.score ?? null,
          is_na: st?.is_na ?? false,
          note: st?.note ?? null,
        };
      });

      const res = await bulkScoreItemsAction(sessionId, payload);
      if (!res.ok) {
        setSaveError(res.message || "Gagal menyimpan skor draft");
        return;
      }

      setSaveSuccess(true);
      if (onSaveSuccess) onSaveSuccess();
    } catch {
      setSaveError("Terjadi kendala saat menyimpan draft");
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (secCode: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [secCode]: !prev[secCode],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card: Live Score & Completion Tracker */}
      <div className="rounded-2xl border border-primary/20 bg-card/80 p-5 shadow-elegant backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Lembar Kerja Audit & Scoring Interaktif
                </h3>
                <p className="text-xs text-muted-foreground">
                  Isi skor tiap butir checklist secara langsung. Perubahan skor akan dikomputasi secara real-time.
                </p>
              </div>
            </div>
          </div>

          {/* Action Button: Save Draft */}
          {isEditable && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-glow transition-smooth hover:opacity-90 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                    <span>Tersimpan!</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Simpan Skor Draft</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Live Score Metrics Bar */}
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border/40 pt-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Progres Pengisian
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-lg font-bold tabular-nums text-foreground">
                {overallStats.totalAnswered}
              </span>
              <span className="text-xs text-muted-foreground">
                / {overallStats.totalQuestions} butir
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{
                  width: `${
                    overallStats.totalQuestions > 0
                      ? (overallStats.totalAnswered / overallStats.totalQuestions) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total Poin Dicapai
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-lg font-bold tabular-nums text-foreground">
                {overallStats.totalAchieved}
              </span>
              <span className="text-xs text-muted-foreground">
                / {overallStats.totalMax}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {overallStats.totalQuestions - overallStats.totalAnswered} butir belum dinilai
            </p>
          </div>

          <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Skor Live (%)
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                className={`text-2xl font-black tabular-nums ${
                  overallStats.pct >= 80 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"
                }`}
              >
                {overallStats.pct}%
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                  overallStats.isPass
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-rose-500/10 text-rose-600"
                }`}
              >
                {overallStats.isPass ? "PASS" : "FAIL"}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Life Safety Gate
            </span>
            <div className="mt-1 flex items-center gap-1.5">
              {overallStats.lifeSafetyFails > 0 ? (
                <>
                  <ShieldAlert className="h-5 w-5 text-rose-600" />
                  <span className="text-xs font-bold text-rose-600">
                    {overallStats.lifeSafetyFails} Butir Gagal (Auto FAIL)
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-600">
                    Aman / Terpenuhi
                  </span>
                </>
              )}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Pass minimal ≥ 80.0% & 0 Life-Safety Fail
            </p>
          </div>
        </div>

        {/* Feedback Alert Messages */}
        {saveError && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}
        {saveSuccess && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Skor berhasil disimpan sebagai draft ke sistem.</span>
          </div>
        )}
      </div>

      {/* Sections Accordion / Grouped List */}
      <div className="space-y-4">
        {Object.entries(groupedSections).map(([secCode, secItems]) => {
          const stats = sectionStats[secCode] || { achieved: 0, max: 0, pct: 100, answered: 0, total: 0 };
          const itemSecName = secItems.find((it) => it.section_name)?.section_name;
          const secName = sectionNames[secCode] || itemSecName || secCode;
          const displayTitle = secName !== secCode ? `${secCode} — ${secName}` : secCode;
          const isCollapsed = Boolean(collapsedSections[secCode]);

          return (
            <div
              key={secCode}
              className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all"
            >
              {/* Section Header */}
              <div
                onClick={() => toggleSection(secCode)}
                className="flex cursor-pointer items-center justify-between border-b border-border/40 bg-muted/20 px-5 py-3.5 hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-primary/10 px-2.5 py-1 font-mono text-xs font-bold text-primary">
                    {secCode}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{displayTitle}</h4>
                    <span className="text-[11px] text-muted-foreground">
                      {stats.answered} dari {stats.total} butir terisi
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Section Score Pill */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">Skor Section:</span>
                    <span
                      className={`rounded-lg px-2.5 py-0.5 text-xs font-bold tabular-nums ${
                        stats.pct >= 80
                          ? "bg-emerald-500/10 text-emerald-600"
                          : stats.pct >= 60
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-rose-500/10 text-rose-600"
                      }`}
                    >
                      {stats.pct}% ({stats.achieved}/{stats.max})
                    </span>
                  </div>

                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                  >
                    {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Items List Inside Section */}
              {!isCollapsed && (
                <div className="divide-y divide-border/40">
                  {secItems.map((item, idx) => {
                    const key = String(item.item_id || item.id);
                    const state = scoresState[key] || {
                      value: null,
                      score: null,
                      is_na: false,
                      note: "",
                    };
                    const maxScore = Number(item.max_score ?? 90);
                    const rubricType = item.rubric_type ?? "TRAFFIC_LIGHT";

                    return (
                      <div
                        key={`${item.id}-${idx}`}
                        className={`p-4 transition-colors ${
                          state.value === "NO" || (state.score === 0 && !state.is_na)
                            ? "bg-rose-50/30 dark:bg-rose-950/10"
                            : state.value === "NEED REVIEW" || state.value === "REVIEW"
                            ? "bg-amber-50/20 dark:bg-amber-950/10"
                            : "hover:bg-muted/10"
                        }`}
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          {/* Left Column: Code, Question Text & Badges */}
                          <div className="max-w-2xl flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-primary">
                                {item.code ?? `${secCode}.${idx + 1}`}
                              </span>
                              {item.is_life_safety && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-red-600/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600">
                                  <ShieldAlert className="h-3 w-3" /> LIFE SAFETY
                                </span>
                              )}
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                Rubrik: {rubricType}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                Max: {maxScore} pts
                              </span>
                            </div>

                            <p className="text-xs font-medium leading-relaxed text-foreground">
                              {item.question_text || item.code}
                            </p>

                            {/* Remark / Note Input */}
                            <div className="pt-2">
                              <input
                                type="text"
                                disabled={!isEditable}
                                value={state.note}
                                onChange={(e) => handleSetNote(key, e.target.value)}
                                placeholder={
                                  state.value === "NEED REVIEW" || state.value === "NO"
                                    ? "Wajib isi catatan temuan/remark jika Need Review / No..."
                                    : "Catatan auditor / remark temuan (opsional)..."
                                }
                                className={`w-full rounded-lg border px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 ${
                                  (state.value === "NEED REVIEW" || state.value === "NO") && !state.note
                                    ? "border-amber-400 bg-amber-50/50 focus:ring-amber-500 dark:bg-amber-950/20"
                                    : "border-border/60 bg-background/50 focus:border-primary focus:ring-primary"
                                }`}
                              />
                            </div>
                          </div>

                          {/* Right Column: Scoring Buttons */}
                          <div className="flex shrink-0 flex-wrap items-center gap-1.5 pt-1 lg:pt-0">
                            {rubricType === "TRAFFIC_LIGHT" && (
                              <>
                                {/* YES (90) */}
                                <button
                                  type="button"
                                  disabled={!isEditable}
                                  onClick={() => handleSetScore(key, rubricType, "YES", maxScore, false)}
                                  className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                                    state.value === "YES" && !state.is_na
                                      ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30"
                                      : "border border-border/70 bg-card text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30"
                                  }`}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>YES ({maxScore})</span>
                                </button>

                                {/* NEED REVIEW (45) */}
                                <button
                                  type="button"
                                  disabled={!isEditable}
                                  onClick={() =>
                                    handleSetScore(key, rubricType, "NEED REVIEW", maxScore, false)
                                  }
                                  className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                                    (state.value === "NEED REVIEW" || state.value === "REVIEW") &&
                                    !state.is_na
                                      ? "bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/30"
                                      : "border border-border/70 bg-card text-muted-foreground hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/30"
                                  }`}
                                >
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                  <span>NEED REVIEW ({maxScore * 0.5})</span>
                                </button>

                                {/* NO (0) */}
                                <button
                                  type="button"
                                  disabled={!isEditable}
                                  onClick={() => handleSetScore(key, rubricType, "NO", maxScore, false)}
                                  className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                                    state.value === "NO" && !state.is_na
                                      ? "bg-rose-600 text-white shadow-sm ring-2 ring-rose-600/30"
                                      : "border border-border/70 bg-card text-muted-foreground hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"
                                  }`}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  <span>NO (0)</span>
                                </button>

                                {/* N/A */}
                                <button
                                  type="button"
                                  disabled={!isEditable}
                                  onClick={() => handleSetScore(key, rubricType, "N/A", maxScore, true)}
                                  className={`rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all ${
                                    state.is_na
                                      ? "bg-slate-600 text-white shadow-sm ring-2 ring-slate-600/30"
                                      : "border border-border/70 bg-card text-muted-foreground hover:bg-muted"
                                  }`}
                                >
                                  N/A
                                </button>
                              </>
                            )}

                            {rubricType === "BINARY_COUNT" && (
                              <>
                                <button
                                  type="button"
                                  disabled={!isEditable}
                                  onClick={() => handleSetScore(key, rubricType, "YES", maxScore, false)}
                                  className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                                    state.value === "YES" && !state.is_na
                                      ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30"
                                      : "border border-border/70 bg-card text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700"
                                  }`}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>YES ({maxScore})</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={!isEditable}
                                  onClick={() => handleSetScore(key, rubricType, "NO", maxScore, false)}
                                  className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                                    state.value === "NO" && !state.is_na
                                      ? "bg-rose-600 text-white shadow-sm ring-2 ring-rose-600/30"
                                      : "border border-border/70 bg-card text-muted-foreground hover:bg-rose-50 hover:text-rose-700"
                                  }`}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  <span>NO (0)</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={!isEditable}
                                  onClick={() => handleSetScore(key, rubricType, "N/A", maxScore, true)}
                                  className={`rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all ${
                                    state.is_na
                                      ? "bg-slate-600 text-white shadow-sm"
                                      : "border border-border/70 bg-card text-muted-foreground hover:bg-muted"
                                  }`}
                                >
                                  N/A
                                </button>
                              </>
                            )}

                            {rubricType === "NUMERIC_SCALE" && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  disabled={!isEditable}
                                  value={state.score != null ? state.score : ""}
                                  onChange={(e) =>
                                    handleSetScore(key, rubricType, e.target.value, maxScore, false)
                                  }
                                  placeholder="0"
                                  max={maxScore}
                                  min={0}
                                  className="w-20 rounded-xl border border-border bg-card px-3 py-1.5 text-center text-xs font-bold tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                <span className="text-xs text-muted-foreground">/ {maxScore}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Floating/Sticky Save Button Bar */}
      {isEditable && (
        <div className="sticky bottom-4 z-20 flex items-center justify-between rounded-2xl border border-border/80 bg-card/95 p-4 shadow-elegant backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Skor Terhitung: <strong className="text-foreground">{overallStats.pct}%</strong> (
              {overallStats.totalAnswered}/{overallStats.totalQuestions} butir)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-glow transition-smooth hover:opacity-90 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Simpan Skor Draft</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
