from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CreateSubscriptionRequest(BaseModel):
    plan_name: str  # pro | premium
    success_url: str
    cancel_url: str


class SubscriptionResponse(BaseModel):
    plan_name: str
    status: str
    renewal_date: Optional[datetime] = None
    checkout_url: Optional[str] = None


class WebhookPayload(BaseModel):
    event: str
    data: dict
