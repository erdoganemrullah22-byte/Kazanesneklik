/// <reference lib="webworker" />
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, NetworkOnly, Serwist, StaleWhileRevalidate } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const DAY = 24 * 60 * 60;

/**
 * Only static, non-personal assets are cached at runtime. Pages, RSC payloads
 * and API responses may carry personal (later: health) data, so they are never
 * written to the Cache Storage here; K3 adds an explicit offline session
 * package in IndexedDB instead (plan 10.8).
 */
const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith("/_next/static/"),
    handler: new CacheFirst({
      cacheName: "next-static",
      plugins: [new ExpirationPlugin({ maxEntries: 256, maxAgeSeconds: 30 * DAY })],
    }),
  },
  {
    matcher: ({ sameOrigin, url }) =>
      sameOrigin && !url.pathname.startsWith("/api/") && /\.(?:png|svg|ico|webp|woff2?)$/i.test(url.pathname),
    handler: new StaleWhileRevalidate({
      cacheName: "static-assets",
      plugins: [new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 30 * DAY })],
    }),
  },
  {
    // Everything else (documents, RSC, /api/**, cross-origin): network only.
    matcher: () => true,
    handler: new NetworkOnly(),
  },
];

/**
 * K0 service worker: precaches the static shell (JS, CSS, fonts, icons) and
 * serves `/cevrimdisi` when a page navigation fails offline.
 */
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST ?? [],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/cevrimdisi",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
