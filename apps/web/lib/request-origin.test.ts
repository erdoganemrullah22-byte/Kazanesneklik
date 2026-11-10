import { describe, expect, it } from "vitest";

import { requestOrigin } from "./request-origin";

const h = (init: Record<string, string>) => new Headers(init);

describe("requestOrigin", () => {
  it("prefers X-Forwarded-Host and X-Forwarded-Proto", () => {
    expect(
      requestOrigin(
        h({ host: "localhost:3000", "x-forwarded-host": "abc.preview.example", "x-forwarded-proto": "https" }),
      ),
    ).toBe("https://abc.preview.example");
  });

  it("uses the first value of comma-separated forwarded headers", () => {
    expect(requestOrigin(h({ "x-forwarded-host": "a.example, b.example", "x-forwarded-proto": "https, http" }))).toBe(
      "https://a.example",
    );
  });

  it("falls back to Host over http", () => {
    expect(requestOrigin(h({ host: "localhost:3000" }))).toBe("http://localhost:3000");
  });

  it("ignores an unknown forwarded protocol", () => {
    expect(requestOrigin(h({ host: "localhost:3000", "x-forwarded-proto": "javascript" }))).toBe(
      "http://localhost:3000",
    );
  });

  it("rejects hosts that smuggle paths, credentials or queries", () => {
    expect(requestOrigin(h({ host: "evil.example/path" }))).toBeNull();
    expect(requestOrigin(h({ host: "user:pw@evil.example" }))).toBeNull();
    expect(requestOrigin(h({ host: "evil.example?x=1" }))).toBeNull();
    expect(requestOrigin(h({ host: "evil.example#x" }))).toBeNull();
  });

  it("returns null without a host", () => {
    expect(requestOrigin(h({}))).toBeNull();
  });
});
