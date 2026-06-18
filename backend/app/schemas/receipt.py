from pydantic import BaseModel
from typing import Optional, Any
from uuid import UUID
from datetime import datetime


class ReceiptResponse(BaseModel):
    id: UUID
    user_id: UUID
    image_url: str
    extracted_data: Optional[Any] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ExtractedReceiptData(BaseModel):
    merchant: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    date: Optional[str] = None
    category: Optional[str] = None
    items: Optional[list] = []
    raw_text: Optional[str] = None
