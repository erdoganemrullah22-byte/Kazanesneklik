/**
 * Which database the Prisma CLI (migrate, diff, studio) talks to.
 *
 * Imported by `prisma.config.ts`; kept free of I/O so it can be unit-tested.
 *
 * Order (first non-empty wins):
 *  1. `DATABASE_URL_UNPOOLED` from the process environment (Vercel / Neon
 *     integration, or a one-off `DATABASE_URL_UNPOOLED=… pnpm db:migrate`),
 *  2. `DATABASE_URL` from the process environment (CI, `pnpm e2e`),
 *  3. `DATABASE_URL` from `apps/web/.env.local` (local development only).
 *
 * `DATABASE_URL_UNPOOLED` is deliberately NOT read from `.env.local`: a
 * production address left in that file must never silently win over a
 * database given on the command line (`pnpm e2e`, `pnpm db:migrate`).
 */
export type DatabaseUrlSource = "env:DATABASE_URL_UNPOOLED" | "env:DATABASE_URL" | "env.local:DATABASE_URL";

export interface ResolvedDatabaseUrl {
  url: string;
  source: DatabaseUrlSource;
}

type EnvLike = Readonly<Record<string, string | undefined>>;

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function resolveCliDatabaseUrl(processEnv: EnvLike, localFileEnv: EnvLike = {}): ResolvedDatabaseUrl | null {
  const unpooled = nonEmpty(processEnv["DATABASE_URL_UNPOOLED"]);
  if (unpooled) return { url: unpooled, source: "env:DATABASE_URL_UNPOOLED" };
  const pooled = nonEmpty(processEnv["DATABASE_URL"]);
  if (pooled) return { url: pooled, source: "env:DATABASE_URL" };
  const local = nonEmpty(localFileEnv["DATABASE_URL"]);
  if (local) return { url: local, source: "env.local:DATABASE_URL" };
  return null;
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/** True when the connection string points at this machine. */
export function isLocalDatabaseUrl(url: string): boolean {
  try {
    return LOCAL_HOSTS.has(new URL(url).hostname.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Prisma commands that may drop data or rewrite the schema without asking
 * twice (`migrate dev` can reset the database on drift).
 */
export function isDevOnlyPrismaCommand(args: readonly string[]): boolean {
  const [command, subcommand] = args.filter((arg) => !arg.startsWith("-"));
  if (command === "migrate") return subcommand === "dev" || subcommand === "reset";
  if (command === "db") return subcommand === "push";
  return false;
}

/** Host and database name only: never user, password or query string. */
export function describeDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}${parsed.pathname}`;
  } catch {
    return "(geçersiz bağlantı dizesi)";
  }
}

/**
 * Throws when a dev-only command (`migrate dev`, `migrate reset`, `db push`)
 * would run against a non-local database. `KAZAN_ALLOW_REMOTE_DEV_COMMANDS=1`
 * is the explicit, one-off escape hatch.
 */
export function assertDevCommandIsLocal(
  args: readonly string[],
  resolved: ResolvedDatabaseUrl | null,
  processEnv: EnvLike,
) {
  if (!resolved || !isDevOnlyPrismaCommand(args)) return;
  if (isLocalDatabaseUrl(resolved.url)) return;
  if (processEnv["KAZAN_ALLOW_REMOTE_DEV_COMMANDS"] === "1") return;
  throw new Error(
    `"prisma ${args.join(" ")}" yalnızca yerel veritabanında çalışır; hedef ${describeDatabaseUrl(resolved.url)} ` +
      `(${resolved.source}). Üretim için "pnpm db:migrate" (migrate deploy) kullan.`,
  );
}
