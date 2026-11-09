import { z } from "zod";

/** Password rules shared by the forms and the Better Auth server config. */
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;
export const DISPLAY_NAME_MAX_LENGTH = 80;

/**
 * Error messages are Turkish because they are shown to the user as-is.
 * Emails are compared case-insensitively everywhere (see the allowlist).
 */
const email = z
  .string()
  .trim()
  .min(1, "E-posta adresini yaz.")
  .pipe(z.email("Geçerli bir e-posta adresi yaz."));

export const signInInputSchema = z.object({
  email,
  password: z.string().min(1, "Parolanı yaz.").max(PASSWORD_MAX_LENGTH),
});
export type SignInInput = z.infer<typeof signInInputSchema>;

export const signUpInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Sana nasıl hitap edelim? Bir ad yaz.")
    .max(DISPLAY_NAME_MAX_LENGTH, `Ad en fazla ${DISPLAY_NAME_MAX_LENGTH} karakter olabilir.`),
  email,
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Parola en az ${PASSWORD_MIN_LENGTH} karakter olmalı.`)
    .max(PASSWORD_MAX_LENGTH, `Parola en fazla ${PASSWORD_MAX_LENGTH} karakter olabilir.`),
});
export type SignUpInput = z.infer<typeof signUpInputSchema>;
