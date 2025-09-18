"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function PageHero({
  title,
  subtitle,
  icon: Icon,
  stats,
  actions,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  stats?: { label: string; value: string; hint?: string }[];
  actions?: ReactNode;
}) {
  return (
    <section className="animate-rise hospitality-stripes relative overflow-hidden rounded-3xl border border-border/60 bg-card/60 p-6 shadow-elegant backdrop-blur-xl md:p-8">
      <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-brand-gradient opacity-20 blur-3xl" />
      <div className="relative flex flex-wrap items-start gap-5">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-primary-foreground shadow-glow">
          <Icon className="h-7 w-7" />
        </span>
        <div className="min-w-[220px] flex-1">
          <h1 className="font-display text-4xl leading-none md:text-5xl">{title}</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      {stats && stats.length > 0 && (
        <div className="relative mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="hover-lift animate-rise rounded-2xl border border-border/50 bg-background/40 p-4"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <p className="text-[0.66rem] uppercase tracking-[0.18em] text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-display text-3xl leading-none">{s.value}</p>
              {s.hint && <p className="mt-1 text-xs text-primary">{s.hint}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}