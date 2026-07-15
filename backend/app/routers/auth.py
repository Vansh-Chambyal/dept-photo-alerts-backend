from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import create_access_token, hash_pin, verify_pin
from ..database import get_db
from ..models import Department, User
from ..schemas import (
    LoginRequest,
    PhoneCheckRequest,
    PhoneCheckResponse,
    SetPinRequest,
    TokenResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/check-phone", response_model=PhoneCheckResponse)
async def check_phone(payload: PhoneCheckRequest, db: AsyncSession = Depends(get_db)):
    """Step 1 of login: the frontend calls this to decide which screen to
    show — 'set your PIN' (whitelisted, first time), 'enter your PIN'
    (returning user), or 'contact your administrator' (not whitelisted)."""
    result = await db.execute(select(User).where(User.phone_number == payload.phone_number))
    user = result.scalar_one_or_none()
    if user is None:
        return PhoneCheckResponse(exists=False, has_pin=False)
    return PhoneCheckResponse(exists=True, has_pin=user.pin_hash is not None)


@router.post("/set-pin", response_model=TokenResponse)
async def set_pin(payload: SetPinRequest, db: AsyncSession = Depends(get_db)):
    """First-time setup. Only works for a phone number an admin has already
    whitelisted (see POST /users/whitelist), and only before a PIN exists."""
    result = await db.execute(select(User).where(User.phone_number == payload.phone_number))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=403, detail="This phone number hasn't been added by an administrator yet.")
    if user.pin_hash is not None:
        raise HTTPException(status_code=400, detail="PIN already set — use /auth/login instead.")

    dept = await db.get(Department, payload.department_id)
    if dept is None:
        raise HTTPException(status_code=404, detail="That department doesn't exist.")

    user.pin_hash = hash_pin(payload.pin)
    user.department_id = payload.department_id
    await db.commit()

    token = create_access_token({"sub": str(user.id), "is_admin": user.is_admin})
    return TokenResponse(access_token=token, is_admin=user.is_admin, department_id=user.department_id)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.phone_number == payload.phone_number))
    user = result.scalar_one_or_none()
    if user is None or user.pin_hash is None or not verify_pin(payload.pin, user.pin_hash):
        raise HTTPException(status_code=401, detail="Invalid phone number or PIN.")

    token = create_access_token({"sub": str(user.id), "is_admin": user.is_admin})
    return TokenResponse(access_token=token, is_admin=user.is_admin, department_id=user.department_id)
