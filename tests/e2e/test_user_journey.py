"""Сквозные сценарии на уровне API: регистрация → CRUD → права доступа."""

import pytest
from httpx import AsyncClient


@pytest.mark.e2e
async def test_full_pet_lifecycle(client: AsyncClient):
    email = "lifecycle@example.com"
    password = "secret123"

    reg = await client.post("/auth/register", json={"email": email, "password": password})
    assert reg.status_code == 201

    login = await client.post(
        "/auth/login",
        data={"username": email, "password": password},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    me = await client.get("/auth/me", headers=headers)
    assert me.status_code == 200

    create = await client.post(
        "/pets/",
        json={
            "name": "Шарик",
            "species": "собака",
            "city": "СПб",
            "is_lost": True,
        },
        headers=headers,
    )
    assert create.status_code == 200
    pet_id = create.json()["id"]

    my_list = await client.get("/pets/my", headers=headers)
    assert my_list.status_code == 200
    assert any(p["id"] == pet_id for p in my_list.json())

    update = await client.patch(
        f"/pets/{pet_id}",
        json={"description": "Потерялся у метро"},
        headers=headers,
    )
    assert update.status_code == 200
    assert update.json()["description"] == "Потерялся у метро"

    public = await client.get(f"/pets/{pet_id}")
    assert public.status_code == 200

    delete = await client.delete(f"/pets/{pet_id}/permanent", headers=headers)
    assert delete.status_code == 204

    gone = await client.get(f"/pets/{pet_id}")
    assert gone.status_code == 404


@pytest.mark.e2e
async def test_session_logout_simulation(client: AsyncClient):
    """Имитация истечения сессии: запрос без токена после «выхода»."""
    email = "logout@example.com"
    password = "secret123"
    await client.post("/auth/register", json={"email": email, "password": password})
    login = await client.post(
        "/auth/login",
        data={"username": email, "password": password},
    )
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    assert (await client.get("/auth/me", headers=headers)).status_code == 200

    assert (await client.get("/auth/me")).status_code == 401
    assert (await client.get("/pets/my")).status_code == 401


@pytest.mark.e2e
async def test_owner_vs_other_user_permissions(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
):
    create = await client.post(
        "/pets/",
        json={"name": "Защищённый", "species": "кот"},
        headers=auth_headers,
    )
    pet_id = create.json()["id"]

    forbidden = await client.delete(f"/pets/{pet_id}", headers=other_auth_headers)
    assert forbidden.status_code == 403

    allowed = await client.delete(f"/pets/{pet_id}", headers=auth_headers)
    assert allowed.status_code == 204
