"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { NextIntlClientProvider, useLocale, useTranslations } from "next-intl";
import { defaultLocale, LOCALE_COOKIE, type Language } from "@/i18n/config";

import idMessages from "@/i18n/messages/id.json";
import enMessages from "@/i18n/messages/en.json";

const messagesByLocale: Record<Language, Parameters<typeof NextIntlClientProvider>[0]["messages"]> = {
  id: idMessages,
  en: enMessages,
};

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function setLocaleCookie(lang: Language) {
  document.cookie = `${LOCALE_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
}

export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: Language;
}) {
  const [language, setLanguageState] = useState<Language>(initialLocale);

  useEffect(() => {
    setLocaleCookie(language);
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: (lang: Language) => setLanguageState(lang),
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      <NextIntlClientProvider locale={language} messages={messagesByLocale[language]} timeZone="Asia/Jakarta">
        {children}
      </NextIntlClientProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}

/** Bridge: useLocale dari next-intl (dipakai komponen server/client yang butuh locale string). */
export function useICUELocale(): Language {
  return useLocale() as Language;
}

export function useT() {
  return useTranslations();
}

export { defaultLocale, LOCALE_COOKIE };