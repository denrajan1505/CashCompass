from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import List

from app.models.expense import Expense
from app.models.user import User
from app.schemas.analytics import DashboardMetrics, CategoryBreakdown, DailySpending, MerchantBreakdown, SpendingReport


def get_dashboard_metrics(db: Session, user: User) -> DashboardMetrics:
    today = date.today()
    this_month_start = today.replace(day=1)
    last_month_end = this_month_start - timedelta(days=1)
    last_month_start = last_month_end.replace(day=1)

    def month_total(start: date, end: date) -> Decimal:
        result = db.query(func.sum(func.coalesce(Expense.amount_in_base, Expense.amount))).filter(
            Expense.user_id == user.id,
            Expense.expense_date >= start,
            Expense.expense_date <= end,
        ).scalar()
        return Decimal(str(result or 0))

    this_month = month_total(this_month_start, today)
    last_month = month_total(last_month_start, last_month_end)
    change_pct = float((this_month - last_month) / last_month * 100) if last_month else 0

    # Category breakdown this month
    cat_rows = db.query(
        Expense.category,
        func.sum(func.coalesce(Expense.amount_in_base, Expense.amount)).label("total"),
        func.count(Expense.id).label("cnt"),
    ).filter(
        Expense.user_id == user.id,
        Expense.expense_date >= this_month_start,
    ).group_by(Expense.category).order_by(func.sum(func.coalesce(Expense.amount_in_base, Expense.amount)).desc()).all()

    category_breakdown = [
        CategoryBreakdown(
            category=r.category,
            amount=Decimal(str(r.total or 0)),
            percentage=float(Decimal(str(r.total or 0)) / this_month * 100) if this_month else 0,
            count=r.cnt,
        )
        for r in cat_rows
    ]

    # Monthly spending last 6 months (for dashboard chart)
    daily_rows = db.query(
        Expense.expense_date,
        func.sum(func.coalesce(Expense.amount_in_base, Expense.amount)).label("total"),
    ).filter(
        Expense.user_id == user.id,
        Expense.expense_date >= today - timedelta(days=179),
    ).group_by(Expense.expense_date).order_by(Expense.expense_date).all()

    # Aggregate by month for the dashboard chart
    monthly_map: dict = {}
    for r in daily_rows:
        key = str(r.expense_date)[:7]  # "YYYY-MM"
        monthly_map[key] = monthly_map.get(key, Decimal(0)) + Decimal(str(r.total or 0))
    daily_spending = [DailySpending(date=k, amount=v) for k, v in sorted(monthly_map.items())]

    # Recent expenses
    recent = db.query(Expense).filter(Expense.user_id == user.id).order_by(Expense.created_at.desc()).limit(5).all()
    recent_expenses = [
        {"id": str(e.id), "amount": float(e.amount), "currency": e.currency,
         "category": e.category, "merchant": e.merchant, "date": str(e.expense_date)}
        for e in recent
    ]

    total_count = db.query(func.count(Expense.id)).filter(Expense.user_id == user.id).scalar() or 0
    top_cat = category_breakdown[0].category if category_breakdown else None

    return DashboardMetrics(
        total_this_month=this_month,
        total_last_month=last_month,
        change_percent=round(change_pct, 2),
        currency=user.preferred_currency,
        top_category=top_cat,
        total_expenses_count=total_count,
        daily_spending=daily_spending,
        category_breakdown=category_breakdown,
        recent_expenses=recent_expenses,
    )


def get_spending_report(db: Session, user: User, year: int, month: int) -> SpendingReport:
    start = date(year, month, 1)
    if month == 12:
        end = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end = date(year, month + 1, 1) - timedelta(days=1)

    total = db.query(func.sum(func.coalesce(Expense.amount_in_base, Expense.amount))).filter(
        Expense.user_id == user.id,
        Expense.expense_date.between(start, end),
    ).scalar() or Decimal(0)

    cat_rows = db.query(
        Expense.category,
        func.sum(func.coalesce(Expense.amount_in_base, Expense.amount)).label("total"),
        func.count(Expense.id).label("cnt"),
    ).filter(
        Expense.user_id == user.id,
        Expense.expense_date.between(start, end),
    ).group_by(Expense.category).order_by(func.sum(func.coalesce(Expense.amount_in_base, Expense.amount)).desc()).all()

    category_breakdown = [
        CategoryBreakdown(
            category=r.category,
            amount=Decimal(str(r.total or 0)),
            percentage=float(Decimal(str(r.total or 0)) / Decimal(str(total)) * 100) if total else 0,
            count=r.cnt,
        )
        for r in cat_rows
    ]

    daily_rows = db.query(
        Expense.expense_date, func.sum(func.coalesce(Expense.amount_in_base, Expense.amount)).label("total"),
    ).filter(
        Expense.user_id == user.id,
        Expense.expense_date.between(start, end),
    ).group_by(Expense.expense_date).order_by(Expense.expense_date).all()

    merchant_rows = db.query(
        Expense.merchant, func.sum(func.coalesce(Expense.amount_in_base, Expense.amount)).label("total"), func.count(Expense.id).label("cnt"),
    ).filter(
        Expense.user_id == user.id,
        Expense.expense_date.between(start, end),
        Expense.merchant.isnot(None),
    ).group_by(Expense.merchant).order_by(func.sum(func.coalesce(Expense.amount_in_base, Expense.amount)).desc()).limit(10).all()

    return SpendingReport(
        period=f"{year}-{month:02d}",
        total=Decimal(str(total)),
        currency=user.preferred_currency,
        category_breakdown=category_breakdown,
        daily_spending=[DailySpending(date=str(r.expense_date), amount=Decimal(str(r.total or 0))) for r in daily_rows],
        merchant_breakdown=[MerchantBreakdown(merchant=r.merchant or "Unknown", amount=Decimal(str(r.total or 0)), count=r.cnt) for r in merchant_rows],
    )
