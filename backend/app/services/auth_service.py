import secrets
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User, SubscriptionStatus
from app.models.subscription import Subscription
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.config import settings


def _apply_admin_privileges(user: User, db: Session):
    if user.email == settings.ADMIN_EMAIL and not user.is_admin:
        user.is_admin = True
        user.subscription_status = SubscriptionStatus.premium
        db.commit()
        db.refresh(user)


def register_user(db: Session, req: RegisterRequest) -> TokenResponse:
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    is_admin = req.email == settings.ADMIN_EMAIL
    user = User(
        full_name=req.full_name,
        email=req.email,
        password_hash=hash_password(req.password),
        verification_token=secrets.token_urlsafe(32),
        is_admin=is_admin,
        subscription_status=SubscriptionStatus.premium if is_admin else SubscriptionStatus.free,
    )
    db.add(user)
    db.flush()

    sub = Subscription(user_id=user.id, plan_name="premium" if is_admin else "free")
    db.add(sub)
    db.commit()
    db.refresh(user)

    return _build_token_response(user)


def login_user(db: Session, req: LoginRequest) -> TokenResponse:
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not user.password_hash or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")
    _apply_admin_privileges(user, db)
    return _build_token_response(user)


def refresh_tokens(db: Session, refresh_token: str) -> TokenResponse:
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return _build_token_response(user)


def request_password_reset(db: Session, email: str):
    user = db.query(User).filter(User.email == email).first()
    if user:
        user.reset_token = secrets.token_urlsafe(32)
        user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        db.commit()
    # Always return success to avoid email enumeration


def reset_password(db: Session, token: str, new_password: str):
    user = db.query(User).filter(User.reset_token == token).first()
    if not user or not user.reset_token_expires:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    if user.reset_token_expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token expired")
    user.password_hash = hash_password(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()


def _build_token_response(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        user=UserResponse.model_validate(user),
    )
