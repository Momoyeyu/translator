#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "Waiting for database to be ready..."

# Wait for DB to accept connections before running migrations
MAX_RETRIES=30
RETRY=0
until python -c "
import psycopg
import os
host = os.environ.get('DB_HOST', 'localhost')
port = os.environ.get('DB_PORT', '5432')
user = os.environ.get('DB_USER', 'postgres')
password = os.environ.get('DB_PASSWORD', 'postgres')
dbname = os.environ.get('DB_NAME', 'translator')
conn = psycopg.connect(host=host, port=port, user=user, password=password, dbname=dbname)
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
