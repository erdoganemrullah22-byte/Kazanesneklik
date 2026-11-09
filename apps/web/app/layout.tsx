import type { Metadata, Viewport } from "next";
import { Nunito_Sans } from "next/font/google";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import type * as React from "react";

import { ServiceWorkerProvider } from "@/components/service-worker";
import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

// Latin + Latin Extended covers ç ğ ı İ ö ş ü (plan 7.8).
const nunitoSans = Nunito_Sans({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-nunito-sans",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app");
  return {
    title: { default: t("name"), template: `%s · ${t("name")}` },
    description: t("description"),
    applicationName: t("name"),
    appleWebApp: { capable: true, title: t("shortName"), statusBarStyle: "default" },
    formatDetection: { telephone: false },
    icons: {
      icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    other: {
      // iOS < 17.4 only knows the vendor-prefixed name.
      "apple-mobile-web-app-capable": "yes",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#115d4d" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1916" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Reading the nonce also opts every page into per-request rendering, which
  // the CSP nonce requires (plan 10.13).
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const t = await getTranslations("app");

  return (
    <html lang="tr" className={nunitoSans.variable} suppressHydrationWarning>
      <body className="min-h-dvh">
        <a
          href="#icerik"
          className="sr-only z-50 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          {t("skipToContent")}
        </a>
        <ThemeProvider nonce={nonce}>
          <NextIntlClientProvider>
            <ServiceWorkerProvider enabled={process.env.NODE_ENV === "production"}>{children}</ServiceWorkerProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
