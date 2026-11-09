import { WifiOff } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("offline");
  return { title: t("title"), robots: { index: false } };
}

/** Offline fallback served by the service worker (plan 7.2, 10.8). */
export default async function OfflinePage() {
  const t = await getTranslations();
  return (
    <main id="icerik" className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      <Logo name={t("app.name")} />
      <Card>
        <CardHeader>
          <WifiOff className="size-8 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-extrabold">{t("offline.title")}</h1>
          <CardDescription>{t("offline.body")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="lg">
            {/* Full navigation on purpose: retries the network. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/">{t("offline.retry")}</a>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
