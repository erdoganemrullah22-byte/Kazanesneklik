import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/server/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("progress");
  return { title: t("title") };
}

export default async function ProgressPage() {
  await requireUser();
  const t = await getTranslations("progress");
  return (
    <>
      <PageHeader title={t("title")} />
      <ComingSoon
        items={[
          { stage: "K1", text: t("items.k1") },
          { stage: "K4", text: t("items.k4") },
        ]}
      />
    </>
  );
}
