/** Message keys under `auth.errors` in messages/tr.json. */
export type AuthErrorKey =
  | "notAllowed"
  | "signUpClosed"
  | "invalidCredentials"
  | "userExists"
  | "passwordTooShort"
  | "rateLimited"
  | "offline"
  | "generic";

export interface AuthClientError {
  status?: number | undefined;
  code?: string | undefined;
}

/** Maps a Better Auth error response to a Turkish message key. */
export function authErrorKey(error: AuthClientError | null | undefined): AuthErrorKey {
  if (!error) return "generic";
  if (error.status === 429) return "rateLimited";
  switch (error.code) {
    case "EMAIL_NOT_ALLOWED":
      return "notAllowed";
    case "SIGNUP_CLOSED":
    case "EMAIL_PASSWORD_SIGN_UP_DISABLED":
      return "signUpClosed";
    case "INVALID_EMAIL_OR_PASSWORD":
    case "INVALID_EMAIL":
    case "INVALID_PASSWORD":
      return "invalidCredentials";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "userExists";
    case "PASSWORD_TOO_SHORT":
      return "passwordTooShort";
    default:
      return error.status === 401 ? "invalidCredentials" : "generic";
  }
}

/**
 * Key for a request that never got an answer (the fetch itself rejected):
 * offline on a phone is the common case.
 */
export function networkErrorKey(online: boolean | undefined): AuthErrorKey {
  return online === false ? "offline" : "generic";
}
