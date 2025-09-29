"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { PageHero } from "@/components/admin/page-hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/context/SessionContext";
import { isCorporate } from "@/lib/auth/session";
import { LayoutDashboard, ClipboardCheck, ShieldAlert, Building2, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const t = useTranslations();
  const { session, hotels, roleCodes } = useSession();

  const moduleLinks = [
    {
      href: "/dashboard/capa",
      icon: ShieldAlert,
      title: t("dashboard.moduleCapa"),
      desc: t("dashboard.moduleCapaDesc"),
    },
  ];

  return (
    <>
      <PageHero
        title={t("dashboard.title")}
        subtitle={t("dashboard.subtitle")}
        icon={LayoutDashboard}
        actions={
          <Link href="/dashboard/capa" data-no-link-hover>
            <Button className="h-10 rounded-lg bg-brand-gradient shadow-glow transition-smooth hover:opacity-90 cursor-pointer">
              <ClipboardCheck className="h-4 w-4" />
              {t("dashboard.startAudit")}
            </Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Scope aktif (data real dari /auth/me + /auth/hotels — A1 Switch Active Hotel) */}
        <Card variant="glass" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {t("dashboard.scopeTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {session ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/50 bg-background/40 p-4">
                    <p className="text-[0.66rem] uppercase tracking-[0.18em] text-muted-foreground">{t("dashboard.scopeUser")}</p>
                    <p className="mt-1 font-semibold">{session.user.name || "—"}</p>
                    <p className="text-sm text-muted-foreground">{session.user.email || "—"}</p>
                  </div>
                  <div className="rounded-2xl border border-border/50 bg-background/40 p-4">
                    <p className="text-[0.66rem] uppercase tracking-[0.18em] text-muted-foreground">{t("dashboard.scopeRoles")}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {roleCodes.length > 0 ? (
                        roleCodes.map((code) => (
                          <Badge key={code} variant="secondary">
                            {code}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">—</p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/50 bg-background/40 p-4">
                    <p className="text-[0.66rem] uppercase tracking-[0.18em] text-muted-foreground">{t("dashboard.scopeHotel")}</p>
                    <p className="mt-1 font-semibold">{session.activeHotel?.name ?? t("dashboard.scopeAllHotels")}</p>
                    <p className="text-sm text-muted-foreground">
                      {isCorporate(session)
                        ? t("dashboard.scopeCorporate")
                        : t("dashboard.scopeAssigned", { count: hotels.length })}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/50 bg-background/40 p-4">
                    <p className="text-[0.66rem] uppercase tracking-[0.18em] text-muted-foreground">{t("dashboard.scopeAssignedHotels")}</p>
                    <p className="mt-1 font-display text-3xl leading-none">{hotels.length}</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t("dashboard.noSession")}</p>
            )}
          </CardContent>
        </Card>

        {/* Akses cepat modul */}
        <div className="space-y-4">
          {moduleLinks.map((module) => (
            <Link key={module.href} href={module.href} data-no-link-hover>
              <Card variant="glass" className="hover-lift cursor-pointer">
                <CardContent className="flex items-start gap-4 p-5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-gradient text-primary-foreground shadow-glow">
                    <module.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-xl leading-none">{module.title}</p>
                    <p className="mt-1.5 text-sm text-muted-foreground">{module.desc}</p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}