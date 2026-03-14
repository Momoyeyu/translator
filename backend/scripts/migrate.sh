#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "Waiting for database to be ready..."

# Wait for DB to accept connections before running migrations
MAX_RETRIES=30
RETRY=0
until python -c "
import psycopg
from conf.config import settings
conn = psycopg.connect(settings.sync_database_url)
conn.close()
print('DB ready')
" 2>/dev/null; do
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
    echo "ERROR: Database not ready after $MAX_RETRIES attempts, giving up."
    exit 1
  fi
  echo "Waiting for database... (attempt $RETRY/$MAX_RETRIES)"
  sleep 2
done

echo "Running database migrations..."

# Docker: PYTHONPATH is pre-configured
# Local: need to set PYTHONPATH to include src and project root
if [ -n "$PYTHONPATH" ]; then
    python -c "from migration.runner import upgrade_head; upgrade_head()"
else
    PYTHONPATH="src:." uv run python -c "from migration.runner import upgrade_head; upgrade_head()"
fi

echo "Database migrations completed."
