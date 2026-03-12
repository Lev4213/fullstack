from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PetBase(BaseModel):
    name: str
    species: str
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


class PetCreate(PetBase):
    pass


class PetRead(PetBase):
    id: int
    owner_id: Optional[int] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
