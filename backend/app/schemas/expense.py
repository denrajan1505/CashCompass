from pydantic import BaseModel, field_validator
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal


class ExpenseCreate(BaseModel):
    amount: Decimal
    currency: str = "INR"
    category: str = "Other"
    merchant: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = []
    expense_date: date
    source: str = "manual"

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Amount must be positive")
        return v

    @field_validator("currency")
    @classmethod
    def currency_length(cls, v: str) -> str:
        if len(v) != 3:
            raise ValueError("Currency must be a 3-letter code")
        return v.upper()


class ExpenseUpdate(BaseModel):
    amount: Optional[Decimal] = None
    currency: Optional[str] = None
    category: Optional[str] = None
    merchant: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    expense_date: Optional[date] = None


class ExpenseResponse(BaseModel):
    id: UUID
    user_id: UUID
    amount: Decimal
    currency: str
    amount_in_base: Optional[Decimal] = None
    category: str
    merchant: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = []
    expense_date: date
    source: str
    created_at: datetime

    class Config:
        from_attributes = True


class ExpenseListResponse(BaseModel):
    items: List[ExpenseResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class ExpenseFilter(BaseModel):
    category: Optional[str] = None
    currency: Optional[str] = None
    merchant: Optional[str] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    min_amount: Optional[Decimal] = None
    max_amount: Optional[Decimal] = None
    tags: Optional[List[str]] = None
    search: Optional[str] = None
    page: int = 1
    per_page: int = 20
