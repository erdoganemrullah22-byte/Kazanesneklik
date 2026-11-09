import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { env } from "@/lib/env";
import { DEFAULT_AFTER_SIGN_IN } from "@/lib/redirect";
import { getAllowedSession } from "@/server/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("signUpTitle") };
}

export default async function SignUpPage() {
  if (await getAllowedSession()) redirect(DEFAULT_AFTER_SIGN_IN);

  const t = await getTranslations("auth");
  // The sign-up window is closed by default (AUTH_SIGNUP_OPEN); the server
  // rejects sign-ups anyway, this only avoids showing a form that cannot work.
  const open = env.AUTH_SIGNUP_OPEN;
  return (
    <Card>
      <CardHeader>
        <h1 className="text-2xl font-extrabold">{t("signUpTitle")}</h1>
        <CardDescription>{open ? t("signUpLead") : t("signUpClosedTitle")}</CardDescription>
      </CardHeader>
      <CardContent>{open ? <SignUpForm /> : <p role="status">{t("signUpClosedBody")}</p>}</CardContent>
      <CardFooter className="text-muted-foreground">
        <span>{t("haveAccount")}</span>
        <Link
          href="/giris"
          className="inline-flex min-h-12 items-center font-semibold text-primary underline underline-offset-4"
        >
          {t("toSignIn")}
        </Link>
      </CardFooter>
    </Card>
  );
}
