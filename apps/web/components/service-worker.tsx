"use client";

import { SerwistProvider } from "@serwist/next/react";
import type * as React from "react";

/**
 * Registers `/sw.js` in production builds. Navigation caching stays off in K0
 * (offline sessions arrive in K3), so personal pages are not stored on the
 * device beyond the offline fallback.
 */
export function ServiceWorkerProvider({ children, enabled }: { children: React.ReactNode; enabled: boolean }) {
  return (
    <SerwistProvider swUrl="/sw.js" disable={!enabled} cacheOnNavigation={false} reloadOnOnline={false}>
      {children}
    </SerwistProvider>
  );
}
