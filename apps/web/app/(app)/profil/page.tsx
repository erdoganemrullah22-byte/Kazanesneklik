import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";

import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { findProfileByUserId } from "@/server/queries/profile";
import { requireUser } from "@/server/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("profile");
  return { title: t("title") };
}

export default async function ProfilePage() {
  const user = await requireUser();
  const [t, format, profile] = await Promise.all([
    getTranslations("profile"),
    getFormatter(),
    findProfileByUserId(user.id),
  ]);

  return (
    <>
      <PageHeader title={t("title")} />
      <Card>
        <CardHeader>
          <CardTitle>{t("account")}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-[10rem_1fr]">
            <dt className="font-semibold text-muted-foreground">{t("displayName")}</dt>
            <dd>{profile?.displayName ?? user.name}</dd>
            <dt className="font-semibold text-muted-foreground">{t("email")}</dt>
            <dd className="break-all">{user.email}</dd>
            <dt className="font-semibold text-muted-foreground">{t("memberSince")}</dt>
            <dd>{format.dateTime(user.createdAt, { dateStyle: "long" })}</dd>
          </dl>
          <SignOutButton />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("appearance")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeToggle showLabels className="w-fit" />
        </CardContent>
      </Card>
      <ComingSoon items={[{ stage: "K1", text: t("items.k1") }]} />
    </>
  );
}
