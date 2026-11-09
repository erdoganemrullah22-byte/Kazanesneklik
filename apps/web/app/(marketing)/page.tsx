import { ShieldCheck, Sprout } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/lib/env";
import { getAllowedSession } from "@/server/session";

export default async function LandingPage() {
  const t = await getTranslations();
  const session = await getAllowedSession();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pt-[env(safe-area-inset-top)] pb-10 sm:px-6">
      <header className="flex items-center justify-between gap-4 py-4">
        <Logo name={t("app.name")} />
        <ThemeToggle />
      </header>

      <main id="icerik" className="flex flex-1 flex-col gap-8 pt-6 sm:pt-12">
        <section className="flex flex-col gap-5">
          <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-balance sm:text-5xl">
            {t("landing.title")}
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">{t("landing.lead")}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {session ? (
              <Button asChild variant="accent" size="lg">
                <Link href="/bugun">{t("nav.today")}</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="accent" size="lg">
                  <Link href="/giris">{t("landing.signIn")}</Link>
                </Button>
                {env.AUTH_SIGNUP_OPEN && (
                  <Button asChild variant="outline" size="lg">
                    <Link href="/kayit">{t("landing.signUp")}</Link>
                  </Button>
                )}
              </>
            )}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <Sprout className="size-7 text-primary" aria-hidden="true" />
              <CardTitle>{t("landing.phaseTitle")}</CardTitle>
              <CardDescription>{t("landing.phaseBody")}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <ShieldCheck className="size-7 text-primary" aria-hidden="true" />
              <CardTitle>{t("landing.safetyTitle")}</CardTitle>
              <CardDescription>{t("landing.safetyBody")}</CardDescription>
            </CardHeader>
          </Card>
        </section>
      </main>
    </div>
  );
}
