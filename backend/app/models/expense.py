from sqlalchemy import Column, String, Numeric, DateTime, Text, ForeignKey, Date, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.database import Base


CATEGORIES = [
    "Food & Dining", "Transportation", "Shopping", "Entertainment",
    "Health & Medical", "Utilities", "Housing", "Education",
    "Travel", "Personal Care", "Investments", "Insurance",
    "Gifts & Donations", "Business", "Other"
]


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), nullable=False, default="INR")
    amount_in_base = Column(Numeric(12, 2), nullable=True)
    category = Column(String(100), nullable=False, default="Other")
    merchant = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True, default=list)
    expense_date = Column(Date, nullable=False)
    receipt_id = Column(String(36), ForeignKey("receipts.id"), nullable=True)
    source = Column(String(50), default="manual")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    user = relationship("User", back_populates="expenses")
    receipt = relationship("Receipt", back_populates="expense")
