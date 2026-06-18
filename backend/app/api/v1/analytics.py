from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date

from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.analytics import DashboardMetrics, SpendingReport
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=DashboardMetrics)
def dashboard(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return analytics_service.get_dashboard_metrics(db, user)


@router.get("/report", response_model=SpendingReport)
def monthly_report(
    month: int = Query(date.today().month, ge=1, le=12),
    year: int = Query(date.today().year),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return analytics_service.get_spending_report(db, user, year, month)
