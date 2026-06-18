import json
import base64
from pathlib import Path
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.config import settings
from app.models.receipt import Receipt
from app.models.user import User
from app.schemas.receipt import ExtractedReceiptData

PROMPT = """Extract the following information from this receipt image and return as JSON:
{
  "merchant": "store/restaurant name",
  "amount": total amount as number,
  "currency": "3-letter currency code (INR for India)",
  "date": "YYYY-MM-DD format if visible",
  "category": "Food & Dining|Transportation|Shopping|Entertainment|Health & Medical|Utilities|Other",
  "items": [{"name": "item name", "price": price_number}],
  "raw_text": "full text extracted from receipt"
}
Return only valid JSON. If a field cannot be determined, use null."""


def _load_image(receipt) -> tuple[bytes, str]:
    if receipt.image_url.startswith("/uploads/"):
        local_path = Path(__file__).resolve().parent.parent.parent / receipt.image_url.lstrip("/")
        img_bytes = local_path.read_bytes()
        ext = local_path.suffix.lower().lstrip(".")
        content_type = f"image/{'jpeg' if ext == 'jpg' else ext}"
    else:
        import httpx
        r = httpx.get(receipt.image_url, timeout=10)
        img_bytes = r.content
        content_type = r.headers.get("content-type", "image/jpeg")

    # Resize to max 1024px to reduce token cost
    try:
        from PIL import Image
        import io
        img = Image.open(io.BytesIO(img_bytes))
        if max(img.size) > 1024:
            img.thumbnail((1024, 1024), Image.LANCZOS)
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=85)
            img_bytes = buf.getvalue()
            content_type = "image/jpeg"
    except Exception:
        pass

    return img_bytes, content_type


def _parse_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())


def _ocr_with_openai(img_bytes: bytes, content_type: str) -> dict:
    from openai import OpenAI
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    b64 = base64.b64encode(img_bytes).decode()
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": f"data:{content_type};base64,{b64}"}},
                {"type": "text", "text": PROMPT},
            ],
        }],
        max_tokens=1000,
    )
    return _parse_json(response.choices[0].message.content)


def _ocr_with_gemini(img_bytes: bytes, content_type: str) -> dict:
    from google import genai
    from google.genai import types
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    response = client.models.generate_content(
        model="gemini-2.0-flash-lite",
        contents=[
            types.Part.from_bytes(data=img_bytes, mime_type=content_type),
            PROMPT,
        ],
    )
    return _parse_json(response.text)


def process_receipt(db: Session, user: User, receipt_id: str) -> ExtractedReceiptData:
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id, Receipt.user_id == user.id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")

    if not settings.OPENAI_API_KEY and not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=501, detail="Receipt scanner requires OPENAI_API_KEY or GEMINI_API_KEY in .env")

    try:
        img_bytes, content_type = _load_image(receipt)

        # Use OpenAI if available, fall back to Gemini
        if settings.OPENAI_API_KEY:
            data = _ocr_with_openai(img_bytes, content_type)
        else:
            data = _ocr_with_gemini(img_bytes, content_type)

        extracted = ExtractedReceiptData(
            merchant=data.get("merchant"),
            amount=data.get("amount"),
            currency=data.get("currency", "INR"),
            date=data.get("date"),
            category=data.get("category", "Other"),
            items=data.get("items", []),
            raw_text=data.get("raw_text"),
        )

        receipt.extracted_data = extracted.model_dump()
        receipt.raw_text = data.get("raw_text")
        receipt.status = "processed"
        db.commit()

        return extracted

    except HTTPException:
        raise
    except Exception as e:
        receipt.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")
