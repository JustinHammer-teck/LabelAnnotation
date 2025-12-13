#!/bin/sh
set -e ${DEBUG:+-x}

if [ -n "${POSTGRE_HOST:-}" ] || [ -n "${MYSQL_HOST:-}" ] && [ "${SKIP_DB_MIGRATIONS:-}" != "true" ]; then
  echo >&3 "=> Do database migrations..."
  python3 /label-studio/label_studio/manage.py locked_migrate >&3
  echo >&3 "=> Migrations completed."
  echo >&3 "=> Seeding aviation type hierarchy..."
  python3 /label-studio/label_studio/manage.py seed_aviation_types >&3
  echo >&3 "=> Aviation seeding completed."
else
  echo >&3 "=> Skipping run db migrations."
fi