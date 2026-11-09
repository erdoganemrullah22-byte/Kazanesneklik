import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <main id="icerik" className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-4 py-10">
      <h1 className="text-3xl font-extrabold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("body")}</p>
      <Button asChild className="w-fit">
        <Link href="/">{t("home")}</Link>
      </Button>
    </main>
  );
}
