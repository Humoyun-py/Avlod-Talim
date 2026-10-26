#!/usr/bin/env bash
set -Eeuo pipefail

: "${DATABASE_URL:?Set DATABASE_URL to the source PostgreSQL connection string}"
: "${BACKUP_DIR:?Set BACKUP_DIR to a durable, encrypted backup location}"
: "${MEDIA_DIR:=}"

umask 077
mkdir -p "$BACKUP_DIR"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
dump="$BACKUP_DIR/avlod-talim-$stamp.dump"

pg_dump --format=custom --no-owner --no-acl --exit-on-error --dbname="$DATABASE_URL" --file="$dump"
pg_restore --list "$dump" >/dev/null
(cd "$BACKUP_DIR" && sha256sum "$(basename "$dump")" > "$(basename "$dump").sha256")

if [[ -n "$MEDIA_DIR" ]]; then
  [[ -d "$MEDIA_DIR" ]] || { echo "MEDIA_DIR does not exist" >&2; exit 1; }
  media="$BACKUP_DIR/avlod-talim-media-$stamp.tar.gz"
  tar -C "$MEDIA_DIR" -czf "$media" .
  tar -tzf "$media" >/dev/null
  (cd "$BACKUP_DIR" && sha256sum "$(basename "$media")" > "$(basename "$media").sha256")
fi

echo "Database export verified: $dump"
if [[ -n "$MEDIA_DIR" ]]; then echo "Media export verified: $media"; fi
echo "Copy these files off this machine to encrypted durable storage before proceeding."
