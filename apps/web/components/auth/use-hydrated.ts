"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * `false` during SSR and until hydration. Submit buttons stay disabled until
 * then so a form can never fall back to a native submission (which would put
 * the password into a URL).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
