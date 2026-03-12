from datetime import timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import get_current_user
from ..database import get_async_session
from ..models import Pet, User
from ..schemas import PetCreate, PetRead
from ..pdf import render_pet_flyer_pdf

router = APIRouter()


@router.get("/", response_model=List[PetRead])
async def list_pets(
    species: Optional[str] = None,
    sex: Optional[str] = None,
    breed: Optional[str] = None,
    city: Optional[str] = None,
    is_lost: Optional[bool] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    session: AsyncSession = Depends(get_async_session),
):
    from datetime import datetime
    query = select(Pet).where(Pet.is_active.is_(True))
    if species is not None:
        query = query.where(Pet.species == species)
    if sex is not None:
        query = query.where(Pet.sex == sex)
    if breed is not None:
        query = query.where(Pet.breed == breed)
    if city is not None:
        query = query.where(Pet.city == city)
    if is_lost is not None:
        query = query.where(Pet.is_lost == is_lost)
    if date_from is not None:
        try:
            dt = datetime.fromisoformat(date_from.replace("Z", "+00:00"))
            if dt.tzinfo:
                dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
            query = query.where(Pet.last_seen_date >= dt)
        except ValueError:
            pass
    if date_to is not None:
        try:
            dt = datetime.fromisoformat(date_to.replace("Z", "+00:00"))
            if dt.tzinfo:
                dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
            query = query.where(Pet.last_seen_date <= dt)
        except ValueError:
            pass

    result = await session.execute(query)
    pets = result.scalars().all()
    return pets


@router.get("/my", response_model=List[PetRead])
async def list_my_pets(
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(
        select(Pet).where(Pet.owner_id == current_user.id, Pet.is_active.is_(True))
    )
    pets = result.scalars().all()
    return pets


@router.get("/{pet_id}", response_model=PetRead)
async def get_pet(
    pet_id: int,
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(select(Pet).where(Pet.id == pet_id))
    pet = result.scalar_one_or_none()
    if pet is None:
        raise HTTPException(status_code=404, detail="Pet not found")
    return pet


@router.post("/", response_model=PetRead)
async def create_pet(
    pet_in: PetCreate,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
):
    data = pet_in.model_dump()
    dt = data.get("last_seen_date")
    if dt is not None and getattr(dt, "tzinfo", None) is not None:
        data["last_seen_date"] = dt.astimezone(timezone.utc).replace(tzinfo=None)

    pet = Pet(**data, owner_id=current_user.id)
    session.add(pet)
    await session.commit()
    await session.refresh(pet)
    return pet


@router.delete("/{pet_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_pet(
    pet_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(select(Pet).where(Pet.id == pet_id))
    pet = result.scalar_one_or_none()
    if pet is None:
        raise HTTPException(status_code=404, detail="Pet not found")
    if pet.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    pet.is_active = False
    await session.commit()


@router.delete("/{pet_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pet_permanent(
    pet_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
):
    """Полностью удалить объявление из базы (только владелец)."""
    result = await session.execute(select(Pet).where(Pet.id == pet_id))
    pet = result.scalar_one_or_none()
    if pet is None:
        raise HTTPException(status_code=404, detail="Pet not found")
    if pet.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    await session.execute(delete(Pet).where(Pet.id == pet_id))
    await session.commit()


@router.get("/{pet_id}/flyer.pdf")
async def download_flyer_pdf(
    pet_id: int,
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(select(Pet).where(Pet.id == pet_id))
    pet = result.scalar_one_or_none()
    if pet is None:
        raise HTTPException(status_code=404, detail="Pet not found")

    lines = [
        f"Имя: {pet.name}",
        f"Вид: {pet.species}",
        f"Порода: {pet.breed or '-'}",
        f"Окрас: {pet.color or '-'}",
        f"Город: {pet.city or '-'}",
        f"Где видели: {pet.last_seen_place or '-'}",
        f"Когда видели: {pet.last_seen_date.isoformat() if pet.last_seen_date else '-'}",
        "",
        f"Описание: {pet.description or '-'}",
        "",
        f"Контакт: {pet.contact_name or '-'}",
        f"Телефон: {pet.contact_phone or '-'}",
        f"Email: {pet.contact_email or '-'}",
    ]

    pdf_bytes = render_pet_flyer_pdf(
        title="ПРОПАЛ ПИТОМЕЦ — ПОМОГИТЕ НАЙТИ",
        lines=lines,
    )

    filename = f"pet-{pet.id}-flyer.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
