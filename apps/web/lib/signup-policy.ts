import { type EmailAllowlist, isEmailAllowed } from "./allowlist";

/**
 * Sign-up policy (Faz K): registration is closed unless `AUTH_SIGNUP_OPEN`
 * is "true", and even then only for allowlisted e-mails. The allowlist only
 * compares text and there is no e-mail verification, so the owner opens the
 * sign-up window for the first registration only (README → Dağıtım, 7. adım).
 *
 * While closed, every address gets the same answer, so the endpoint does not
 * reveal which address is on the list.
 */
export type SignUpRejection = "SIGNUP_CLOSED" | "EMAIL_NOT_ALLOWED";

export interface SignUpPolicy {
  open: boolean;
  allowlist: EmailAllowlist;
}

export function signUpRejection(email: unknown, policy: SignUpPolicy): SignUpRejection | null {
  if (!policy.open) return "SIGNUP_CLOSED";
  if (!isEmailAllowed(email, policy.allowlist)) return "EMAIL_NOT_ALLOWED";
  return null;
}
