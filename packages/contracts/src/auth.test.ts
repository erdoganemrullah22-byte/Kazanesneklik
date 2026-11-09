import { describe, expect, it } from "vitest";

import { PASSWORD_MIN_LENGTH, signInInputSchema, signUpInputSchema } from "./auth";

describe("signUpInputSchema", () => {
  const valid = { name: "Deniz", email: "  Deniz@Example.com ", password: "x".repeat(12) };

  it("accepts valid input and trims the email", () => {
    const parsed = signUpInputSchema.parse(valid);
    expect(parsed.email).toBe("Deniz@Example.com");
    expect(parsed.name).toBe("Deniz");
  });

  it(`requires at least ${PASSWORD_MIN_LENGTH} password characters`, () => {
    const result = signUpInputSchema.safeParse({ ...valid, password: "x".repeat(11) });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Parola en az 12 karakter olmalı.");
  });

  it("rejects an invalid email with a Turkish message", () => {
    const result = signUpInputSchema.safeParse({ ...valid, email: "deniz" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Geçerli bir e-posta adresi yaz.");
  });

  it("rejects an empty name", () => {
    expect(signUpInputSchema.safeParse({ ...valid, name: "   " }).success).toBe(false);
  });
});

describe("signInInputSchema", () => {
  it("does not apply the sign-up length rule to sign-in", () => {
    expect(signInInputSchema.safeParse({ email: "a@b.co", password: "short" }).success).toBe(true);
  });
});
