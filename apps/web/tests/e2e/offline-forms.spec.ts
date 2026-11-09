import { expect, test } from "@playwright/test";

import { ALLOWED_EMAIL, PASSWORD } from "./env";

const OFFLINE_MESSAGE = "İnternet bağlantın yok gibi görünüyor. Bağlanınca tekrar dene.";

// No request reaches the server here (the browser is offline), so these tests
// do not use up Better Auth's sign-in / sign-up rate-limit buckets.
test.describe("çevrimdışı form gönderimi", () => {
  test("giriş: hata gösterilir, düğme yeniden etkin olur", async ({ page, context }) => {
    await page.goto("/giris");
    await page.getByLabel("E-posta").fill(ALLOWED_EMAIL);
    await page.getByLabel("Parola").fill(PASSWORD);

    await context.setOffline(true);
    try {
      await page.getByRole("button", { name: "Giriş yap" }).click();
      await expect(page.getByRole("main").getByRole("alert")).toHaveText(OFFLINE_MESSAGE);
      await expect(page.getByRole("button", { name: "Giriş yap" })).toBeEnabled();
    } finally {
      await context.setOffline(false);
    }
    // Back online, the form is usable again without a reload.
    await expect(page.getByRole("button", { name: "Giriş yap" })).toBeEnabled();
  });

  test("kayıt: hata gösterilir, düğme yeniden etkin olur", async ({ page, context }) => {
    await page.goto("/kayit");
    await page.getByLabel("Adın").fill("Deniz");
    await page.getByLabel("E-posta").fill("cevrimdisi@example.com");
    await page.getByLabel("Parola").fill(PASSWORD);

    await context.setOffline(true);
    try {
      await page.getByRole("button", { name: "Hesabı oluştur" }).click();
      await expect(page.getByRole("main").getByRole("alert")).toHaveText(OFFLINE_MESSAGE);
      await expect(page.getByRole("button", { name: "Hesabı oluştur" })).toBeEnabled();
    } finally {
      await context.setOffline(false);
    }
  });
});
