from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse, RefreshRequest,
    ForgotPasswordRequest, ResetPasswordRequest, UserResponse,
)
from app.services import auth_service
from app.core.dependencies import get_current_user
from app.models.user import User
from app.utils.email import send_verification_email, send_password_reset_email

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(req: RegisterRequest, background: BackgroundTasks, db: Session = Depends(get_db)):
    result = auth_service.register_user(db, req)
    user = db.query(User).filter(User.email == req.email).first()
    if user and user.verification_token:
        background.add_task(send_verification_email, user.email, user.full_name, user.verification_token)
    return result


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    return auth_service.login_user(db, req)


@router.post("/refresh", response_model=TokenResponse)
def refresh(req: RefreshRequest, db: Session = Depends(get_db)):
    return auth_service.refresh_tokens(db, req.refresh_token)


@router.post("/forgot-password", status_code=204)
def forgot_password(req: ForgotPasswordRequest, background: BackgroundTasks, db: Session = Depends(get_db)):
    auth_service.request_password_reset(db, req.email)
    user = db.query(User).filter(User.email == req.email).first()
    if user and user.reset_token:
        background.add_task(send_password_reset_email, user.email, user.full_name, user.reset_token)


@router.post("/reset-password", status_code=204)
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    auth_service.reset_password(db, req.token, req.new_password)


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserResponse)
def update_profile(
    data: dict,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    allowed = {"full_name", "preferred_currency", "preferred_language"}
    for k, v in data.items():
        if k in allowed:
            setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return user
