export const locales = ["id", "en"] as const;
export type Language = (typeof locales)[number];

export const defaultLocale: Language = "id";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLanguage(value: string | null | undefined): value is Language {
  return value === "id" || value === "en";
}

export function normalizeLanguage(value: string | null | undefined): Language {
  return isLanguage(value) ? value : defaultLocale;
}