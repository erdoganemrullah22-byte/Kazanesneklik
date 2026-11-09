import { expect, test } from "@playwright/test";

import { ALLOWED_EMAIL } from "./env";

// Runs last (own project): it deliberately exhausts the sign-in bucket.
// Better Auth allows 3 sign-in requests per 10 s per client; an earlier
// sign-in from the desktop project may already be inside the window.
test("Better Auth rate limit: 10 sn'de 3'ten fazla giriş denemesi 429 alır", async ({ request, baseURL }) => {
  const statuses: number[] = [];
  for (let i = 0; i < 4; i += 1) {
    const response = await request.post("/api/auth/sign-in/email", {
      headers: { origin: baseURL ?? "" },
      data: { email: ALLOWED_EMAIL, password: `yanlis-parola-deneme-${i}` },
    });
    statuses.push(response.status());
    if (response.status() === 429) break;
  }
  expect(statuses.at(-1)).toBe(429);
  expect(statuses.slice(0, -1).every((status) => status === 401)).toBe(true);
});
