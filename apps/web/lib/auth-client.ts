"use client";

import { createAuthClient } from "better-auth/react";

/** Browser auth client; talks to /api/auth on the same origin (rate-limited there). */
export const authClient = createAuthClient();
