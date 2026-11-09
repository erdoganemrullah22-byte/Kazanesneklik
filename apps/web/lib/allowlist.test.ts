import { describe, expect, it } from "vitest";

import { isEmailAllowed, normalizeEmail, parseAllowedEmails } from "./allowlist";

describe("parseAllowedEmails", () => {
  it("splits, trims, lower-cases and drops empty entries", () => {
    const list = parseAllowedEmails("  Sahip@Example.com, ikinci@example.com ,,  ");
    expect([...list]).toEqual(["sahip@example.com", "ikinci@example.com"]);
  });

  it("deduplicates entries that differ only in case", () => {
    expect(parseAllowedEmails("a@b.co,A@B.CO").size).toBe(1);
  });

  it.each([undefined, null, "", " , ,"])("returns an empty list for %j", (raw) => {
    expect(parseAllowedEmails(raw).size).toBe(0);
  });
});

describe("isEmailAllowed", () => {
  const list = parseAllowedEmails("sahip@example.com");

  it("matches case-insensitively and ignores surrounding spaces", () => {
    expect(isEmailAllowed("  SAHIP@example.COM ", list)).toBe(true);
  });

  it("rejects addresses that are not on the list", () => {
    expect(isEmailAllowed("baskasi@example.com", list)).toBe(false);
    expect(isEmailAllowed("sahip@example.com.tr", list)).toBe(false);
  });

  it("closes registration completely when the list is empty", () => {
    expect(isEmailAllowed("sahip@example.com", parseAllowedEmails(""))).toBe(false);
  });

  it("rejects non-string input", () => {
    expect(isEmailAllowed(undefined, list)).toBe(false);
    expect(isEmailAllowed(["sahip@example.com"], list)).toBe(false);
  });
});

describe("normalizeEmail", () => {
  it("does not apply Turkish casing rules (I → i, not ı)", () => {
    expect(normalizeEmail("ILKER@EXAMPLE.COM")).toBe("ilker@example.com");
  });
});
