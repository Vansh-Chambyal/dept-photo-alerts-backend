import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


# ---------- Auth ----------

class PhoneCheckRequest(BaseModel):
    phone_number: str


class PhoneCheckResponse(BaseModel):
    exists: bool
    has_pin: bool


class SetPinRequest(BaseModel):
    phone_number: str
    pin: str
    department_id: uuid.UUID

    @field_validator("pin")
    @classmethod
    def pin_must_be_reasonable(cls, v: str) -> str:
        if not v.isdigit() or not (4 <= len(v) <= 8):
            raise ValueError("PIN must be 4-8 digits")
        return v


class LoginRequest(BaseModel):
    phone_number: str
    pin: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_admin: bool
    department_id: Optional[uuid.UUID] = None


# ---------- Departments ----------

class DepartmentCreate(BaseModel):
    name: str


class DepartmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str


# ---------- Users ----------

class WhitelistRequest(BaseModel):
    phone_number: str


class UserOut(BaseModel):
    id: uuid.UUID
    phone_number: str
    is_admin: bool
    department_id: Optional[uuid.UUID] = None
    has_pin: bool


class FcmTokenRequest(BaseModel):
    token: str


class DepartmentPickRequest(BaseModel):
    department_id: uuid.UUID


# ---------- Photos ----------

class PhotoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    department_id: uuid.UUID
    image_url: str
    caption: Optional[str] = None
    created_at: datetime
