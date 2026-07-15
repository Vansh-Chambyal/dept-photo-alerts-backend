import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from supabase import create_client

from ..auth import get_current_user, require_admin
from ..config import settings
from ..database import get_db
from ..fcm import send_to_tokens
from ..models import Department, Photo, User
from ..schemas import PhotoOut

router = APIRouter(prefix="/photos", tags=["photos"])

_supabase = create_client(settings.supabase_url, settings.supabase_service_key)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_BYTES = 25 * 1024 * 1024  # 25MB cap — allows uncompressed HD iPhone photos


@router.post("/send", response_model=PhotoOut)
async def send_photo(
    department_id: uuid.UUID = Form(...),
    caption: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, or WEBP images are allowed.")
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="Image is too large (max 25MB).")

    dept = await db.get(Department, department_id)
    if dept is None:
        raise HTTPException(status_code=404, detail="That department doesn't exist.")

    ext = (file.filename or "photo.jpg").rsplit(".", 1)[-1].lower()
    storage_path = f"{department_id}/{uuid.uuid4()}.{ext}"
    _supabase.storage.from_(settings.supabase_bucket).upload(
        storage_path, data, {"content-type": file.content_type}
    )
    image_url = _supabase.storage.from_(settings.supabase_bucket).get_public_url(storage_path)

    photo = Photo(department_id=department_id, sent_by_id=admin.id, image_url=image_url, caption=caption)
    db.add(photo)
    await db.commit()
    await db.refresh(photo)

    result = await db.execute(
        select(User.fcm_token).where(User.department_id == department_id, User.fcm_token.is_not(None))
    )
    tokens = [t for (t,) in result.all()]
    send_to_tokens(
        tokens,
        title=f"New photo — {dept.name}",
        body=caption or "An admin sent a new photo to your department.",
        image_url=image_url,
    )

    return photo


@router.get("", response_model=list[PhotoOut])
async def list_photos(db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    """Admins see every photo; everyone else sees only their own department's."""
    query = select(Photo).order_by(Photo.created_at.desc())
    if not current.is_admin:
        if current.department_id is None:
            return []
        query = query.where(Photo.department_id == current.department_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.delete("/{photo_id}")
async def delete_photo(
    photo_id: uuid.UUID, 
    db: AsyncSession = Depends(get_db), 
    admin: User = Depends(require_admin)
):
    # 1. Find the photo in the database
    photo = await db.get(Photo, photo_id)
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
        
    # 2. Extract the file path and delete it from the Supabase Storage Bucket
    try:
        path_parts = photo.image_url.split(f"/{settings.supabase_bucket}/")
        if len(path_parts) > 1:
            storage_path = path_parts[1]
            _supabase.storage.from_(settings.supabase_bucket).remove([storage_path])
    except Exception as e:
        print(f"Failed to delete image from Supabase Storage: {e}")
        
    # 3. Delete the row from the database and save
    await db.delete(photo)
    await db.commit()
    
    return {"message": "Photo and storage file deleted successfully"}