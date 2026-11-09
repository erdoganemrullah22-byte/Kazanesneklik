import { describe, expect, it } from "vitest";

import { authErrorKey, networkErrorKey } from "./auth-errors";

describe("authErrorKey", () => {
  it.each([
    [{ status: 403, code: "EMAIL_NOT_ALLOWED" }, "notAllowed"],
    [{ status: 403, code: "SIGNUP_CLOSED" }, "signUpClosed"],
    [{ status: 400, code: "EMAIL_PASSWORD_SIGN_UP_DISABLED" }, "signUpClosed"],
    [{ status: 401, code: "INVALID_EMAIL_OR_PASSWORD" }, "invalidCredentials"],
    [{ status: 422, code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" }, "userExists"],
    [{ status: 400, code: "PASSWORD_TOO_SHORT" }, "passwordTooShort"],
    [{ status: 429 }, "rateLimited"],
    [{ status: 429, code: "EMAIL_NOT_ALLOWED" }, "rateLimited"],
    [{ status: 401 }, "invalidCredentials"],
    [{ status: 500, code: "SOMETHING" }, "generic"],
    [null, "generic"],
  ] as const)("%j → %s", (error, key) => {
    expect(authErrorKey(error)).toBe(key);
  });
});

describe("networkErrorKey", () => {
  it("says offline only when the browser reports it", () => {
    expect(networkErrorKey(false)).toBe("offline");
    expect(networkErrorKey(true)).toBe("generic");
    expect(networkErrorKey(undefined)).toBe("generic");
  });
});
