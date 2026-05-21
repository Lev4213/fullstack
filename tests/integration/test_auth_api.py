"""Интеграционные тесты эндпоинтов /auth."""

import pytest
from httpx import AsyncClient


@pytest.mark.integration
async def test_register_and_login(client: AsyncClient):
    email = "newuser@example.com"
    password = "secret123"
    reg = await client.post("/auth/register", json={"email": email, "password": password})
    assert reg.status_code == 201
    assert reg.json()["email"] == email

    login = await client.post(
        "/auth/login",
        data={"username": email, "password": password},
    )
    assert login.status_code == 200
    body = login.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


@pytest.mark.integration
async def test_register_duplicate_email(client: AsyncClient):
    payload = {"email": "dup@example.com", "password": "secret123"}
    await client.post("/auth/register", json=payload)
    dup = await client.post("/auth/register", json=payload)
    assert dup.status_code == 400


@pytest.mark.integration
async def test_login_wrong_password(client: AsyncClient):
    email = "wrongpass@example.com"
    await client.post("/auth/register", json={"email": email, "password": "secret123"})
    bad = await client.post(
        "/auth/login",
        data={"username": email, "password": "wrong"},
    )
    assert bad.status_code == 401


@pytest.mark.integration
async def test_me_requires_auth(client: AsyncClient):
    res = await client.get("/auth/me")
    assert res.status_code == 401


@pytest.mark.integration
async def test_me_returns_user(client: AsyncClient, auth_headers: dict):
    res = await client.get("/auth/me", headers=auth_headers)
    assert res.status_code == 200
    assert "email" in res.json()


@pytest.mark.integration
async def test_register_validation_short_password(client: AsyncClient):
    res = await client.post(
        "/auth/register",
        json={"email": "short@example.com", "password": "123"},
    )
    assert res.status_code == 422
