"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "../auth";

/** Server action used by the "Çıkış yap" form (works before hydration too). */
export async function signOutAction(): Promise<never> {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // Already signed out or session expired: nothing to clear.
  }
  redirect("/giris");
}
