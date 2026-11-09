import { LogOut } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/server/actions/auth";

/** Server-action form: works before hydration and without client JS. */
export async function SignOutButton({ className, full = false }: { className?: string; full?: boolean }) {
  const t = await getTranslations("nav");
  return (
    <form action={signOutAction} className={cn(full && "w-full", className)}>
      <Button type="submit" variant="outline" className={cn(full && "w-full justify-start")}>
        <LogOut aria-hidden="true" />
        {t("signOut")}
      </Button>
    </form>
  );
}
