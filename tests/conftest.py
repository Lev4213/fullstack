import os

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("TESTING", "1")

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, engine as app_engine, get_async_session
from app.main import app

TEST_DATABASE_URL = os.environ["DATABASE_URL"]


@pytest_asyncio.fixture(scope="session", autouse=True)
async def dispose_app_engine():
    """Close the app-level engine so pytest exits (avoids hang on Windows)."""
    yield
    await app_engine.dispose()


@pytest_asyncio.fixture
async def db_engine():
    engine = create_async_engine(TEST_DATABASE_URL, future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def client(db_engine):
    session_factory = sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)

    async def override_session():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_async_session] = override_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient) -> dict[str, str]:
    """Зарегистрировать пользователя и вернуть заголовок Authorization."""
    email = "user@example.com"
    password = "secret123"
    await client.post("/auth/register", json={"email": email, "password": password})
    login = await client.post(
        "/auth/login",
        data={"username": email, "password": password},
    )
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def other_auth_headers(client: AsyncClient) -> dict[str, str]:
    email = "other@example.com"
    password = "secret123"
    await client.post("/auth/register", json={"email": email, "password": password})
    login = await client.post(
        "/auth/login",
        data={"username": email, "password": password},
    )
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def sample_pet(client: AsyncClient, auth_headers: dict) -> dict:
  payload = {
      "name": "Барсик",
      "species": "кошка",
      "city": "Москва",
      "is_lost": True,
      "contact_phone": "+7 999 123 45 67",
  }
  res = await client.post("/pets/", json=payload, headers=auth_headers)
  assert res.status_code == 200
  return res.json()
