from pydantic import BaseModel
from typing import List, Dict, Optional
from decimal import Decimal


class SpendingSummary(BaseModel):
    total: Decimal
    currency: str
    period: str
    change_percent: Optional[float] = None


class CategoryBreakdown(BaseModel):
    category: str
    amount: Decimal
    percentage: float
    count: int


class DailySpending(BaseModel):
    date: str
    amount: Decimal


class MerchantBreakdown(BaseModel):
    merchant: str
    amount: Decimal
    count: int


class DashboardMetrics(BaseModel):
    total_this_month: Decimal
    total_last_month: Decimal
    change_percent: float
    currency: str
    top_category: Optional[str] = None
    budget_utilization: Optional[float] = None
    total_expenses_count: int
    daily_spending: List[DailySpending]
    category_breakdown: List[CategoryBreakdown]
    recent_expenses: List[Dict]


class SpendingReport(BaseModel):
    period: str
    total: Decimal
    currency: str
    category_breakdown: List[CategoryBreakdown]
    daily_spending: List[DailySpending]
    merchant_breakdown: List[MerchantBreakdown]
    comparison: Optional[Dict] = None
