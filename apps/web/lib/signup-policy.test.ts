import { describe, expect, it } from "vitest";

import { parseAllowedEmails } from "./allowlist";
import { signUpRejection } from "./signup-policy";

const allowlist = parseAllowedEmails("sahip@example.com");

describe("signUpRejection", () => {
  it("is closed by default for every address, listed or not (no enumeration)", () => {
    expect(signUpRejection("sahip@example.com", { open: false, allowlist })).toBe("SIGNUP_CLOSED");
    expect(signUpRejection("baskasi@example.com", { open: false, allowlist })).toBe("SIGNUP_CLOSED");
  });

  it("when open, accepts only allowlisted addresses", () => {
    expect(signUpRejection(" Sahip@Example.com ", { open: true, allowlist })).toBeNull();
    expect(signUpRejection("baskasi@example.com", { open: true, allowlist })).toBe("EMAIL_NOT_ALLOWED");
    expect(signUpRejection(undefined, { open: true, allowlist })).toBe("EMAIL_NOT_ALLOWED");
  });

  it("an empty allowlist keeps registration closed even when the window is open", () => {
    expect(signUpRejection("sahip@example.com", { open: true, allowlist: parseAllowedEmails("") })).toBe(
      "EMAIL_NOT_ALLOWED",
    );
  });
});
