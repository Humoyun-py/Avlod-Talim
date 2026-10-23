#!/usr/bin/env bash
set -Eeuo pipefail

: "${HEALTHCHECK_URL:?Set HEALTHCHECK_URL, for example https://api.example.uz/}"
curl --fail --silent --show-error --max-time 10 "$HEALTHCHECK_URL" >/dev/null
echo "Avlod Ta'lim API health check passed"
