#!/usr/bin/env bash
# pnpm e2e — Playwright E2E against a production build.
#   Locally: starts the temporary PostgreSQL (scripts/db-local.sh), applies
#   migrations to the kazan_e2e database, checks schema drift, builds the web
#   app, runs Playwright.
#   CI (CI=true): the database comes from the job's postgres service
#   (E2E_DATABASE_URL).
# Extra arguments go to `playwright test` (e.g. pnpm e2e --project=mobil).
# Set E2E_SKIP_BUILD=1 to reuse an existing build.
#
# Safety: the run empties the auth tables. The target is E2E_DATABASE_URL only
# (never a DATABASE_URL exported in the shell) and must be a "*_e2e" database,
# on localhost unless CI (apps/web/scripts/e2e-db-guard.mjs).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/apps/web/tests/e2e/e2e.env"

# The fake E2E values always win over the shell; only E2E_DATABASE_URL may be
# given from outside (CI).
SHELL_E2E_DATABASE_URL="${E2E_DATABASE_URL:-}"
while IFS='=' read -r key value; do
  [[ -z "$key" || "$key" == \#* ]] && continue
  export "$key=$value"
done < "$ENV_FILE"
if [[ -n "$SHELL_E2E_DATABASE_URL" ]]; then
  export E2E_DATABASE_URL="$SHELL_E2E_DATABASE_URL"
fi
# Migrations, the drift check, the build and the server all use the same database.
export DATABASE_URL="$E2E_DATABASE_URL"
export DATABASE_URL_UNPOOLED="$E2E_DATABASE_URL"
export NEXT_TELEMETRY_DISABLED=1 NO_UPDATE_NOTIFIER=1

node "$ROOT/apps/web/scripts/e2e-db-guard.mjs"

if [[ -z "${CI:-}" ]]; then
  bash "$ROOT/scripts/db-local.sh" start >/dev/null
fi

pnpm --dir "$ROOT" --filter @kazan/db migrate:deploy
# Schema drift: the migrated database must match schema.prisma exactly.
pnpm --dir "$ROOT" --filter @kazan/db migrate:check-drift

if [[ "${E2E_SKIP_BUILD:-}" != "1" ]]; then
  pnpm --dir "$ROOT" --filter @kazan/web build
fi

pnpm --dir "$ROOT" --filter @kazan/web exec playwright test "$@"
