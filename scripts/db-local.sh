#!/usr/bin/env bash
# Yerel geliştirme ve E2E için geçici PostgreSQL 16 sunucusu.
#
#   pnpm db:local            # başlat (gerekirse initdb + veritabanlarını oluştur)
#   pnpm db:local:stop       # durdur
#   bash scripts/db-local.sh status | url [db]
#
# Ortam değişkenleri (hepsi isteğe bağlı):
#   KAZAN_PG_DIR   veri dizini            (varsayılan: <repo>/.local/pg, git'e girmez)
#   KAZAN_PG_PORT  port                   (varsayılan: 54329)
#   PG_BIN         PostgreSQL ikilileri   (varsayılan: pg_config --bindir ya da /usr/lib/postgresql/16/bin)
#
# Sunucu yalnızca localhost'u dinler ve "trust" kimlik doğrulaması kullanır:
# YALNIZCA yerel geliştirme içindir. Root olarak çalıştırılırsa (ör. bulut
# kodlama konteyneri) PostgreSQL root ile çalışmayı reddettiği için komutlar
# `postgres` sistem kullanıcısıyla çalıştırılır.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="${KAZAN_PG_DIR:-$ROOT/.local/pg}"
PORT="${KAZAN_PG_PORT:-54329}"
DB_USER="kazan"
DATABASES=("kazan" "kazan_e2e")

if [[ -z "${PG_BIN:-}" ]]; then
  if command -v pg_config >/dev/null 2>&1 && [[ -x "$(pg_config --bindir)/initdb" ]]; then
    PG_BIN="$(pg_config --bindir)"
  else
    PG_BIN="/usr/lib/postgresql/16/bin"
  fi
fi

if [[ ! -x "$PG_BIN/initdb" ]]; then
  echo "initdb bulunamadı ($PG_BIN). PostgreSQL 16 kurun ya da PG_BIN ayarlayın." >&2
  exit 1
fi

# Run a PostgreSQL binary as a non-root user.
as_pg() {
  if [[ "$(id -u)" -eq 0 ]]; then
    if ! id postgres >/dev/null 2>&1; then
      echo "Root olarak çalışıyorsunuz ama 'postgres' kullanıcısı yok." >&2
      exit 1
    fi
    runuser -u postgres -- "$@"
  else
    "$@"
  fi
}

psql_admin() {
  as_pg "$PG_BIN/psql" -h localhost -p "$PORT" -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 -qAt "$@"
}

is_running() {
  [[ -f "$DATA_DIR/PG_VERSION" ]] && as_pg "$PG_BIN/pg_ctl" -D "$DATA_DIR" status >/dev/null 2>&1
}

init_cluster() {
  if [[ -f "$DATA_DIR/PG_VERSION" ]]; then
    return
  fi
  echo "Veri dizini oluşturuluyor: $DATA_DIR"
  mkdir -p "$DATA_DIR"
  if [[ "$(id -u)" -eq 0 ]]; then
    chown postgres:postgres "$DATA_DIR"
  fi
  chmod 700 "$DATA_DIR"
  as_pg "$PG_BIN/initdb" -D "$DATA_DIR" -U "$DB_USER" --auth=trust --encoding=UTF8 --no-locale >/dev/null
}

ensure_databases() {
  for db in "${DATABASES[@]}"; do
    if [[ "$(psql_admin -c "SELECT 1 FROM pg_database WHERE datname = '$db'")" != "1" ]]; then
      psql_admin -c "CREATE DATABASE \"$db\" OWNER \"$DB_USER\""
      echo "Veritabanı oluşturuldu: $db"
    fi
  done
}

start() {
  init_cluster
  if is_running; then
    echo "PostgreSQL zaten çalışıyor (port $PORT)."
  else
    as_pg "$PG_BIN/pg_ctl" -D "$DATA_DIR" -l "$DATA_DIR/server.log" -w \
      -o "-p $PORT -k $DATA_DIR -c listen_addresses=localhost" start >/dev/null
    echo "PostgreSQL başlatıldı (port $PORT, veri: $DATA_DIR)."
  fi
  ensure_databases
  echo
  echo "Geliştirme:  DATABASE_URL=postgresql://$DB_USER@localhost:$PORT/kazan"
  echo "E2E:         DATABASE_URL=postgresql://$DB_USER@localhost:$PORT/kazan_e2e"
}

stop() {
  if is_running; then
    as_pg "$PG_BIN/pg_ctl" -D "$DATA_DIR" -m fast -w stop >/dev/null
    echo "PostgreSQL durduruldu."
  else
    echo "PostgreSQL çalışmıyor."
  fi
}

case "${1:-start}" in
  start) start ;;
  stop) stop ;;
  status)
    if is_running; then echo "çalışıyor (port $PORT, veri: $DATA_DIR)"; else echo "çalışmıyor"; exit 1; fi
    ;;
  url) echo "postgresql://$DB_USER@localhost:$PORT/${2:-kazan}" ;;
  *)
    echo "Kullanım: $0 {start|stop|status|url [db]}" >&2
    exit 2
    ;;
esac
