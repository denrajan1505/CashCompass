from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
import httpx

from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.ai import ChatRequest, ChatResponse, VoiceExpenseResult, InsightResponse
from app.services import ai_service
from app.config import settings

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return ai_service.chat_with_finances(db, user, req.message, req.history)


@router.post("/insights", response_model=InsightResponse)
def insights(
    report_type: str = "weekly",
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if report_type not in ("weekly", "monthly"):
        raise HTTPException(status_code=400, detail="report_type must be 'weekly' or 'monthly'")
    return ai_service.generate_spending_insight(db, user, report_type)


@router.post("/voice", response_model=VoiceExpenseResult)
async def voice_to_expense(
    audio: UploadFile = File(...),
    language: str = "hi-IN",
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    audio_bytes = await audio.read()

    transcript = ""
    if settings.SARVAM_API_KEY:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                settings.SARVAM_API_URL,
                headers={"api-subscription-key": settings.SARVAM_API_KEY},
                files={"file": (audio.filename, audio_bytes, audio.content_type)},
                data={"language_code": language, "model": "saarika:v1"},
            )
            if resp.status_code == 200:
                transcript = resp.json().get("transcript", "")

    if not transcript:
        raise HTTPException(status_code=422, detail="Could not transcribe audio")

    return ai_service.parse_voice_expense(transcript)
