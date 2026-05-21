"""Apply migrations/*.sql in lexical order (idempotent SQL)."""
from __future__ import annotations

import os
from pathlib import Path

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass


def main() -> None:
    import psycopg2

    url = os.getenv("DATABASE_URL", "")
    if not url:
        print("DATABASE_URL is not set, skip SQL migrations.")
        return
    if url.startswith("postgresql+asyncpg://"):
        url = "postgresql://" + url.split("://", 1)[1]

    migrations_dir = Path(__file__).resolve().parent.parent / "migrations"
    sql_files = sorted(migrations_dir.glob("*.sql"))
    if not sql_files:
        print("No SQL migrations found.")
        return

    conn = psycopg2.connect(url)
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            for path in sql_files:
                sql = path.read_text(encoding="utf-8")
                print(f"Applying {path.name}...")
                cur.execute(sql)
        print("SQL migrations applied.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
