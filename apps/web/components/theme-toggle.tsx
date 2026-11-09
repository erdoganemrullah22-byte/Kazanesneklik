"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "system", icon: Monitor, labelKey: "system" },
  { value: "light", icon: Sun, labelKey: "light" },
  { value: "dark", icon: Moon, labelKey: "dark" },
] as const;

const subscribe = () => () => {};

/** Three-way theme switch (Sistem / Açık / Koyu) as a radio group. */
export function ThemeToggle({ className, showLabels = false }: { className?: string; showLabels?: boolean }) {
  const t = useTranslations("theme");
  const { theme, setTheme } = useTheme();
  // The stored theme is only known in the browser; render neutral on the server.
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const current = mounted ? (theme ?? "system") : undefined;

  return (
    <div
      role="radiogroup"
      aria-label={t("label")}
      className={cn("inline-flex rounded-xl border-2 border-border p-1", className)}
    >
      {OPTIONS.map(({ value, icon: Icon, labelKey }) => {
        const selected = current === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={showLabels ? undefined : t(labelKey)}
            title={t(labelKey)}
            onClick={() => setTheme(value)}
            className={cn(
              "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-2.5 font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring",
              selected
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
            {showLabels ? <span>{t(labelKey)}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
