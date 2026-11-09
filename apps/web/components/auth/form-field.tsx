import type * as React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormFieldProps extends Omit<React.ComponentProps<typeof Input>, "id" | "name"> {
  name: string;
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
}

/** Label + input + hint/error, wired with aria attributes. */
export function FormField({ name, label, hint, error, ...inputProps }: FormFieldProps) {
  const id = `alan-${name}`;
  const hintId = hint ? `${id}-ipucu` : undefined;
  const errorId = error ? `${id}-hata` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {hint ? (
        <p id={hintId} className="text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="font-semibold text-warning-foreground">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function FormAlert({ message }: { message: string | null }) {
  return (
    <div aria-live="polite" aria-atomic="true">
      {message ? (
        <p role="alert" className="rounded-xl bg-warning px-4 py-3 font-semibold text-warning-foreground">
          {message}
        </p>
      ) : null}
    </div>
  );
}
