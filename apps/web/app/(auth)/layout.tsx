import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type * as React from "react";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("app");
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-[env(safe-area-inset-top)] pb-10">
      <header className="flex items-center justify-between gap-4 py-4">
        <Link href="/" className="rounded-xl focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none">
          <Logo name={t("name")} />
        </Link>
        <ThemeToggle />
      </header>
      <main id="icerik" className="flex flex-1 flex-col justify-center py-6">
        {children}
      </main>
    </div>
  );
}
