from fastapi import APIRouter
from app.api.v1 import auth, expenses, budgets, receipts, analytics, ai, payments

router = APIRouter(prefix="/api/v1")
router.include_router(auth.router)
router.include_router(expenses.router)
router.include_router(budgets.router)
router.include_router(receipts.router)
router.include_router(analytics.router)
router.include_router(ai.router)
router.include_router(payments.router)
