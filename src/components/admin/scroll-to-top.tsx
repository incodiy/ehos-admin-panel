"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const t = useTranslations();
  useEffect(() => {
    const handleScroll = () => {
      const btn = document.getElementById("scroll-to-top");
      if (btn) {
        btn.classList.toggle("opacity-0", window.scrollY < 400);
        btn.classList.toggle("pointer-events-none", window.scrollY < 400);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <button
      id="scroll-to-top"
      type="button"
      aria-label={t("common.scrollTop")}
      className="fixed bottom-6 right-6 z-40 grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-primary-foreground shadow-glow opacity-0 transition-smooth hover:opacity-90"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}