import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import get_current_user, require_admin
from ..database import get_db
from ..models import User
from ..schemas import DepartmentPickRequest, FcmTokenRequest, UserOut, WhitelistRequest

router = APIRouter(prefix="/users", tags=["users"])


def _to_user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        phone_number=user.phone_number,
        is_admin=user.is_admin,
        department_id=user.department_id,
        has_pin=user.pin_hash is not None,
    )


@router.get("/me", response_model=UserOut)
async def get_me(current: User = Depends(get_current_user)):
    return _to_user_out(current)


@router.post("/me/fcm-token")
async def set_fcm_token(
    payload: FcmTokenRequest,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """Frontend calls this once it has a push token from the FCM SDK, so the
    backend knows where to deliver that user's notifications."""
    current.fcm_token = payload.token
    db.add(current)
    await db.commit()
    return {"detail": "FCM token saved."}


@router.post("/me/department")
async def change_department(
    payload: DepartmentPickRequest,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(get_current_user),
):
    current.department_id = payload.department_id
    db.add(current)
    await db.commit()
    return {"detail": "Department updated."}


# ---------- Admin only ----------

@router.get("", response_model=list[UserOut])
async def list_users(db: AsyncSession = Depends(get_db), _admin: User = Depends(require_admin)):
    result = await db.execute(select(User).order_by(User.created_at))
    return [_to_user_out(u) for u in result.scalars().all()]


@router.post("/whitelist", response_model=UserOut)
async def whitelist_number(
    payload: WhitelistRequest,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Grants a phone number access to the app. The person still picks their
    own PIN and department on first login — this just lets them in the door."""
    existing = await db.execute(select(User).where(User.phone_number == payload.phone_number))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="That phone number is already registered.")
    user = User(phone_number=payload.phone_number, is_admin=False)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return _to_user_out(user)


@router.delete("/{user_id}")
async def remove_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.is_admin:
        raise HTTPException(status_code=400, detail="Can't remove an administrator.")
    await db.delete(user)
    await db.commit()
    return {"detail": "User removed."}
