import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy, createNonce } from "./csp";

describe("buildContentSecurityPolicy", () => {
  it("allows only nonce'd scripts in production", () => {
    const csp = buildContentSecurityPolicy("abc123", { isDev: false });
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toContain("api.anthropic.com");
  });

  it("adds unsafe-eval only in development", () => {
    expect(buildContentSecurityPolicy("n", { isDev: true })).toContain("'unsafe-eval'");
  });
});

describe("createNonce", () => {
  it("returns a fresh base64 value each time", () => {
    const a = createNonce();
    const b = createNonce();
    expect(a).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(a).not.toBe(b);
  });
});
