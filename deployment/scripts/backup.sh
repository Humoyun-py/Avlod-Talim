#!/usr/bin/env bash
set -Eeuo pipefail

: "${DATABASE_URL:?DATABASE_URL is required in backup.env}"
: "${BACKUP_DIR:=/var/backups/avlod-talim}"
: "${MEDIA_DIR:=/srv/avlod-talim/backend/private_media}"
: "${RETENTION_DAYS:=14}"

umask 077
mkdir -p "$BACKUP_DIR"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
db_file="$BACKUP_DIR/database-$timestamp.dump"
media_file="$BACKUP_DIR/media-$timestamp.tar.gz"

pg_dump --format=custom --no-owner --no-acl --dbname="$DATABASE_URL" --file="$db_file"
if [[ -d "$MEDIA_DIR" ]]; then
  tar -C "$(dirname "$MEDIA_DIR")" -czf "$media_file" "$(basename "$MEDIA_DIR")"
fi
find "$BACKUP_DIR" -type f -mtime "+$RETENTION_DAYS" -delete
echo "Backup completed: $timestamp"
