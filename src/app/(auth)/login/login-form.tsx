"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Hotel, ShieldCheck } from "lucide-react";
import { CavaForm, type FieldSchema } from "@incodiy/cavaform";
import { loginAction, switchHotelAction, type LoginResult } from "@/app/actions/auth";
import { useLanguage } from "@/context/LanguageContext";

type Step = "credentials" | "hotels";

export function LoginForm() {
  const t = useTranslations();
  const router = useRouter();
  const { language } = useLanguage();
  const [step, setStep] = useState<Step>("credentials");
  const [pending, setPending] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [hotels, setHotels] = useState<LoginResult["hotels"]>([]);

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

  return (
    <div className="w-full max-w-md">
      <div className="glass-panel rounded-2xl p-8 shadow-elegant">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient text-primary-foreground shadow-glow">
            <Hotel className="h-7 w-7" />
          </span>
          <div>
            <p className="font-display text-2xl font-bold tracking-wide text-brand-gradient">{t("common.brand")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("auth.brandSubtitle")}</p>
          </div>
        </div>

        {step === "credentials" && (
          <>
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
          </>
        )}

        {step === "hotels" && (
          <>
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
                  {hotel.is_primary && <span className="text-xs font-semibold text-primary">{t("auth.primary")}</span>}
                </button>
              ))}
            </div>

            {errorKey && (
              <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {t(errorKey)}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}