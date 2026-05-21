"""Модульные тесты сервисного слоя аутентификации."""

import pytest
from jose import jwt

from app.auth import (
    ALGORITHM,
    SECRET_KEY,
    create_access_token,
    get_password_hash,
    verify_password,
)


@pytest.mark.unit
def test_password_hash_and_verify():
    hashed = get_password_hash("mypassword")
    assert hashed != "mypassword"
    assert verify_password("mypassword", hashed)
    assert not verify_password("wrong", hashed)


@pytest.mark.unit
def test_create_access_token_contains_sub():
    token = create_access_token({"sub": "42"})
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["sub"] == "42"
    assert "exp" in payload
