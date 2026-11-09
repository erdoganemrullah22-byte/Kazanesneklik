#!/usr/bin/env bash
# Vercel build command (`pnpm build:vercel`, Root Directory apps/web).
#
# Migrations run ONLY for the Production deployment (VERCEL_ENV=production).
# Preview builds (every pushed branch / PR) must never apply unmerged
# migrations: if a Preview environment were given the production database
# variables (e.g. by the Vercel ↔ Neon integration), they would hit production.
#
# Escape hatch for a Preview that has its OWN database (a Neon branch): set
# MIGRATE_ON_PREVIEW=1 in the Preview environment only.
set -euo pipefail

if [[ "${VERCEL_ENV:-}" == "production" ]]; then
  echo "Production dağıtımı: migration'lar uygulanıyor (prisma migrate deploy)."
  pnpm --filter @kazan/db migrate:deploy
elif [[ "${VERCEL_ENV:-}" == "preview" && "${MIGRATE_ON_PREVIEW:-}" == "1" ]]; then
  echo "Preview dağıtımı, MIGRATE_ON_PREVIEW=1: migration'lar Preview veritabanına uygulanıyor."
  pnpm --filter @kazan/db migrate:deploy
else
  echo "VERCEL_ENV=${VERCEL_ENV:-(yok)}: migration ATLANDI (yalnızca Production dağıtımında çalışır)."
fi

next build
serwist build
