#!/bin/sh
set -e ${DEBUG:+-x}

if [ "${SKIP_AVIATION_SEEDING:-}" = "true" ]; then
  echo >&3 "=> Skipping aviation type seeding."
else
  echo >&3 "=> Seeding aviation type hierarchy..."
  python3 /label-studio/label_studio/manage.py seed_aviation_types >&3
  echo >&3 "=> Aviation seeding completed."
fi
