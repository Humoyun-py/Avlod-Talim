#!/usr/bin/env bash
set -Eeuo pipefail

cd "$(dirname "$0")"
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

# Fail early for missing production configuration before changing the database.
python manage.py check --deploy
python manage.py collectstatic --noinput
