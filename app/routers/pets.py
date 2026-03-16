import uuid
from datetime import timezone
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy import select, delete, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import get_current_user
from ..database import get_async_session
from ..models import Pet, PetImage, User
from ..schemas import PetCreate, PetRead, PetUpdate
from ..pdf import render_pet_flyer_pdf

router = APIRouter()


@router.get("/", response_model=List[PetRead])
async def list_pets(
    species: Optional[str] = None,
    sex: Optional[str] = None,
    breed: Optional[str] = None,
    color: Optional[str] = None,
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
    if color is not None:
        query = query.where(Pet.color == color)
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


def _pet_to_read(pet: Pet, image_paths: List[str]) -> PetRead:
    data = {k: getattr(pet, k) for k in ("id", "name", "species", "sex", "breed", "color", "city",
            "last_seen_place", "last_seen_date", "description", "is_lost", "owner_id", "is_active",
            "contact_name", "contact_phone", "contact_email", "image_path", "created_at")}
    data["image_paths"] = image_paths
    return PetRead(**data)


@router.get("/{pet_id}", response_model=PetRead)
async def get_pet(
    pet_id: int,
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(select(Pet).where(Pet.id == pet_id))
    pet = result.scalar_one_or_none()
    if pet is None:
        raise HTTPException(status_code=404, detail="Pet not found")
    imgs = await session.execute(
        select(PetImage.image_path).where(PetImage.pet_id == pet_id).order_by(PetImage.sort_order)
    )
    paths = list(imgs.scalars().all())
    if not paths and pet.image_path:
        paths = [pet.image_path]
    return _pet_to_read(pet, paths)


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


@router.patch("/{pet_id}", response_model=PetRead)
async def update_pet(
    pet_id: int,
    pet_in: PetUpdate,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
):
    """Редактировать своё объявление (только владелец)."""
    result = await session.execute(select(Pet).where(Pet.id == pet_id))
    pet = result.scalar_one_or_none()
    if pet is None:
        raise HTTPException(status_code=404, detail="Pet not found")
    if pet.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    data = pet_in.model_dump(exclude_unset=True)
    dt = data.get("last_seen_date")
    if dt is not None and getattr(dt, "tzinfo", None) is not None:
        data["last_seen_date"] = dt.astimezone(timezone.utc).replace(tzinfo=None)
    for key, value in data.items():
        setattr(pet, key, value)
    await session.commit()
    await session.refresh(pet)
    imgs = await session.execute(
        select(PetImage.image_path).where(PetImage.pet_id == pet_id).order_by(PetImage.sort_order)
    )
    paths = list(imgs.scalars().all())
    if not paths and pet.image_path:
        paths = [pet.image_path]
    return _pet_to_read(pet, paths)


UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads" / "pets"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}


@router.post("/{pet_id}/photo", response_model=PetRead)
async def upload_pet_photo(
    pet_id: int,
    image: UploadFile = File(...),
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
):
    """Загрузить фото для объявления (можно вызывать многократно — несколько фото)."""
    result = await session.execute(select(Pet).where(Pet.id == pet_id))
    pet = result.scalar_one_or_none()
    if pet is None:
        raise HTTPException(status_code=404, detail="Pet not found")
    if pet.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    suffix = Path(image.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Allowed formats: jpg, png, gif, webp",
        )

    # Следующий sort_order
    order_result = await session.execute(
        select(func.coalesce(func.max(PetImage.sort_order), -1) + 1).where(PetImage.pet_id == pet_id)
    )
    sort_order = order_result.scalar_one()
    unique = f"{pet_id}_{sort_order}_{uuid.uuid4().hex[:8]}{suffix}"
    relative_path = f"pets/{unique}"

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    (UPLOAD_DIR / unique).write_bytes(await image.read())

    session.add(PetImage(pet_id=pet_id, image_path=relative_path, sort_order=sort_order))
    if pet.image_path is None:
        await session.execute(update(Pet).where(Pet.id == pet_id).values(image_path=relative_path))
    await session.commit()
    await session.refresh(pet)
    imgs = await session.execute(
        select(PetImage.image_path).where(PetImage.pet_id == pet_id).order_by(PetImage.sort_order)
    )
    paths = list(imgs.scalars().all())
    return _pet_to_read(pet, paths)


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
