import { getTranslations } from "next-intl/server";
import type * as React from "react";

import { BottomNav } from "@/components/app-shell/bottom-nav";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { Logo } from "@/components/logo";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireUser } from "@/server/session";

/**
 * Signed-in area: sidebar from `md` up, top bar + bottom tab bar on mobile
 * (plan 7.2). Every page also calls `requireUser()` itself, because layouts
 * are not re-rendered on client-side navigation.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  const t = await getTranslations("app");

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[16rem_minmax(0,1fr)]">
      <aside
        className="sticky top-0 hidden h-dvh flex-col gap-8 border-r border-border bg-nav p-4 md:flex"
        data-testid="kenar-cubugu"
      >
        <Logo name={t("name")} className="px-2 pt-2" />
        <SidebarNav />
        <div className="mt-auto flex flex-col gap-3">
          <ThemeToggle />
          <SignOutButton full />
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-nav/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur md:hidden">
          <Logo name={t("name")} className="py-2" />
          <ThemeToggle />
        </header>
        <main
          id="icerik"
          className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 pt-6 pb-32 sm:px-6 md:px-8 md:pb-12"
        >
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
