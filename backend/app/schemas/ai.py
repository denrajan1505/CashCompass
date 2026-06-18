from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime


class ChatMessage(BaseModel):
    role: str  # user | assistant
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    message: str
    suggestions: Optional[List[str]] = []


class VoiceRequest(BaseModel):
    language: str = "hi-IN"


class VoiceExpenseResult(BaseModel):
    transcript: str
    amount: Optional[float] = None
    currency: Optional[str] = None
    category: Optional[str] = None
    merchant: Optional[str] = None
    notes: Optional[str] = None
    confidence: float = 0.0


class InsightResponse(BaseModel):
    id: UUID
    report_type: str
    report_content: str
    created_at: datetime

    class Config:
        from_attributes = True
