from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, extract
from fastapi import HTTPException
from typing import Optional
from datetime import date
from decimal import Decimal
import math

from app.models.expense import Expense
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseListResponse, ExpenseResponse, ExpenseFilter
from app.core.dependencies import check_daily_expense_limit
from app.utils.currency import convert_to_base


def create_expense(db: Session, user: User, req: ExpenseCreate) -> Expense:
    check_daily_expense_limit(user, db)

    amount_in_base = convert_to_base(db, req.amount, req.currency, user.preferred_currency)

    expense = Expense(
        user_id=user.id,
        amount=req.amount,
        currency=req.currency,
        amount_in_base=amount_in_base,
        category=req.category,
        merchant=req.merchant,
        notes=req.notes,
        tags=req.tags or [],
        expense_date=req.expense_date,
        source=req.source,
    )
    db.add(expense)

    user.daily_expense_count = (user.daily_expense_count or 0) + 1
    db.commit()
    db.refresh(expense)
    return expense


def get_expenses(db: Session, user: User, filters: ExpenseFilter) -> ExpenseListResponse:
    query = db.query(Expense).filter(Expense.user_id == user.id)

    if filters.category:
        query = query.filter(Expense.category == filters.category)
    if filters.currency:
        query = query.filter(Expense.currency == filters.currency)
    if filters.merchant:
        query = query.filter(Expense.merchant.ilike(f"%{filters.merchant}%"))
    if filters.date_from:
        query = query.filter(Expense.expense_date >= filters.date_from)
    if filters.date_to:
        query = query.filter(Expense.expense_date <= filters.date_to)
    if filters.min_amount:
        query = query.filter(Expense.amount >= filters.min_amount)
    if filters.max_amount:
        query = query.filter(Expense.amount <= filters.max_amount)
    if filters.search:
        term = f"%{filters.search}%"
        query = query.filter(or_(
            Expense.merchant.ilike(term),
            Expense.notes.ilike(term),
            Expense.category.ilike(term),
        ))

    total = query.count()
    total_pages = math.ceil(total / filters.per_page) if total else 1
    items = (
        query.order_by(Expense.expense_date.desc(), Expense.created_at.desc())
        .offset((filters.page - 1) * filters.per_page)
        .limit(filters.per_page)
        .all()
    )

    return ExpenseListResponse(
        items=[ExpenseResponse.model_validate(e) for e in items],
        total=total,
        page=filters.page,
        per_page=filters.per_page,
        total_pages=total_pages,
    )


def get_expense(db: Session, user: User, expense_id: str) -> Expense:
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == user.id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


def update_expense(db: Session, user: User, expense_id: str, req: ExpenseUpdate) -> Expense:
    expense = get_expense(db, user, expense_id)
    data = req.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(expense, k, v)
    if "amount" in data or "currency" in data:
        expense.amount_in_base = convert_to_base(db, expense.amount, expense.currency, user.preferred_currency)
    db.commit()
    db.refresh(expense)
    return expense


def delete_expense(db: Session, user: User, expense_id: str):
    expense = get_expense(db, user, expense_id)
    db.delete(expense)
    db.commit()
