import uuid
from pathlib import Path
from fastapi import UploadFile
from app.config import settings

# Local fallback directory (used when S3 is not configured)
_LOCAL_UPLOADS = Path(__file__).resolve().parent.parent.parent / "uploads" / "receipts"


def _s3_configured() -> bool:
    return (
        bool(settings.AWS_ACCESS_KEY_ID)
        and settings.AWS_ACCESS_KEY_ID not in ("", "...")
        and bool(settings.AWS_SECRET_ACCESS_KEY)
        and settings.AWS_SECRET_ACCESS_KEY not in ("", "...")
    )


def _get_s3_client():
    import boto3
    kwargs = dict(
        region_name=settings.S3_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )
    if settings.S3_ENDPOINT_URL:
        kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL
    return boto3.client("s3", **kwargs)


async def upload_receipt(file: UploadFile, user_id: str) -> str:
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    content = await file.read()

    if _s3_configured():
        key = f"receipts/{user_id}/{filename}"
        s3 = _get_s3_client()
        s3.put_object(
            Bucket=settings.S3_BUCKET,
            Key=key,
            Body=content,
            ContentType=file.content_type or "image/jpeg",
        )
        if settings.S3_ENDPOINT_URL:
            return f"{settings.S3_ENDPOINT_URL}/{settings.S3_BUCKET}/{key}"
        return f"https://{settings.S3_BUCKET}.s3.{settings.S3_REGION}.amazonaws.com/{key}"

    # Local fallback
    dest = _LOCAL_UPLOADS / user_id
    dest.mkdir(parents=True, exist_ok=True)
    (dest / filename).write_bytes(content)
    return f"/uploads/receipts/{user_id}/{filename}"
