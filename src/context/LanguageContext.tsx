"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { NextIntlClientProvider, useLocale, useTranslations, type AbstractIntlMessages } from "next-intl";
import { defaultLocale, LOCALE_COOKIE, type Language } from "@/i18n/config";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function setLocaleCookie(lang: Language) {
  document.cookie = `${LOCALE_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
}

export function LanguageProvider({
  children,
  initialLocale,
  initialMessages,
}: {
  children: ReactNode;
  initialLocale: Language;
  initialMessages: AbstractIntlMessages;
}) {
  const [language, setLanguageState] = useState<Language>(initialLocale);
  const [messages, setMessages] = useState<AbstractIntlMessages>(initialMessages);

  useEffect(() => {
    setLocaleCookie(language);
  }, [language]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    setLocaleCookie(lang);
    if (lang === "en") {
      const loaded = (await import("@/i18n/messages/en.json")).default;
      setMessages(loaded as unknown as AbstractIntlMessages);
    } else {
      const loaded = (await import("@/i18n/messages/id.json")).default;
      setMessages(loaded as unknown as AbstractIntlMessages);
    }
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      <NextIntlClientProvider locale={language} messages={messages} timeZone="Asia/Jakarta">
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