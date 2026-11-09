import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/server/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("today");
  return { title: t("title") };
}

export default async function TodayPage() {
  const user = await requireUser();
  const t = await getTranslations("today");
  return (
    <>
      <PageHeader title={t("title")}>{t("greeting", { name: user.name })}</PageHeader>
      <ComingSoon
        items={[
          { stage: "K1", text: t("items.k1") },
          { stage: "K2", text: t("items.k2") },
          { stage: "K3", text: t("items.k3") },
          { stage: "K4", text: t("items.k4") },
        ]}
      />
    </>
  );
}
