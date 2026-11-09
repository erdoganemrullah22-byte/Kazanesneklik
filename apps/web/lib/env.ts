import "server-only";

import { createServerEnv } from "./env-schema";

/**
 * Validated server environment. Importing this module from a client component
 * fails the build (`server-only`), and t3-env throws if a server variable is
 * read in the browser. Validation cannot be skipped (see `createServerEnv`).
 */
export const env = createServerEnv({
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  AUTH_ALLOWED_EMAILS: process.env.AUTH_ALLOWED_EMAILS,
  AUTH_SIGNUP_OPEN: process.env.AUTH_SIGNUP_OPEN,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  AI_MODEL_MAIN: process.env.AI_MODEL_MAIN,
  AI_LIVE: process.env.AI_LIVE,
});
