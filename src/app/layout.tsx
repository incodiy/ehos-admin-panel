import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { QueryProvider } from "@/lib/api/client-provider";
import { normalizeLanguage, LOCALE_COOKIE } from "@/i18n/config";
import { cookies } from "next/headers";

const barlow = Barlow({
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EHOS — Enterprise Hospitality Operations & Suite",
  description:
    "Admin panel corporate — Swiss-Belhotel International Indonesia. Audit, CAPA, CRM, katalog hotel, dan RBAC enterprise.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLocale = normalizeLanguage(cookieStore.get(LOCALE_COOKIE)?.value);

  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <body className={`${barlow.variable} ${barlowCondensed.variable} font-sans`}>
        <ThemeProvider>
          <LanguageProvider initialLocale={initialLocale}>
            <QueryProvider>{children}</QueryProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}