from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse
from app.services import budget_service

router = APIRouter(prefix="/budgets", tags=["Budgets"])


@router.post("", response_model=BudgetResponse, status_code=201)
def create(req: BudgetCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return budget_service.create_budget(db, user, req)


@router.get("", response_model=List[BudgetResponse])
def list_budgets(
    month: int = Query(date.today().month, ge=1, le=12),
    year: int = Query(date.today().year),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return budget_service.get_budgets(db, user, month, year)


@router.patch("/{budget_id}", response_model=BudgetResponse)
def update(budget_id: str, req: BudgetUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return budget_service.update_budget(db, user, budget_id, req)


@router.delete("/{budget_id}", status_code=204)
def delete(budget_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    budget_service.delete_budget(db, user, budget_id)
