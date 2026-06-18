from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from datetime import date

from app.models.budget import Budget
from app.models.expense import Expense
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse
from decimal import Decimal


def create_budget(db: Session, user: User, req: BudgetCreate) -> BudgetResponse:
    existing = db.query(Budget).filter(
        Budget.user_id == user.id,
        Budget.category == req.category,
        Budget.month == req.month,
        Budget.year == req.year,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Budget for this category and month already exists")

    budget = Budget(user_id=user.id, **req.model_dump())
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return _enrich(db, budget, user)


def get_budgets(db: Session, user: User, month: int, year: int):
    budgets = db.query(Budget).filter(
        Budget.user_id == user.id,
        Budget.month == month,
        Budget.year == year,
    ).all()
    return [_enrich(db, b, user) for b in budgets]


def update_budget(db: Session, user: User, budget_id: str, req: BudgetUpdate) -> BudgetResponse:
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    for k, v in req.model_dump(exclude_unset=True).items():
        setattr(budget, k, v)
    db.commit()
    db.refresh(budget)
    return _enrich(db, budget, user)


def delete_budget(db: Session, user: User, budget_id: str):
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(budget)
    db.commit()


def _enrich(db: Session, budget: Budget, user: User) -> BudgetResponse:
    from datetime import date
    start = date(budget.year, budget.month, 1)
    if budget.month == 12:
        from datetime import timedelta
        end = date(budget.year + 1, 1, 1) - timedelta(days=1)
    else:
        end = date(budget.year, budget.month + 1, 1)

    spent = db.query(func.sum(Expense.amount_in_base)).filter(
        Expense.user_id == user.id,
        Expense.category == budget.category,
        Expense.expense_date >= start,
        Expense.expense_date < end,
    ).scalar() or Decimal(0)

    pct = float(Decimal(str(spent)) / budget.monthly_limit * 100) if budget.monthly_limit else 0

    return BudgetResponse(
        id=budget.id,
        user_id=budget.user_id,
        category=budget.category,
        monthly_limit=budget.monthly_limit,
        currency=budget.currency,
        alert_threshold=budget.alert_threshold,
        month=budget.month,
        year=budget.year,
        spent=Decimal(str(spent)),
        percentage_used=round(pct, 2),
        created_at=budget.created_at,
    )
