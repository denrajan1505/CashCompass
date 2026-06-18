from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
from decimal import Decimal

from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse, ExpenseListResponse, ExpenseFilter
from app.services import expense_service
from app.services import export_service

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.post("", response_model=ExpenseResponse, status_code=201)
def create(req: ExpenseCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return expense_service.create_expense(db, user, req)


@router.get("", response_model=ExpenseListResponse)
def list_expenses(
    category: Optional[str] = None,
    currency: Optional[str] = None,
    merchant: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    min_amount: Optional[Decimal] = None,
    max_amount: Optional[Decimal] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    filters = ExpenseFilter(
        category=category, currency=currency, merchant=merchant,
        date_from=date_from, date_to=date_to, min_amount=min_amount,
        max_amount=max_amount, search=search, page=page, per_page=per_page,
    )
    return expense_service.get_expenses(db, user, filters)


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get(expense_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return expense_service.get_expense(db, user, expense_id)


@router.patch("/{expense_id}", response_model=ExpenseResponse)
def update(expense_id: str, req: ExpenseUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return expense_service.update_expense(db, user, expense_id, req)


@router.delete("/{expense_id}", status_code=204)
def delete(expense_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    expense_service.delete_expense(db, user, expense_id)


@router.get("/export/download")
def export(
    format: str = Query("csv", regex="^(csv|xlsx|pdf)$"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if format == "csv":
        data = export_service.export_csv(db, user)
        return Response(content=data, media_type="text/csv",
                        headers={"Content-Disposition": "attachment; filename=expenses.csv"})
    if format == "xlsx":
        data = export_service.export_xlsx(db, user)
        return Response(content=data,
                        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        headers={"Content-Disposition": "attachment; filename=expenses.xlsx"})
    if format == "pdf":
        data = export_service.export_pdf(db, user)
        return Response(content=data, media_type="application/pdf",
                        headers={"Content-Disposition": "attachment; filename=expenses.pdf"})
