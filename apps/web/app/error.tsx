"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  const t = useTranslations("error");
  return (
    <main id="icerik" className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-4 py-10">
      <h1 className="text-3xl font-extrabold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("body")}</p>
      <Button className="w-fit" onClick={() => retry()}>
        {t("retry")}
      </Button>
    </main>
  );
}
