// @ts-check
// Service worker build (Serwist "configurator" mode, works with Turbopack).
// `pnpm build` runs `next build` first and then `serwist build`, which bundles
// sw/sw.ts with the precache manifest into public/sw.js (git-ignored).
import { serwist } from "@serwist/next/config";

export default serwist({
  swSrc: "sw/sw.ts",
  swDest: "public/sw.js",
  // Pages are rendered per request (CSP nonce), so there is no prerendered
  // HTML to precache; the offline fallback page is added explicitly.
  precachePrerendered: false,
  additionalPrecacheEntries: [{ url: "/cevrimdisi", revision: process.env.VERCEL_GIT_COMMIT_SHA ?? `${Date.now()}` }],
});
