import re
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Пароль должен быть не менее 6 символов")
        return v


class UserRead(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


def _validate_phone(v: Optional[str]) -> Optional[str]:
    if v is None or not v.strip():
        return None
    v = v.strip()
    digits = re.sub(r"\D", "", v)
    if len(digits) < 10:
        raise ValueError("Телефон должен содержать не менее 10 цифр")
    if len(v) > 20:
        raise ValueError("Слишком длинный номер")
    return v


class PetBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="Кличка обязательна")
    species: str = Field(..., min_length=1, max_length=100, description="Вид обязателен")
    sex: Optional[str] = None
    breed: Optional[str] = None
    color: Optional[str] = None
    city: Optional[str] = None
    last_seen_place: Optional[str] = None
    last_seen_date: Optional[datetime] = None
    description: Optional[str] = None
    is_lost: bool = True
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[EmailStr] = None

    @field_validator("contact_phone")
    @classmethod
    def contact_phone_valid(cls, v: Optional[str]) -> Optional[str]:
        return _validate_phone(v)


class PetCreate(PetBase):
    pass


class PetUpdate(BaseModel):
    """Частичное обновление — все поля опциональны."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    species: Optional[str] = Field(None, min_length=1, max_length=100)
    sex: Optional[str] = None
    breed: Optional[str] = None
    color: Optional[str] = None
    city: Optional[str] = None
    last_seen_place: Optional[str] = None
    last_seen_date: Optional[datetime] = None
    description: Optional[str] = None
    is_lost: Optional[bool] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[EmailStr] = None

    @field_validator("contact_phone")
    @classmethod
    def contact_phone_valid(cls, v: Optional[str]) -> Optional[str]:
        return _validate_phone(v)


class PetRead(PetBase):
    id: int
    owner_id: Optional[int] = None
    is_active: bool
    image_path: Optional[str] = None
    image_paths: List[str] = []
    created_at: datetime

    class Config:
        from_attributes = True
