"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function AdminFooter() {
  const t = useTranslations();
  return (
    <footer className="shrink-0 border-t border-sidebar-border/70 bg-card/40 backdrop-blur-md px-4 py-3.5 sm:px-6">
      <div className="mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>
          © {new Date().getFullYear()}{" "}
          <span className="font-semibold text-brand-gradient">EHOS</span> — Swiss-Belhotel International Indonesia.
        </p>
        <div className="flex items-center gap-4">
          <Link href="#" data-no-link-hover className="link-hover hover:text-foreground transition-colors">{t("common.footerPrivacy")}</Link>
          <Link href="#" data-no-link-hover className="link-hover hover:text-foreground transition-colors">{t("common.footerContact")}</Link>
        </div>
      </div>
    </footer>
  );
}