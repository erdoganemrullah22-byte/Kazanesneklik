import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { SignInForm } from "@/components/auth/sign-in-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { env } from "@/lib/env";
import { safeRedirectPath } from "@/lib/redirect";
import { getAllowedSession } from "@/server/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("signInTitle") };
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { sonra } = await searchParams;
  const redirectTo = safeRedirectPath(typeof sonra === "string" ? sonra : null);
  if (await getAllowedSession()) redirect(redirectTo);

  const t = await getTranslations("auth");
  return (
    <Card>
      <CardHeader>
        <h1 className="text-2xl font-extrabold">{t("signInTitle")}</h1>
        <CardDescription>{t("signInLead")}</CardDescription>
      </CardHeader>
      <CardContent>
        <SignInForm redirectTo={redirectTo} />
      </CardContent>
      {env.AUTH_SIGNUP_OPEN && (
        <CardFooter className="text-muted-foreground">
          <span>{t("noAccount")}</span>
          <Link
            href="/kayit"
            className="inline-flex min-h-12 items-center font-semibold text-primary underline underline-offset-4"
          >
            {t("toSignUp")}
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
