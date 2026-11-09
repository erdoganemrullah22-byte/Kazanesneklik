import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/server/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("coach");
  return { title: t("title") };
}

export default async function CoachPage() {
  await requireUser();
  const t = await getTranslations("coach");
  return (
    <>
      <PageHeader title={t("title")} />
      <ComingSoon
        items={[
          { stage: "K4", text: t("items.k4") },
          { stage: "K5", text: t("items.k5") },
        ]}
      />
    </>
  );
}
