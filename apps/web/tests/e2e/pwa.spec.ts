import { expect, test } from "@playwright/test";

test.describe("PWA kabuğu", () => {
  test("manifest ve ikonlar 200 döner", async ({ request }) => {
    const response = await request.get("/manifest.webmanifest");
    expect(response.status()).toBe(200);
    const manifest = (await response.json()) as {
      name: string;
      short_name: string;
      lang: string;
      display: string;
      icons: Array<{ src: string; sizes: string; purpose?: string }>;
    };
    expect(manifest).toMatchObject({ name: "Kazan Esneklik", short_name: "Kazan", lang: "tr", display: "standalone" });
    expect(manifest.icons.map((i) => `${i.sizes}:${i.purpose ?? "any"}`).sort()).toEqual([
      "192x192:any",
      "192x192:maskable",
      "512x512:any",
      "512x512:maskable",
    ]);

    for (const src of [...manifest.icons.map((i) => i.src), "/apple-touch-icon.png"]) {
      const icon = await request.get(src);
      expect(icon.status(), src).toBe(200);
      expect(icon.headers()["content-type"], src).toBe("image/png");
    }
  });

  test("iOS ve Android için meta etiketleri", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest");
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute("href", "/apple-touch-icon.png");
    await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute("content", "yes");
    await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute("content", "Kazan");
    await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute("content", /#/);
  });

  test("sayfalarda CSP ihlali ya da konsol hatası yok", async ({ page }) => {
    const problems: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") problems.push(message.text());
    });
    page.on("pageerror", (error) => problems.push(String(error)));
    for (const path of ["/giris", "/kayit", "/cevrimdisi", "/"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
    }
    // next-themes applies the theme with an inline script, which needs the nonce.
    await page.getByRole("radio", { name: "Koyu" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    expect(problems).toEqual([]);
  });

  test("service worker kaydolur ve çevrimdışı sayfa önbellekte", async ({ page }) => {
    await page.goto("/");
    const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
    expect(scope).toMatch(/\/$/);
    const cached = await page.evaluate(async () => {
      for (const name of await caches.keys()) {
        const cache = await caches.open(name);
        if (await cache.match("/cevrimdisi", { ignoreSearch: true })) return true;
      }
      return false;
    });
    expect(cached).toBe(true);
  });

  test("çevrimdışı gezinmede /cevrimdisi yedek sayfası gelir", async ({ page, context }) => {
    await page.goto("/");
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    // Make sure this page is controlled by the (claimed) worker.
    await page.reload();
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);

    await context.setOffline(true);
    try {
      await page.goto("/program");
      await expect(page.getByRole("heading", { level: 1, name: "Bağlantın yok" })).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });
});
