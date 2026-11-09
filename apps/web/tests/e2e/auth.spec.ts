import { expect, test } from "@playwright/test";

import { ALLOWED_EMAIL, PASSWORD } from "./env";

/**
 * Sign-up / sign-in flows. Serial: the second sign-up attempt and the sign-in
 * test reuse the account created by the first test. Better Auth allows 3
 * sign-up requests per 10 s per client, so this file stays at exactly 3.
 */
test.describe.serial("kimlik doğrulama", () => {
  test("izin listesindeki e-postayla kayıt → /bugun açılır", async ({ page }) => {
    await page.goto("/kayit");
    await page.getByLabel("Adın").fill("Deniz");
    await page.getByLabel("E-posta").fill(ALLOWED_EMAIL.toUpperCase());
    await page.getByLabel("Parola").fill(PASSWORD);
    await page.getByRole("button", { name: "Hesabı oluştur" }).click();

    await expect(page).toHaveURL(/\/bugun$/);
    await expect(page.getByRole("heading", { level: 1, name: "Bugün" })).toBeVisible();
    await expect(page.getByText("Merhaba Deniz.")).toBeVisible();
  });

  test("listede olmayan e-postayla kayıt reddedilir (arayüz)", async ({ page }) => {
    await page.goto("/kayit");
    await page.getByLabel("Adın").fill("Yabancı");
    await page.getByLabel("E-posta").fill("davetsiz@example.com");
    await page.getByLabel("Parola").fill(PASSWORD);
    await page.getByRole("button", { name: "Hesabı oluştur" }).click();

    await expect(page.getByRole("main").getByRole("alert")).toHaveText("Bu e-posta adresiyle kayıt açık değil.");
    await expect(page).toHaveURL(/\/kayit$/);
  });

  test("listede olmayan e-posta sunucu tarafında reddedilir (doğrudan API)", async ({ request, baseURL }) => {
    const response = await request.post("/api/auth/sign-up/email", {
      headers: { origin: baseURL ?? "" },
      data: { name: "Yabancı", email: "api-davetsiz@example.com", password: PASSWORD },
    });
    expect(response.status()).toBe(403);
    expect(await response.json()).toMatchObject({ code: "EMAIL_NOT_ALLOWED" });
    // No session cookie is issued.
    expect(response.headers()["set-cookie"] ?? "").not.toContain("session_token");
  });

  test("giriş yap → 5 sekmeli alt menüyle gezin → çıkış yap", async ({ page }) => {
    await page.goto("/giris");
    await page.getByLabel("E-posta").fill(ALLOWED_EMAIL);
    await page.getByLabel("Parola").fill(PASSWORD);
    await page.getByRole("button", { name: "Giriş yap" }).click();
    await expect(page).toHaveURL(/\/bugun$/);

    const nav = page.getByRole("navigation", { name: "Ana menü" });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link")).toHaveText(["Bugün", "Program", "İlerleme", "Koç", "Profil"]);
    // Touch targets ≥ 44 px (plan 7.8 asks for 48 px).
    const box = await nav.getByRole("link", { name: "Bugün" }).boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(48);

    for (const [name, path] of [
      ["Program", "/program"],
      ["İlerleme", "/ilerleme"],
      ["Koç", "/koc"],
      ["Profil", "/profil"],
    ] as const) {
      await nav.getByRole("link", { name }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
      await expect(nav.getByRole("link", { name })).toHaveAttribute("aria-current", "page");
      await expect(page.getByText("Yakında", { exact: true }).first()).toBeVisible();
    }

    await expect(page.getByText(ALLOWED_EMAIL)).toBeVisible();
    await page.getByRole("main").getByRole("button", { name: "Çıkış yap" }).click();
    await expect(page).toHaveURL(/\/giris$/);

    await page.goto("/bugun");
    await expect(page).toHaveURL(/\/giris\?sonra=%2Fbugun$/);
  });

  test("yanlış parola genel bir hata verir", async ({ page }) => {
    await page.goto("/giris");
    await page.getByLabel("E-posta").fill(ALLOWED_EMAIL);
    await page.getByLabel("Parola").fill("yanlis-parola-uzun-1");
    await page.getByRole("button", { name: "Giriş yap" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("E-posta ya da parola hatalı.");
  });
});
