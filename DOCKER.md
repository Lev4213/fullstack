# Docker — лабораторная по контейнеризации

## Архитектура

| Сервис | Роль |
|--------|------|
| **proxy** | Nginx reverse proxy, порт `8080` → единая точка входа |
| **frontend** | Статика React (`dist/`) + Nginx для SPA |
| **backend** | FastAPI + Uvicorn |
| **db** | PostgreSQL 16 |

```text
Браузер :8080
    → proxy (nginx)
        → /          → frontend
        → /auth/*    → backend:8000
        → /pets/*    → backend:8000
        → /uploads/* → backend:8000
        → /health    → backend:8000
    backend → db:5432 (внутренняя сеть app-net)
```

## Быстрый старт

1. Скопируйте переменные окружения:

```powershell
copy .env.example .env
```

Отредактируйте `.env`: задайте `POSTGRES_PASSWORD` и `SECRET_KEY` (длинная случайная строка).

2. Запуск:

```powershell
docker compose up --build
```

3. Откройте: http://localhost:8080

4. Остановка:

```powershell
docker compose down
```

С данными БД: `docker compose down -v` (удалит volume `pgdata`).

## Файлы

| Файл | Назначение |
|------|------------|
| `Dockerfile` | Образ backend |
| `frontend/Dockerfile` | Сборка Vite + Nginx |
| `docker-compose.yml` | Оркестрация сервисов |
| `nginx/nginx.conf` | Reverse proxy |
| `.dockerignore` | Исключения при сборке backend |
| `.env.example` | Шаблон секретов (без реальных значений) |
| `.github/workflows/ci-cd.yml` | CI: тесты, lint, сборка образов |

## Healthcheck

- **db** — `pg_isready`
- **backend** — `GET /health`
- **frontend** — `wget /`
- **proxy** — `wget /health` (через прокси на API)

## Локальная разработка без Docker

Как раньше: Postgres + `uvicorn`, `npm run dev` в `frontend/`.

## CI/CD

При push/PR в `main`:

1. `pytest` (SQLite in-memory)
2. `npm run lint` + `npm run test`
3. Сборка Docker-образов
4. Push в GHCR при push в `main`
5. Job `deploy` — инструкция для сервера (`docker compose up -d`)

## Проверка устойчивости (п. 6.4)

```powershell
docker compose stop backend
# /health через proxy → degraded или ошибка
docker compose start backend
```

```powershell
docker compose stop db
# backend /health → database: unavailable
docker compose start db
```
