import { expect, test } from "@playwright/test";

const PROTECTED = ["/bugun", "/program", "/ilerleme", "/koc", "/profil"];

test.describe("oturumsuz erişim", () => {
  for (const path of PROTECTED) {
    test(`${path} → /giris yönlendirmesi`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`/giris\\?sonra=${encodeURIComponent(path)}$`));
      await expect(page.getByRole("heading", { level: 1, name: "Giriş yap" })).toBeVisible();
    });
  }

  test("sahte oturum çerezi sunucu kontrolünü geçemez", async ({ page, context, baseURL }) => {
    await context.addCookies([
      { name: "better-auth.session_token", value: "sahte.deger", url: baseURL ?? "http://localhost:3100" },
    ]);
    await page.goto("/bugun");
    await expect(page).toHaveURL(/\/giris$/);
  });

  test("açılış sayfası giriş bağlantısı içerir", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "tr");
    await page.getByRole("link", { name: "Giriş yap" }).click();
    await expect(page).toHaveURL(/\/giris$/);
  });
});

test.describe("API", () => {
  test("GET /api/health → 200, sır yok", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ status: "ok", db: "ok" });
    expect(response.headers()["cache-control"]).toBe("no-store");
  });

  test("POST /api/admin/ai/smoke → AI_LIVE kapalıyken 404", async ({ request, baseURL }) => {
    const response = await request.post("/api/admin/ai/smoke", { headers: { origin: baseURL ?? "" } });
    expect(response.status()).toBe(404);
  });

  test("/api/admin/ai/smoke diğer yöntemlerde de 404 (405 değil, varlığını belli etmez)", async ({ request }) => {
    for (const method of ["GET", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
      const response = await request.fetch("/api/admin/ai/smoke", { method });
      expect(response.status(), method).toBe(404);
      expect(response.headers()["allow"], method).toBeUndefined();
    }
  });
});

test.describe("güvenlik başlıkları", () => {
  test("sayfalarda nonce'lu CSP ve temel başlıklar var", async ({ request }) => {
    const response = await request.get("/giris");
    const headers = response.headers();
    expect(headers["content-security-policy"]).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("microphone=()");
  });
});
