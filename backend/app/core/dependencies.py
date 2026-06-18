from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.config import settings
from datetime import date

bearer = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def get_pro_user(user: User = Depends(get_current_user)) -> User:
    if user.is_admin:
        return user
    if user.subscription_status not in ("pro", "premium"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pro subscription required")
    return user


def check_daily_expense_limit(user: User, db: Session):
    if user.is_admin or user.subscription_status in ("pro", "premium"):
        return
    today = date.today()
    if not user.last_reset_date or user.last_reset_date.date() < today:
        user.daily_expense_count = 0
        user.last_reset_date = today
        db.commit()
    if user.daily_expense_count >= settings.FREE_DAILY_EXPENSES:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Free plan limit: {settings.FREE_DAILY_EXPENSES} expenses/day. Upgrade to Pro."
        )


def check_daily_ai_limit(user: User, db: Session):
    if user.is_admin or user.subscription_status in ("pro", "premium"):
        return
    today = date.today()
    if not user.last_reset_date or user.last_reset_date.date() < today:
        user.daily_ai_count = 0
        user.last_reset_date = today
        db.commit()
    if user.daily_ai_count >= settings.FREE_DAILY_AI_MESSAGES:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Free plan limit: {settings.FREE_DAILY_AI_MESSAGES} AI messages/day. Upgrade to Pro."
        )
