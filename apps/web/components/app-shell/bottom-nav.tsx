"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { NAV_ITEMS, isActive } from "./nav-items";

/** Mobile tab bar (hidden from md up, where the sidebar takes over). */
export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("label")}
      data-testid="alt-menu"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-nav/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {NAV_ITEMS.map(({ key, href, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={key}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-0.5 px-1 text-xs font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("size-6", active && "stroke-[2.5]")} aria-hidden="true" />
                <span>{t(key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
