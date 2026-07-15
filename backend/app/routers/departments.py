import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import require_admin
from ..database import get_db
from ..models import Department, User
from ..schemas import DepartmentCreate, DepartmentOut

router = APIRouter(prefix="/departments", tags=["departments"])


@router.get("", response_model=list[DepartmentOut])
async def list_departments(db: AsyncSession = Depends(get_db)):
    """Public — no login needed, so the first-login screen can show the
    department picker before a new user even has a token."""
    result = await db.execute(select(Department).order_by(Department.name))
    return result.scalars().all()


@router.post("", response_model=DepartmentOut)
async def create_department(
    payload: DepartmentCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    existing = await db.execute(select(Department).where(Department.name == payload.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="A department with that name already exists.")
    dept = Department(name=payload.name)
    db.add(dept)
    await db.commit()
    await db.refresh(dept)
    return dept


@router.put("/{department_id}", response_model=DepartmentOut)
async def rename_department(
    department_id: uuid.UUID,
    payload: DepartmentCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    dept = await db.get(Department, department_id)
    if dept is None:
        raise HTTPException(status_code=404, detail="Department not found.")
    dept.name = payload.name
    await db.commit()
    await db.refresh(dept)
    return dept


@router.delete("/{department_id}")
async def delete_department(
    department_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    dept = await db.get(Department, department_id)
    if dept is None:
        raise HTTPException(status_code=404, detail="Department not found.")
    in_use = await db.execute(select(User).where(User.department_id == department_id))
    if in_use.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Move or remove users from this department first.")
    await db.delete(dept)
    await db.commit()
    return {"detail": "Department deleted."}
