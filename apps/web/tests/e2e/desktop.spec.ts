import { expect, test } from "@playwright/test";

import { ALLOWED_EMAIL, PASSWORD } from "./env";

test("masaüstünde sol kenar çubuğu, mobil alt menü gizli", async ({ page }) => {
  await page.goto("/giris?sonra=/program");
  await page.getByLabel("E-posta").fill(ALLOWED_EMAIL);
  await page.getByLabel("Parola").fill(PASSWORD);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page).toHaveURL(/\/program$/);

  const sidebar = page.getByTestId("kenar-cubugu");
  await expect(sidebar).toBeVisible();
  await expect(page.getByTestId("alt-menu")).toBeHidden();
  for (const name of ["Bugün", "Program", "İlerleme", "Koç", "Profil"]) {
    await expect(sidebar.getByRole("link", { name })).toBeVisible();
  }
  await expect(sidebar.getByRole("link", { name: "Program" })).toHaveAttribute("aria-current", "page");
  await expect(sidebar.getByRole("button", { name: "Çıkış yap" })).toBeVisible();

  await sidebar.getByRole("link", { name: "Koç" }).click();
  await expect(page).toHaveURL(/\/koc$/);
  await expect(page.getByRole("heading", { level: 1, name: "Koç" })).toBeVisible();
});

test("koyu tema elle seçilebilir ve hatırlanır", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("radio", { name: "Koyu" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("radio", { name: "Açık" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});
