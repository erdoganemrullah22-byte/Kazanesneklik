/** Returns a Turkish error message, or null when the URL is a safe E2E target. */
export function checkE2eDatabaseUrl(url: string | undefined, options?: { ci?: boolean }): string | null;
/** Throws when the URL is not a throwaway (`*_e2e`, local unless CI) database. */
export function assertE2eDatabaseUrl(url: string | undefined, options?: { ci?: boolean }): void;
/** CI=true (GitHub Actions) relaxes only the host check, never the name check. */
export function isCiEnvironment(env?: Readonly<Record<string, string | undefined>>): boolean;
