import { type APIRequestContext, type APIResponse, expect, test } from "@playwright/test";

import { ALLOWED_EMAIL, PASSWORD } from "./env";

/**
 * Runs against the second server (playwright.config.ts) started with
 * AUTH_SIGNUP_OPEN=false, the production default: nobody can register, not
 * even with the allowlisted address, and every address gets the same answer.
 */
async function signUp(request: APIRequestContext, origin: string, email: string): Promise<APIResponse> {
  const send = () =>
    request.post("/api/auth/sign-up/email", {
      headers: { origin },
      data: { name: "Deneme", email, password: PASSWORD },
    });
  let response = await send();
  // Earlier projects share the per-IP sign-up bucket (3 per 10 s): wait it out once.
  if (response.status() === 429) {
    const seconds = Number(response.headers()["x-retry-after"] ?? "10");
    await new Promise((resolve) => setTimeout(resolve, (seconds + 1) * 1000));
    response = await send();
  }
  return response;
}

test.describe("kayıt penceresi kapalı (AUTH_SIGNUP_OPEN=false)", () => {
  test("sunucu, izinli adres dahil her kaydı aynı yanıtla reddeder (liste sızmaz)", async ({ request, baseURL }) => {
    const bodies: unknown[] = [];
    // The allowlisted address (already registered by the mobile project on the
    // shared database) must get SIGNUP_CLOSED too, not USER_ALREADY_EXISTS.
    for (const email of [ALLOWED_EMAIL, "davetsiz-kapali@example.com"]) {
      const response = await signUp(request, baseURL ?? "", email);
      expect(response.status(), email).toBe(403);
      const body: unknown = await response.json();
      expect(body, email).toMatchObject({ code: "SIGNUP_CLOSED" });
      expect(response.headers()["set-cookie"] ?? "", email).not.toContain("session_token");
      bodies.push(body);
    }
    expect(bodies[0]).toEqual(bodies[1]);
  });

  test("arayüz: /kayit formu göstermez, açılış ve giriş sayfasında kayıt bağlantısı yok", async ({ page }) => {
    await page.goto("/kayit");
    await expect(page.getByText("Kayıt şu anda kapalı", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Hesabı oluştur" })).toHaveCount(0);

    await page.goto("/");
    await expect(page.getByRole("link", { name: "Giriş yap" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Hesap oluştur" })).toHaveCount(0);

    await page.goto("/giris");
    await expect(page.getByRole("link", { name: "Hesap oluştur" })).toHaveCount(0);
  });
});
