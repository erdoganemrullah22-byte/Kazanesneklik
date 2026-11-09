"use client";

import { signUpInputSchema } from "@kazan/contracts";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { authErrorKey, networkErrorKey } from "@/lib/auth-errors";
import { DEFAULT_AFTER_SIGN_IN } from "@/lib/redirect";

import { FormAlert, FormField } from "./form-field";
import { useHydrated } from "./use-hydrated";

type Field = "name" | "email" | "password";

export function SignUpForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const hydrated = useHydrated();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = signUpInputSchema.safeParse({
      name: data.get("name"),
      email: data.get("email"),
      password: data.get("password"),
    });
    if (!parsed.success) {
      const errors: Partial<Record<Field, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as Field;
        errors[field] ??= issue.message;
      }
      setFieldErrors(errors);
      setFormError(null);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setPending(true);
    let navigating = false;
    try {
      const { error } = await authClient.signUp.email(parsed.data);
      if (error) {
        setFormError(t(`errors.${authErrorKey(error)}`));
        return;
      }
      navigating = true;
      router.replace(DEFAULT_AFTER_SIGN_IN);
      router.refresh();
    } catch {
      // The request never got an answer (offline, connection dropped).
      setFormError(t(`errors.${networkErrorKey(navigator.onLine)}`));
    } finally {
      // Stay disabled only while navigating away after a successful submit.
      if (!navigating) setPending(false);
    }
  }

  return (
    <form method="post" noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <FormAlert message={formError} />
      <FormField
        name="name"
        type="text"
        label={t("name")}
        hint={t("nameHint")}
        autoComplete="given-name"
        required
        error={fieldErrors.name}
      />
      <FormField
        name="email"
        type="email"
        label={t("email")}
        autoComplete="email"
        inputMode="email"
        autoCapitalize="none"
        spellCheck={false}
        required
        error={fieldErrors.email}
      />
      <FormField
        name="password"
        type="password"
        label={t("password")}
        hint={t("passwordHint")}
        autoComplete="new-password"
        required
        error={fieldErrors.password}
      />
      <Button type="submit" variant="accent" size="lg" disabled={!hydrated || pending}>
        {pending ? t("pending") : t("submitSignUp")}
      </Button>
    </form>
  );
}
