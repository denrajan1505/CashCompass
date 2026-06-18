import httpx
import hmac
import hashlib
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.config import settings
from app.models.user import User
from app.models.subscription import Subscription
from app.models.user import SubscriptionStatus

DODO_API_BASE = "https://api.dodopayments.com/v1"

PLAN_PRICES = {
    "pro": {"inr": 49900, "name": "CashCompass Pro"},
    "premium": {"inr": 99900, "name": "CashCompass Premium"},
}


async def create_checkout_session(db: Session, user: User, plan_name: str, success_url: str, cancel_url: str) -> str:
    if plan_name not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail="Invalid plan")

    price = PLAN_PRICES[plan_name]

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{DODO_API_BASE}/checkout/sessions",
            headers={"Authorization": f"Bearer {settings.DODO_API_KEY}"},
            json={
                "customer_email": user.email,
                "customer_name": user.full_name,
                "amount": price["inr"],
                "currency": "INR",
                "description": price["name"],
                "success_url": success_url,
                "cancel_url": cancel_url,
                "metadata": {"user_id": str(user.id), "plan": plan_name},
            },
        )
        if response.status_code not in (200, 201):
            raise HTTPException(status_code=502, detail="Payment gateway error")
        return response.json().get("checkout_url", "")


async def cancel_subscription(db: Session, user: User):
    sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    if not sub or not sub.dodo_subscription_id:
        raise HTTPException(status_code=400, detail="No active subscription")

    async with httpx.AsyncClient() as client:
        await client.delete(
            f"{DODO_API_BASE}/subscriptions/{sub.dodo_subscription_id}",
            headers={"Authorization": f"Bearer {settings.DODO_API_KEY}"},
        )

    sub.status = "cancelled"
    user.subscription_status = SubscriptionStatus.free
    db.commit()


def verify_webhook_signature(payload: bytes, signature: str) -> bool:
    expected = hmac.new(
        settings.DODO_WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


def handle_webhook_event(db: Session, event: str, data: dict):
    user_id = data.get("metadata", {}).get("user_id")
    if not user_id:
        return

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return

    plan = data.get("metadata", {}).get("plan", "pro")
    sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()

    if event == "payment.success":
        if not sub:
            sub = Subscription(user_id=user.id)
            db.add(sub)
        sub.plan_name = plan
        sub.status = "active"
        sub.dodo_customer_id = data.get("customer_id")
        sub.dodo_subscription_id = data.get("subscription_id")
        user.subscription_status = SubscriptionStatus(plan)

    elif event in ("subscription.cancelled", "payment.failed"):
        if sub:
            sub.status = "cancelled"
        user.subscription_status = SubscriptionStatus.free

    db.commit()
