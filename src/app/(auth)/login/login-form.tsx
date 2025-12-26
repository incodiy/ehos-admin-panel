"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Hotel,
  ShieldCheck,
  Sun,
  Moon,
  Building2,
  TrendingUp,
  LayoutGrid,
  ChevronRight,
  Globe,
  Loader2,
} from "lucide-react";
import { CavaForm, type FieldSchema } from "@incodiy/cavaform";
import { loginAction, switchHotelAction, type LoginResult } from "@/app/actions/auth";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import type { Language } from "@/i18n/config";

type Step = "credentials" | "hotels";

interface SystemStats {
  total_hotels: number;
  system_uptime_pct: number;
  total_departments: number;
  system_version: string;
  ticker_items: string[];
}

// ────────────────────────────────────────────────────────────────────────
// Left Info Panel — adaptif light / dark mode sesuai tema aktif
// ────────────────────────────────────────────────────────────────────────
function LeftInfoPanel({
  stats,
  loading,
  isDark,
}: {
  stats: SystemStats | null;
  loading: boolean;
  isDark: boolean;
}) {
  const t = useTranslations();

  const statCards = [
    {
      icon: Building2,
      value: loading ? "—" : stats ? String(stats.total_hotels) : "—",
      label: t("auth.loginPanelStat1Label"),
      desc: t("auth.loginPanelStat1Desc"),
      delay: "0ms",
    },
    {
      icon: TrendingUp,
      value: loading ? "—" : stats ? `${stats.system_uptime_pct}%` : "—",
      label: t("auth.loginPanelStat2Label"),
      desc: t("auth.loginPanelStat2Desc"),
      delay: "120ms",
    },
    {
      icon: LayoutGrid,
      value: loading ? "—" : stats ? String(stats.total_departments) : "—",
      label: t("auth.loginPanelStat3Label"),
      desc: t("auth.loginPanelStat3Desc"),
      delay: "240ms",
    },
  ];

  // Ticker: duplicate items for seamless infinite scroll
  const tickerItems = stats?.ticker_items ?? [t("auth.loginPanelTickerDefault")];
  const tickerDup = [...tickerItems, ...tickerItems];

  return (
    <div
      className="relative hidden lg:flex lg:w-[58%] xl:w-[60%] flex-col overflow-hidden transition-colors duration-300"
      style={{
        background: isDark
          ? "linear-gradient(145deg, oklch(0.06 0.015 168) 0%, oklch(0.10 0.025 162) 28%, oklch(0.16 0.055 158) 60%, oklch(0.22 0.09 155) 100%)"
          : "linear-gradient(145deg, oklch(0.99 0.005 165) 0%, oklch(0.96 0.02 162) 30%, oklch(0.92 0.04 158) 65%, oklch(0.88 0.065 155) 100%)",
        borderRight: isDark
          ? "1px solid oklch(0.66 0.18 162 / 0.15)"
          : "1px solid oklch(0.75 0.08 162 / 0.25)",
      }}
    >
      {/* Hospitality stripes texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: isDark ? 0.04 : 0.03,
          backgroundImage: isDark
            ? "repeating-linear-gradient(115deg, oklch(0.9 0.15 162 / 1) 0 1.5px, transparent 1.5px 24px)"
            : "repeating-linear-gradient(115deg, oklch(0.3 0.12 162 / 1) 0 1.5px, transparent 1.5px 24px)",
        }}
      />

      {/* Floating orbs */}
      <div
        className="animate-float-orb-slow absolute -top-20 -right-20 h-80 w-80 rounded-full pointer-events-none"
        style={{
          background: isDark
            ? "radial-gradient(circle at center, oklch(0.65 0.18 162 / 0.28) 0%, transparent 70%)"
            : "radial-gradient(circle at center, oklch(0.72 0.16 162 / 0.22) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="animate-float-orb-mid absolute bottom-40 -left-16 h-64 w-64 rounded-full pointer-events-none"
        style={{
          background: isDark
            ? "radial-gradient(circle at center, oklch(0.82 0.14 85 / 0.22) 0%, transparent 70%)"
            : "radial-gradient(circle at center, oklch(0.80 0.14 85 / 0.25) 0%, transparent 70%)",
          filter: "blur(36px)",
        }}
      />
      <div
        className="animate-float-orb-fast absolute top-[38%] right-8 h-48 w-48 rounded-full pointer-events-none"
        style={{
          background: isDark
            ? "radial-gradient(circle at center, oklch(0.72 0.16 158 / 0.2) 0%, transparent 70%)"
            : "radial-gradient(circle at center, oklch(0.75 0.15 158 / 0.2) 0%, transparent 70%)",
          filter: "blur(28px)",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col flex-1 px-10 pt-12 pb-0">
        {/* Brand header */}
        <div className="animate-rise mb-12">
          <div className="flex items-center gap-3 mb-3">
            <span
              className="grid h-11 w-11 place-items-center rounded-xl shadow-lg"
              style={{
                background: isDark
                  ? "linear-gradient(135deg, oklch(0.66 0.18 162), oklch(0.82 0.14 85))"
                  : "linear-gradient(135deg, oklch(0.52 0.18 162), oklch(0.65 0.16 85))",
              }}
            >
              <Hotel className="h-5 w-5 text-white" />
            </span>
            <span
              className="font-display text-4xl font-bold tracking-widest"
              style={{
                backgroundImage: isDark
                  ? "linear-gradient(135deg, oklch(0.82 0.18 162), oklch(0.88 0.16 85))"
                  : "linear-gradient(135deg, oklch(0.35 0.15 162), oklch(0.48 0.15 85))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              EHOS
            </span>
          </div>
          <p
            className="text-sm font-medium tracking-wide"
            style={{ color: isDark ? "oklch(0.62 0.10 162)" : "oklch(0.40 0.08 162)" }}
          >
            {t("auth.brandSubtitle")}
          </p>
        </div>

        {/* Tagline */}
        <div className="animate-rise mb-10" style={{ animationDelay: "100ms" }}>
          <h2
            className="font-display text-3xl xl:text-4xl font-bold leading-tight mb-3"
            style={{ color: isDark ? "oklch(0.94 0.02 165)" : "oklch(0.18 0.04 165)" }}
          >
            Satu Platform,
            <br />
            <span
              style={{
                backgroundImage: isDark
                  ? "linear-gradient(90deg, oklch(0.75 0.18 162), oklch(0.85 0.16 85))"
                  : "linear-gradient(90deg, oklch(0.45 0.18 162), oklch(0.58 0.16 85))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Seluruh Operasional.
            </span>
          </h2>
          <p
            className="text-sm leading-relaxed"
            style={{ color: isDark ? "oklch(0.62 0.08 165)" : "oklch(0.42 0.05 165)" }}
          >
            Standarisasi audit, tindak lanjut perbaikan, dan kepatuhan operasional<br />
            seluruh jaringan hotel dalam satu ekosistem digital terpadu.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="animate-count-up rounded-2xl border p-4 flex flex-col gap-2 transition-all duration-200"
              style={{
                background: isDark ? "oklch(0.14 0.02 165 / 0.65)" : "oklch(1 0 0 / 0.85)",
                borderColor: isDark ? "oklch(0.66 0.18 162 / 0.22)" : "oklch(0.70 0.12 162 / 0.35)",
                backdropFilter: "blur(12px)",
                animationDelay: card.delay,
                boxShadow: isDark
                  ? "0 0 0 1px oklch(0.66 0.18 162 / 0.1), inset 0 1px 0 oklch(0.9 0.1 162 / 0.06)"
                  : "0 10px 25px -5px oklch(0.2 0.05 162 / 0.08), 0 0 0 1px oklch(0.70 0.12 162 / 0.15), inset 0 1px 0 oklch(1 0 0 / 0.9)",
              }}
            >
              <span
                className="grid h-8 w-8 place-items-center rounded-lg"
                style={{
                  background: isDark ? "oklch(0.66 0.18 162 / 0.18)" : "oklch(0.92 0.05 162 / 0.9)",
                  color: isDark ? "oklch(0.72 0.16 158)" : "oklch(0.38 0.16 158)",
                }}
              >
                <card.icon className="h-4 w-4" />
              </span>
              <div>
                <p
                  className="font-display text-2xl font-bold tabular-nums"
                  style={{ color: isDark ? "oklch(0.95 0.01 165)" : "oklch(0.16 0.04 165)" }}
                >
                  {loading ? (
                    <Loader2
                      className="h-5 w-5 animate-spin inline-block"
                      style={{ color: isDark ? "oklch(0.66 0.18 162)" : "oklch(0.45 0.18 162)" }}
                    />
                  ) : (
                    card.value
                  )}
                </p>
                <p
                  className="text-xs font-semibold mt-0.5"
                  style={{ color: isDark ? "oklch(0.72 0.14 162)" : "oklch(0.32 0.12 162)" }}
                >
                  {card.label}
                </p>
                <p
                  className="text-[10px] leading-tight mt-1"
                  style={{ color: isDark ? "oklch(0.52 0.06 165)" : "oklch(0.48 0.04 165)" }}
                >
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Feature highlights */}
        <div className="space-y-2.5 mb-10">
          {[
            "Audit multi-departemen dengan scoring otomatis",
            "Alur Four-Eyes CAPA dari temuan hingga selesai",
            "Laporan kepatuhan real-time lintas 106 hotel",
          ].map((feat) => (
            <div key={feat} className="flex items-center gap-2.5">
              <ChevronRight
                className="h-3.5 w-3.5 flex-shrink-0"
                style={{ color: isDark ? "oklch(0.72 0.16 158)" : "oklch(0.42 0.16 158)" }}
              />
              <span
                className="text-xs"
                style={{ color: isDark ? "oklch(0.62 0.08 165)" : "oklch(0.35 0.04 165)" }}
              >
                {feat}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hotel skyline silhouette */}
      <div className="relative z-10 mt-auto overflow-hidden h-36 pointer-events-none select-none">
        <svg
          viewBox="0 0 900 120"
          className="absolute bottom-0 w-full"
          preserveAspectRatio="xMidYMax slice"
          aria-hidden="true"
        >
          {/* Background city */}
          <rect x="0" y="60" width="40" height="60" rx="2" fill={isDark ? "oklch(0.55 0.10 85 / 0.12)" : "oklch(0.45 0.08 162 / 0.15)"} />
          <rect x="30" y="42" width="30" height="78" rx="2" fill={isDark ? "oklch(0.55 0.10 85 / 0.14)" : "oklch(0.45 0.08 162 / 0.18)"} />
          <rect x="55" y="70" width="25" height="50" rx="1" fill={isDark ? "oklch(0.55 0.10 85 / 0.10)" : "oklch(0.45 0.08 162 / 0.12)"} />
          <rect x="75" y="50" width="20" height="70" rx="1" fill={isDark ? "oklch(0.55 0.10 85 / 0.12)" : "oklch(0.45 0.08 162 / 0.15)"} />
          <rect x="700" y="45" width="35" height="75" rx="2" fill={isDark ? "oklch(0.55 0.10 85 / 0.12)" : "oklch(0.45 0.08 162 / 0.15)"} />
          <rect x="730" y="60" width="25" height="60" rx="1" fill={isDark ? "oklch(0.55 0.10 85 / 0.10)" : "oklch(0.45 0.08 162 / 0.12)"} />
          <rect x="750" y="38" width="30" height="82" rx="2" fill={isDark ? "oklch(0.55 0.10 85 / 0.14)" : "oklch(0.45 0.08 162 / 0.18)"} />
          <rect x="780" y="55" width="20" height="65" rx="1" fill={isDark ? "oklch(0.55 0.10 85 / 0.12)" : "oklch(0.45 0.08 162 / 0.15)"} />
          <rect x="820" y="65" width="35" height="55" rx="2" fill={isDark ? "oklch(0.55 0.10 85 / 0.10)" : "oklch(0.45 0.08 162 / 0.12)"} />
          <rect x="855" y="50" width="45" height="70" rx="2" fill={isDark ? "oklch(0.55 0.10 85 / 0.12)" : "oklch(0.45 0.08 162 / 0.15)"} />
          {/* Main hotel building */}
          <rect x="350" y="15" width="200" height="105" rx="3" fill={isDark ? "oklch(0.68 0.14 82 / 0.32)" : "oklch(0.52 0.12 85 / 0.35)"} />
          <rect x="370" y="5" width="30" height="15" rx="1" fill={isDark ? "oklch(0.68 0.14 82 / 0.28)" : "oklch(0.52 0.12 85 / 0.30)"} />
          <rect x="500" y="5" width="30" height="15" rx="1" fill={isDark ? "oklch(0.68 0.14 82 / 0.28)" : "oklch(0.52 0.12 85 / 0.30)"} />
          {/* Hotel windows — deterministic illumination pattern to prevent hydration mismatch */}
          {[
            [true, false, true, true, false, true],
            [false, true, true, false, true, false],
            [true, true, false, true, true, true],
            [false, true, true, false, true, false],
            [true, false, true, true, false, true],
          ].map((rowLights, row) =>
            rowLights.map((isLit, col) => (
              <rect
                key={`${row}-${col}`}
                x={362 + col * 30}
                y={28 + row * 17}
                width="14"
                height="10"
                rx="1"
                fill={
                  isDark
                    ? `oklch(0.85 0.18 82 / ${isLit ? "0.55" : "0.15"})`
                    : `oklch(0.55 0.18 85 / ${isLit ? "0.75" : "0.18"})`
                }
              />
            ))
          )}
          {/* HOTEL sign */}
          <rect x="400" y="18" width="100" height="14" rx="2" fill={isDark ? "oklch(0.68 0.14 82 / 0.45)" : "oklch(0.50 0.14 85 / 0.50)"} />
          {/* Ground floor */}
          <rect x="340" y="100" width="220" height="20" rx="2" fill={isDark ? "oklch(0.68 0.14 82 / 0.38)" : "oklch(0.52 0.12 85 / 0.40)"} />
          {/* Entrance */}
          <rect x="430" y="90" width="40" height="30" rx="2" fill={isDark ? "oklch(0.68 0.14 82 / 0.45)" : "oklch(0.50 0.14 85 / 0.50)"} />
          {/* Side buildings */}
          <rect x="200" y="40" width="80" height="80" rx="2" fill={isDark ? "oklch(0.62 0.10 82 / 0.22)" : "oklch(0.48 0.08 162 / 0.22)"} />
          <rect x="215" y="48" width="50" height="72" rx="1" fill={isDark ? "oklch(0.62 0.10 82 / 0.18)" : "oklch(0.48 0.08 162 / 0.18)"} />
          <rect x="620" y="35" width="85" height="85" rx="2" fill={isDark ? "oklch(0.62 0.10 82 / 0.22)" : "oklch(0.48 0.08 162 / 0.22)"} />
          <rect x="635" y="45" width="55" height="75" rx="1" fill={isDark ? "oklch(0.62 0.10 82 / 0.18)" : "oklch(0.48 0.08 162 / 0.18)"} />
          {/* Ground line */}
          <rect x="0" y="118" width="900" height="2" fill={isDark ? "oklch(0.55 0.08 82 / 0.3)" : "oklch(0.45 0.08 162 / 0.35)"} />
        </svg>
      </div>

      {/* Ticker feed */}
      <div
        className="relative z-20 overflow-hidden py-2.5 transition-colors duration-300"
        style={{
          background: isDark ? "oklch(0.08 0.015 165 / 0.9)" : "oklch(0.95 0.015 165 / 0.95)",
          borderTop: isDark ? "1px solid oklch(0.66 0.18 162 / 0.15)" : "1px solid oklch(0.70 0.10 162 / 0.25)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="flex gap-0 animate-ticker whitespace-nowrap">
          {tickerDup.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2 px-6">
              <span
                className="h-1.5 w-1.5 rounded-full flex-shrink-0 animate-status-pulse"
                style={{ background: isDark ? "oklch(0.72 0.16 158)" : "oklch(0.42 0.16 158)" }}
              />
              <span
                className="text-[11px] tracking-wide"
                style={{ color: isDark ? "oklch(0.58 0.08 162)" : "oklch(0.35 0.05 165)" }}
              >
                {item}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Mobile Banner — panel kiri jadi banner sempit di atas form pada mobile
// ─────────────────────────────────────────────────────────────────────────
function MobileBanner({
  stats,
  loading,
  isDark,
}: {
  stats: SystemStats | null;
  loading: boolean;
  isDark: boolean;
}) {
  const t = useTranslations();
  return (
    <div
      className="lg:hidden w-full py-4 px-5 flex items-center justify-between gap-4 transition-colors duration-300"
      style={{
        background: isDark
          ? "linear-gradient(135deg, oklch(0.06 0.015 168) 0%, oklch(0.14 0.04 162) 100%)"
          : "linear-gradient(135deg, oklch(0.97 0.015 165) 0%, oklch(0.91 0.045 158) 100%)",
        borderBottom: isDark
          ? "1px solid oklch(0.66 0.18 162 / 0.2)"
          : "1px solid oklch(0.70 0.10 162 / 0.25)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="grid h-8 w-8 place-items-center rounded-lg"
          style={{
            background: isDark
              ? "linear-gradient(135deg, oklch(0.66 0.18 162), oklch(0.82 0.14 85))"
              : "linear-gradient(135deg, oklch(0.52 0.18 162), oklch(0.65 0.16 85))",
          }}
        >
          <Hotel className="h-4 w-4 text-white" />
        </span>
        <div>
          <p
            className="font-display text-lg font-bold tracking-widest leading-none"
            style={{
              backgroundImage: isDark
                ? "linear-gradient(90deg, oklch(0.82 0.18 162), oklch(0.88 0.16 85))"
                : "linear-gradient(90deg, oklch(0.35 0.15 162), oklch(0.48 0.15 85))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            EHOS
          </p>
          <p
            className="text-[10px]"
            style={{ color: isDark ? "oklch(0.55 0.08 162)" : "oklch(0.40 0.08 162)" }}
          >
            {t("auth.brandSubtitle")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {!loading && stats && (
          <>
            <div className="text-center">
              <p
                className="font-display text-base font-bold tabular-nums"
                style={{ color: isDark ? "oklch(0.85 0.16 162)" : "oklch(0.18 0.04 165)" }}
              >
                {stats.total_hotels}
              </p>
              <p
                className="text-[9px]"
                style={{ color: isDark ? "oklch(0.52 0.08 162)" : "oklch(0.45 0.06 162)" }}
              >
                {t("auth.loginPanelStat1Label")}
              </p>
            </div>
            <div
              className="h-8 w-px"
              style={{
                background: isDark
                  ? "oklch(0.66 0.18 162 / 0.2)"
                  : "oklch(0.70 0.10 162 / 0.25)",
              }}
            />
            <div className="text-center">
              <p
                className="font-display text-base font-bold tabular-nums"
                style={{ color: isDark ? "oklch(0.85 0.16 162)" : "oklch(0.18 0.04 165)" }}
              >
                {stats.system_uptime_pct}%
              </p>
              <p
                className="text-[9px]"
                style={{ color: isDark ? "oklch(0.52 0.08 162)" : "oklch(0.45 0.06 162)" }}
              >
                {t("auth.loginPanelStat2Label")}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Main LoginForm Component
// ─────────────────────────────────────────────────────────────────────────
export function LoginForm() {
  const t = useTranslations();
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const [step, setStep] = useState<Step>("credentials");
  const [pending, setPending] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [hotels, setHotels] = useState<LoginResult["hotels"]>([]);

  // Public stats from API
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        const res = await fetch("/api/system/stats", { cache: "no-store" });
        if (res.ok) {
          const json = (await res.json()) as { data?: SystemStats };
          if (!cancelled && json.data) {
            setStats(json.data);
          }
        }
      } catch {
        // G4: error handled gracefully
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }
    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const fields: FieldSchema[] = [
    {
      name: "email",
      type: "email",
      label: t("auth.email"),
      placeholder: t("auth.emailPlaceholder"),
      validation: {
        required: t("auth.emailRequired"),
        pattern: { value: emailPattern, message: t("auth.emailInvalid") },
      },
    },
    {
      name: "password",
      type: "password",
      label: t("auth.password"),
      placeholder: t("auth.passwordPlaceholder"),
      validation: { required: t("auth.passwordRequired") },
    },
  ];

  async function handleLogin(values: { email?: string; password?: string }) {
    setPending(true);
    setErrorKey(null);
    try {
      const result = await loginAction({ email: values.email ?? "", password: values.password ?? "" });
      if (!result.ok) {
        setErrorKey(result.errorKey ?? "auth.serverError");
        return;
      }
      if ((result.hotels?.length ?? 0) > 1) {
        setHotels(result.hotels ?? []);
        setStep("hotels");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  async function handlePickHotel(hotelId: string) {
    setPending(true);
    setErrorKey(null);
    const res = await switchHotelAction(hotelId);
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setErrorKey("auth.switchHotelFailed");
    setPending(false);
  }

  const version = stats?.system_version ?? "2.0";

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      {/* Left info panel — desktop only */}
      <LeftInfoPanel stats={stats} loading={statsLoading} isDark={isDark} />

      {/* Mobile banner — top strip on small screens */}
      <MobileBanner stats={stats} loading={statsLoading} isDark={isDark} />

      {/* Right form panel */}
      <div className="flex flex-1 flex-col min-h-screen lg:min-h-0 bg-background">
        {/* Top bar: language + theme toggles */}
        <div className="flex items-center justify-end gap-2 px-6 pt-5 pb-2">
          {/* Language toggle */}
          <div
            className="flex items-center gap-1 rounded-full p-1 text-xs font-semibold border"
            style={{
              borderColor: "var(--border)",
              background: "var(--muted)",
            }}
          >
            <Globe className="h-3 w-3 ml-1 text-muted-foreground" />
            {(["id", "en"] as Language[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className="rounded-full px-2.5 py-0.5 uppercase transition-smooth cursor-pointer"
                style={{
                  background: language === lang ? "var(--primary)" : "transparent",
                  color: language === lang ? "var(--primary-foreground)" : "var(--muted-foreground)",
                  fontWeight: language === lang ? 700 : 500,
                }}
                aria-pressed={language === lang}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Theme toggle */}
          <button
            type="button"
            id="login-toggle-theme"
            onClick={toggleTheme}
            aria-label={t("common.toggleTheme")}
            className="grid h-8 w-8 place-items-center rounded-full border transition-smooth cursor-pointer hover:bg-accent"
            style={{ borderColor: "var(--border)" }}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-warning" />
            ) : (
              <Moon className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Center: brand + form */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 sm:px-10">
          <div className="w-full max-w-sm">
            {/* Brand header */}
            <div className="mb-8 flex flex-col items-center gap-3 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient text-primary-foreground shadow-glow">
                <Hotel className="h-7 w-7" />
              </span>
              <div>
                <p className="font-display text-2xl font-bold tracking-wide text-brand-gradient">
                  {t("common.brand")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{t("auth.brandSubtitle")}</p>
              </div>
            </div>

            {/* Step: credentials */}
            {step === "credentials" && (
              <div className="animate-rise">
                <h1 className="font-display text-3xl font-bold">{t("auth.signinTitle")}</h1>
                <p className="mt-1 mb-6 text-sm text-muted-foreground">{t("auth.signinSubtitle")}</p>

                <CavaForm
                  fields={fields}
                  config={{
                    columns: 1,
                    submitLabel: pending ? t("auth.signingIn") : t("auth.signin"),
                    locale: language,
                  }}
                  locale={language}
                  onSubmit={(values) => handleLogin(values as { email?: string; password?: string })}
                />

                {errorKey && (
                  <p
                    role="alert"
                    className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  >
                    {t(errorKey)}
                  </p>
                )}
              </div>
            )}

            {/* Step: hotel selector */}
            {step === "hotels" && (
              <div className="animate-rise">
                <div className="mb-2 flex items-center gap-2 text-warning">
                  <ShieldCheck className="h-5 w-5" />
                  <h1 className="font-display text-2xl font-bold">{t("auth.switchHotelTitle")}</h1>
                </div>
                <p className="mb-6 text-sm text-muted-foreground">{t("auth.switchHotelSubtitle")}</p>

                <div className="space-y-2">
                  {(hotels ?? []).map((hotel) => (
                    <button
                      key={hotel.hotel_id}
                      type="button"
                      disabled={pending}
                      onClick={() => hotel.hotel_id && handlePickHotel(hotel.hotel_id)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-smooth hover:border-primary/50 hover:bg-primary/5 disabled:opacity-60 cursor-pointer"
                    >
                      <span>
                        <span className="block font-semibold">{hotel.hotel_name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {hotel.hotel_code} · {hotel.role_code}
                        </span>
                      </span>
                      {hotel.is_primary && (
                        <span className="text-xs font-semibold text-primary">{t("auth.primary")}</span>
                      )}
                    </button>
                  ))}
                </div>

                {errorKey && (
                  <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {t(errorKey)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-1 pb-5 pt-3 text-center">
          <p className="text-[11px] text-muted-foreground">
            {t("auth.loginFooterVersion")} {version} &nbsp;·&nbsp; &copy; {new Date().getFullYear()}{" "}
            {t("auth.loginFooterCopyright")}
          </p>
          <div className="flex items-center gap-3 text-[11px]">
            <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
              {t("auth.loginFooterPrivacy")}
            </a>
            <span className="text-border">·</span>
            <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
              {t("auth.loginFooterContact")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}