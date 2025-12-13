#!/bin/sh
set -e ${DEBUG:+-x}

EXCEL_PATH="${AVIATION_OPTIONS_EXCEL_PATH:-/label-studio/deploy/data/aviation_options.xlsx}"

if [ "${SKIP_AVIATION_OPTIONS:-}" != "true" ]; then
  if [ -f "$EXCEL_PATH" ]; then
    OPTIONS_COUNT=$(python3 /label-studio/label_studio/manage.py shell -c "from aviation.models import AviationDropdownOption; print(AviationDropdownOption.objects.count())" 2>/dev/null || echo "0")

    if [ "$OPTIONS_COUNT" = "0" ]; then
      echo >&3 "=> Loading aviation dropdown options from $EXCEL_PATH..."
      python3 /label-studio/label_studio/manage.py load_aviation_schema "$EXCEL_PATH" >&3
      echo >&3 "=> Aviation options loaded."
    else
      echo >&3 "=> Aviation options already loaded ($OPTIONS_COUNT options). Skipping."
    fi
  else
    echo >&3 "=> Aviation options Excel file not found at $EXCEL_PATH, skipping."
  fi
else
  echo >&3 "=> Skipping aviation options load (SKIP_AVIATION_OPTIONS=true)."
fi
