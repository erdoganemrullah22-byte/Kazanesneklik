import { describe, expect, it } from "vitest";

import { isProtectedPath, safeRedirectPath } from "./redirect";

describe("isProtectedPath", () => {
  it.each(["/bugun", "/program", "/ilerleme", "/koc", "/profil", "/profil/imkanlar"])("%s is protected", (p) => {
    expect(isProtectedPath(p)).toBe(true);
  });

  it.each(["/", "/giris", "/kayit", "/bugunler", "/api/health", "/cevrimdisi"])("%s is public", (p) => {
    expect(isProtectedPath(p)).toBe(false);
  });
});

describe("safeRedirectPath", () => {
  it("keeps protected in-app paths", () => {
    expect(safeRedirectPath("/program")).toBe("/program");
    expect(safeRedirectPath("/profil/imkanlar?x=1")).toBe("/profil/imkanlar");
  });

  it.each([
    null,
    undefined,
    "",
    "https://evil.example/bugun",
    "//evil.example/bugun",
    "/\\evil.example",
    "/giris",
    "javascript:alert(1)",
  ])("falls back to /bugun for %j", (target) => {
    expect(safeRedirectPath(target)).toBe("/bugun");
  });
});
