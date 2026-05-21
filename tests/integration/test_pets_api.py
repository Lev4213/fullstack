"""Интеграционные тесты эндпоинтов /pets."""

import io

import pytest
from httpx import AsyncClient


@pytest.mark.integration
async def test_list_pets_empty(client: AsyncClient):
    res = await client.get("/pets/")
    assert res.status_code == 200
    data = res.json()
    assert data["items"] == []
    assert data["total"] == 0


@pytest.mark.integration
async def test_create_and_get_pet(client: AsyncClient, auth_headers: dict, sample_pet: dict):
    pet_id = sample_pet["id"]
    res = await client.get(f"/pets/{pet_id}")
    assert res.status_code == 200
    assert res.json()["name"] == "Барсик"


@pytest.mark.integration
async def test_list_pagination_and_search(client: AsyncClient, auth_headers: dict):
    for i in range(3):
        await client.post(
            "/pets/",
            json={"name": f"Питомец{i}", "species": "собака", "city": "Казань"},
            headers=auth_headers,
        )
    page = await client.get("/pets/", params={"limit": 2, "offset": 0})
    assert page.status_code == 200
    body = page.json()
    assert len(body["items"]) == 2
    assert body["total"] >= 3

    search = await client.get("/pets/", params={"q": "Питомец1"})
    assert search.status_code == 200
    names = [p["name"] for p in search.json()["items"]]
    assert "Питомец1" in names


@pytest.mark.integration
async def test_filter_by_species(client: AsyncClient, auth_headers: dict):
    await client.post(
        "/pets/",
        json={"name": "Мурка", "species": "кошка"},
        headers=auth_headers,
    )
    res = await client.get("/pets/", params={"species": "кошка"})
    assert res.status_code == 200
    assert all(p["species"] == "кошка" for p in res.json()["items"])


@pytest.mark.integration
async def test_update_forbidden_for_non_owner(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
    sample_pet: dict,
):
    pet_id = sample_pet["id"]
    res = await client.patch(
        f"/pets/{pet_id}",
        json={"name": "Чужой"},
        headers=other_auth_headers,
    )
    assert res.status_code == 403


@pytest.mark.integration
async def test_deactivate_pet(client: AsyncClient, auth_headers: dict, sample_pet: dict):
    pet_id = sample_pet["id"]
    res = await client.delete(f"/pets/{pet_id}", headers=auth_headers)
    assert res.status_code == 204
    listing = await client.get("/pets/")
    ids = [p["id"] for p in listing.json()["items"]]
    assert pet_id not in ids


@pytest.mark.integration
async def test_create_requires_auth(client: AsyncClient):
    res = await client.post("/pets/", json={"name": "X", "species": "y"})
    assert res.status_code == 401


@pytest.mark.integration
async def test_get_pet_not_found(client: AsyncClient):
    res = await client.get("/pets/99999")
    assert res.status_code == 404


@pytest.mark.integration
async def test_upload_photo_and_flyer_pdf(
    client: AsyncClient,
    auth_headers: dict,
    sample_pet: dict,
):
    pet_id = sample_pet["id"]
    fake_jpeg = b"\xff\xd8\xff\xe0" + b"\x00" * 64 + b"\xff\xd9"
    files = {"image": ("photo.jpg", fake_jpeg, "image/jpeg")}
    upload = await client.post(
        f"/pets/{pet_id}/photo",
        files=files,
        headers=auth_headers,
    )
    assert upload.status_code == 200
    assert upload.json().get("image_paths")

    pdf = await client.get(f"/pets/{pet_id}/flyer.pdf")
    assert pdf.status_code == 200
    assert pdf.headers["content-type"] == "application/pdf"
    assert pdf.content.startswith(b"%PDF")


@pytest.mark.integration
async def test_upload_invalid_format(client: AsyncClient, auth_headers: dict, sample_pet: dict):
    pet_id = sample_pet["id"]
    files = {"image": ("bad.txt", io.BytesIO(b"hello"), "text/plain")}
    res = await client.post(f"/pets/{pet_id}/photo", files=files, headers=auth_headers)
    assert res.status_code == 400


@pytest.mark.integration
async def test_health_check(client: AsyncClient):
    """Проверка /health (интеграция с БД в тестовом окружении)."""
    res = await client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] in ("ok", "degraded")
    assert "database" in body
