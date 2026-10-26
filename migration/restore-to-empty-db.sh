#!/usr/bin/env bash
set -Eeuo pipefail

: "${TARGET_DATABASE_URL:?Set TARGET_DATABASE_URL to a NEW empty PostgreSQL database}"
: "${EXPECTED_TARGET_DB:?Set EXPECTED_TARGET_DB to the exact new database name}"
: "${DUMP_FILE:?Set DUMP_FILE to the verified custom-format pg_dump file}"

[[ -f "$DUMP_FILE" ]] || { echo "DUMP_FILE not found" >&2; exit 1; }
(cd "$(dirname "$DUMP_FILE")" && sha256sum --check "$(basename "$DUMP_FILE").sha256")
target_db="$(psql "$TARGET_DATABASE_URL" -X -A -t -v ON_ERROR_STOP=1 -c 'select current_database()')"
[[ "$target_db" == "$EXPECTED_TARGET_DB" ]] || {
  echo "Target database name mismatch; refusing restore" >&2
  exit 1
}
table_count="$(psql "$TARGET_DATABASE_URL" -X -A -t -v ON_ERROR_STOP=1 -c "select count(*) from pg_catalog.pg_tables where schemaname not in ('pg_catalog','information_schema')")"
[[ "$table_count" == "0" ]] || {
  echo "Target database is not empty; refusing restore without dropping anything" >&2
  exit 1
}

pg_restore --exit-on-error --no-owner --no-acl --dbname="$TARGET_DATABASE_URL" "$DUMP_FILE"
echo "Restore completed into empty database: $target_db"
