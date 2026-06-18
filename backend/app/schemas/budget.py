from pydantic import BaseModel, field_validator
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from decimal import Decimal


class BudgetCreate(BaseModel):
    category: str
    monthly_limit: Decimal
    currency: str = "INR"
    alert_threshold: int = 80
    month: int
    year: int

    @field_validator("monthly_limit")
    @classmethod
    def limit_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Monthly limit must be positive")
        return v

    @field_validator("alert_threshold")
    @classmethod
    def threshold_range(cls, v: int) -> int:
        if not (1 <= v <= 100):
            raise ValueError("Alert threshold must be between 1 and 100")
        return v


class BudgetUpdate(BaseModel):
    monthly_limit: Optional[Decimal] = None
    alert_threshold: Optional[int] = None


class BudgetResponse(BaseModel):
    id: UUID
    user_id: UUID
    category: str
    monthly_limit: Decimal
    currency: str
    alert_threshold: int
    month: int
    year: int
    spent: Optional[Decimal] = 0
    percentage_used: Optional[float] = 0
    created_at: datetime

    class Config:
        from_attributes = True
