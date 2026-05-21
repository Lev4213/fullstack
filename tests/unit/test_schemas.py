"""Модульные тесты валидации Pydantic-схем."""

import pytest
from pydantic import ValidationError

from app.schemas import PetCreate, UserCreate


@pytest.mark.unit
def test_user_password_min_length():
    with pytest.raises(ValidationError):
        UserCreate(email="a@b.com", password="12345")


@pytest.mark.unit
def test_pet_create_valid_phone():
    pet = PetCreate(name="Рекс", species="собака", contact_phone="+7 (999) 111-22-33")
    assert pet.contact_phone is not None


@pytest.mark.unit
def test_pet_create_invalid_phone():
    with pytest.raises(ValidationError):
        PetCreate(name="Рекс", species="собака", contact_phone="123")


@pytest.mark.unit
def test_pet_create_requires_name_and_species():
    with pytest.raises(ValidationError):
        PetCreate(name="", species="собака")
