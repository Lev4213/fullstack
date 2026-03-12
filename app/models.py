from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Pet(Base):
    __tablename__ = "pets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    species = Column(String(100), nullable=False, index=True)
    sex = Column(String(20), nullable=True, index=True)
    breed = Column(String(255), nullable=True)
    color = Column(String(255), nullable=True)
    city = Column(String(255), nullable=True, index=True)
    last_seen_place = Column(String(500), nullable=True)
    last_seen_date = Column(DateTime, nullable=True)
    description = Column(String(1000), nullable=True)
    is_lost = Column(Boolean, default=True, index=True)
    is_active = Column(Boolean, default=True, index=True)

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    contact_name = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    contact_email = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
