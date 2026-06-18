from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencies import get_current_user, get_pro_user
from app.models.user import User
from app.models.receipt import Receipt
from app.schemas.receipt import ReceiptResponse, ExtractedReceiptData
from app.services.storage_service import upload_receipt
from app.services.receipt_service import process_receipt

router = APIRouter(prefix="/receipts", tags=["Receipts"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}
MAX_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/upload", response_model=ReceiptResponse, status_code=201)
async def upload(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_pro_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP images allowed")

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10 MB)")
    await file.seek(0)

    image_url = await upload_receipt(file, str(user.id))

    receipt = Receipt(user_id=user.id, image_url=image_url)
    db.add(receipt)
    db.commit()
    db.refresh(receipt)
    return receipt


@router.post("/{receipt_id}/process", response_model=ExtractedReceiptData)
def process(receipt_id: str, db: Session = Depends(get_db), user: User = Depends(get_pro_user)):
    return process_receipt(db, user, receipt_id)


@router.get("", response_model=list[ReceiptResponse])
def list_receipts(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    receipts = db.query(Receipt).filter(Receipt.user_id == user.id).order_by(Receipt.created_at.desc()).limit(50).all()
    return receipts
