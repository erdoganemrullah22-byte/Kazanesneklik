"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type * as React from "react";

/** Dark mode: system preference by default, manual override (plan 7.8). */
export function ThemeProvider({ children, nonce }: { children: React.ReactNode; nonce?: string | undefined }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="kazan-tema"
      {...(nonce ? { nonce } : {})}
    >
      {children}
    </NextThemesProvider>
  );
}
