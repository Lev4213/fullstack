#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
python - <<'PY'
import os
import sys
import time

import psycopg2

url = os.environ["DATABASE_URL"]
if url.startswith("postgresql+asyncpg://"):
    url = "postgresql://" + url.split("://", 1)[1]

for attempt in range(60):
    try:
        conn = psycopg2.connect(url)
        conn.close()
        print("Database is ready.")
        break
    except Exception as exc:
        if attempt == 59:
            print(f"Database not ready: {exc}", file=sys.stderr)
            sys.exit(1)
        time.sleep(1)
PY

echo "Applying SQL migrations..."
python -m scripts.apply_sql_migrations

echo "Starting API..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
