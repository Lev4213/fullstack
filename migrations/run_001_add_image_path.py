#!/usr/bin/env python3
"""Применить миграцию 001_add_image_path.sql — добавить колонку image_path в pets."""
import os
import sys

# Подгрузка .env из корня проекта
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

def main():
    try:
        import psycopg2
    except ImportError:
        print("Установите psycopg2-binary: pip install psycopg2-binary")
        sys.exit(1)

    url = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/lost_pets")
    # psycopg2 использует postgresql://, не postgresql+asyncpg://
    if url.startswith("postgresql+asyncpg://"):
        url = "postgresql://" + url.split("://", 1)[1]

    sql = "ALTER TABLE pets ADD COLUMN IF NOT EXISTS image_path VARCHAR(500);"
    try:
        conn = psycopg2.connect(url)
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.close()
        print("Миграция применена: колонка pets.image_path добавлена.")
    except Exception as e:
        print(f"Ошибка: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
