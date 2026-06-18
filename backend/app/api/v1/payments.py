from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.subscription import Subscription
from app.schemas.payment import CreateSubscriptionRequest, SubscriptionResponse
from app.services import payment_service

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/subscribe", response_model=SubscriptionResponse)
async def subscribe(
    req: CreateSubscriptionRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    checkout_url = await payment_service.create_checkout_session(
        db, user, req.plan_name, req.success_url, req.cancel_url
    )
    return SubscriptionResponse(
        plan_name=req.plan_name,
        status="pending",
        checkout_url=checkout_url,
    )


@router.delete("/cancel", status_code=204)
async def cancel(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    await payment_service.cancel_subscription(db, user)


@router.get("/status", response_model=SubscriptionResponse)
def status(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    return SubscriptionResponse(
        plan_name=sub.plan_name if sub else "free",
        status=sub.status if sub else "active",
        renewal_date=sub.renewal_date if sub else None,
    )


@router.post("/webhook")
async def webhook(request: Request, db: Session = Depends(get_db)):
    body = await request.body()
    signature = request.headers.get("dodo-signature", "")

    if not payment_service.verify_webhook_signature(body, signature):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    payload = await request.json()
    payment_service.handle_webhook_event(db, payload.get("event", ""), payload.get("data", {}))
    return {"received": True}
