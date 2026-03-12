import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import pets, auth
from .database import engine, Base
from . import models  # noqa: F401

logger = logging.getLogger("uvicorn.error")

app = FastAPI(title="Lost Pets API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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


@app.get("/ping")
def ping():
    return {"message": "pong"}
