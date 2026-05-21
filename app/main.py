import logging
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from .routers import pets, auth
from .database import engine, Base
from . import models  # noqa: F401

logger = logging.getLogger("uvicorn.error")

app = FastAPI(title="Lost Pets API")

uploads_dir = Path(__file__).resolve().parent.parent / "uploads"
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

_cors = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,http://127.0.0.1:8080",
)
_allow_origins = [o.strip() for o in _cors.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        logger.error(f"Database init failed: {e}")


app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(pets.router, prefix="/pets", tags=["Pets"])


@app.get("/health")
async def health_check():
    """Проверка доступности сервера и подключения к БД."""
    db_ok = False
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception as e:
        logger.warning(f"Health check DB: {e}")
    status = "ok" if db_ok else "degraded"
    return {"status": status, "database": "ok" if db_ok else "unavailable"}
