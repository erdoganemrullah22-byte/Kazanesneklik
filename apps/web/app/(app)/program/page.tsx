import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/server/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("program");
  return { title: t("title") };
}

export default async function ProgramPage() {
  await requireUser();
  const t = await getTranslations("program");
  return (
    <>
      <PageHeader title={t("title")} />
      <ComingSoon
        items={[
          { stage: "K2", text: t("items.k2") },
          { stage: "K2", text: t("items.k2b") },
        ]}
      />
    </>
  );
}
