import json
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from decimal import Decimal

from openai import OpenAI
from app.config import settings
from app.models.user import User
from app.models.expense import Expense
from app.models.ai_report import AIReport
from app.schemas.ai import ChatMessage, ChatResponse, VoiceExpenseResult, InsightResponse
from app.core.dependencies import check_daily_ai_limit

_openai = None


def get_openai():
    global _openai
    if _openai is None:
        _openai = OpenAI(api_key=settings.OPENAI_API_KEY)
    return _openai


def _build_finance_context(db: Session, user: User) -> str:
    today = date.today()
    month_start = today.replace(day=1)

    monthly_total = db.query(func.sum(Expense.amount_in_base)).filter(
        Expense.user_id == user.id,
        Expense.expense_date >= month_start,
    ).scalar() or 0

    cat_rows = db.query(
        Expense.category, func.sum(Expense.amount_in_base).label("total")
    ).filter(
        Expense.user_id == user.id,
        Expense.expense_date >= month_start,
    ).group_by(Expense.category).order_by(func.sum(Expense.amount_in_base).desc()).limit(5).all()

    recent = db.query(Expense).filter(Expense.user_id == user.id).order_by(Expense.created_at.desc()).limit(10).all()

    context = f"""User Financial Context:
- Name: {user.full_name}
- Preferred Currency: {user.preferred_currency}
- This Month's Total Spending: {monthly_total:.2f} {user.preferred_currency}
- Top Categories This Month: {', '.join([f"{r.category}: {r.total:.2f}" for r in cat_rows])}
- Recent 10 Expenses: {json.dumps([{"amount": float(e.amount), "currency": e.currency, "category": e.category, "merchant": e.merchant, "date": str(e.expense_date), "notes": e.notes} for e in recent], default=str)}
"""
    return context


def chat_with_finances(db: Session, user: User, message: str, history: List[ChatMessage]) -> ChatResponse:
    check_daily_ai_limit(user, db)

    context = _build_finance_context(db, user)
    system_prompt = f"""You are CashCompass AI, a personal finance assistant. Be concise, helpful, and actionable.
Always respond in the same language the user writes in.
{context}"""

    messages = [{"role": "system", "content": system_prompt}]
    for h in history[-10:]:
        messages.append({"role": h.role, "content": h.content})
    messages.append({"role": "user", "content": message})

    response = get_openai().chat.completions.create(
        model="gpt-4o",
        messages=messages,
        temperature=0.7,
        max_tokens=500,
    )

    reply = response.choices[0].message.content

    user.daily_ai_count = (user.daily_ai_count or 0) + 1
    db.commit()

    suggestions = [
        "How much did I spend this month?",
        "What is my biggest expense category?",
        "How can I save more money?",
    ]

    return ChatResponse(message=reply, suggestions=suggestions)


def generate_spending_insight(db: Session, user: User, report_type: str = "weekly") -> InsightResponse:
    check_daily_ai_limit(user, db)
    context = _build_finance_context(db, user)

    prompt = f"""Generate a {report_type} spending insight report for this user.
{context}

Include:
1. Summary of spending
2. Key observations (what they spent most on)
3. Comparison to typical spending patterns
4. 3 actionable saving tips
5. A motivational closing message

Format in a friendly, conversational tone. Keep it under 300 words."""

    response = get_openai().chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=600,
    )

    content = response.choices[0].message.content

    report = AIReport(user_id=user.id, report_type=report_type, report_content=content)
    db.add(report)
    user.daily_ai_count = (user.daily_ai_count or 0) + 1
    db.commit()
    db.refresh(report)

    return InsightResponse.model_validate(report)


def parse_voice_expense(transcript: str) -> VoiceExpenseResult:
    prompt = f"""Extract expense information from this voice input: "{transcript}"

Return JSON with these fields:
- amount: number (required)
- currency: string (3-letter code, default "INR")
- category: one of [Food & Dining, Transportation, Shopping, Entertainment, Health & Medical, Utilities, Housing, Education, Travel, Personal Care, Other]
- merchant: string or null
- notes: string or null
- confidence: 0.0 to 1.0

Examples:
"I spent 250 rupees on lunch at McDonald's" -> {{"amount": 250, "currency": "INR", "category": "Food & Dining", "merchant": "McDonald's", "notes": "lunch", "confidence": 0.95}}
"Paid 500 for petrol" -> {{"amount": 500, "currency": "INR", "category": "Transportation", "merchant": null, "notes": "petrol", "confidence": 0.9}}

Return only valid JSON."""

    response = get_openai().chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
        max_tokens=200,
        response_format={"type": "json_object"},
    )

    data = json.loads(response.choices[0].message.content)
    return VoiceExpenseResult(
        transcript=transcript,
        amount=data.get("amount"),
        currency=data.get("currency", "INR"),
        category=data.get("category", "Other"),
        merchant=data.get("merchant"),
        notes=data.get("notes"),
        confidence=data.get("confidence", 0.5),
    )
