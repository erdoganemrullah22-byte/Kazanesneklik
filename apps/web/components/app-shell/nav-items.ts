import { CalendarDays, House, type LucideIcon, MessageCircle, TrendingUp, UserRound } from "lucide-react";

export type NavKey = "today" | "program" | "progress" | "coach" | "profile";

export interface NavItem {
  key: NavKey;
  href: string;
  icon: LucideIcon;
}

/** Five tabs, in plan order (7.2): Bugün · Program · İlerleme · Koç · Profil. */
export const NAV_ITEMS: readonly NavItem[] = [
  { key: "today", href: "/bugun", icon: House },
  { key: "program", href: "/program", icon: CalendarDays },
  { key: "progress", href: "/ilerleme", icon: TrendingUp },
  { key: "coach", href: "/koc", icon: MessageCircle },
  { key: "profile", href: "/profil", icon: UserRound },
];

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
