import httpx
from sqlalchemy.orm import Session
from decimal import Decimal
from app.models.exchange_rate import ExchangeRate
from app.config import settings

SUPPORTED_CURRENCIES = [
    "INR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "SGD", "AED", "CHF",
    "HKD", "NZD", "SEK", "KRW", "MXN", "NOK", "DKK", "ZAR", "BRL", "THB",
    "MYR", "IDR", "PHP", "VND", "CNY", "TWD", "SAR", "QAR", "KWD", "BHD",
    "OMR", "EGP", "NGN", "KES", "GHS", "PKR", "BDT", "LKR", "NPR", "MMK",
]


def convert_to_base(db: Session, amount: Decimal, from_currency: str, to_currency: str) -> Decimal:
    if from_currency == to_currency:
        return amount
    rate_row = db.query(ExchangeRate).filter(
        ExchangeRate.currency_code == from_currency,
        ExchangeRate.base_currency == to_currency,
    ).first()
    if rate_row:
        return amount * Decimal(str(rate_row.exchange_rate))
    # Fallback: return original amount if rate not available
    return amount


async def refresh_exchange_rates(db: Session, base_currency: str = "INR"):
    if not settings.EXCHANGE_RATE_API_KEY:
        return
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(f"{settings.EXCHANGE_RATE_API_URL}/{settings.EXCHANGE_RATE_API_KEY}/latest/{base_currency}")
        if resp.status_code != 200:
            return
        rates = resp.json().get("conversion_rates", {})
        for code, rate in rates.items():
            if code in SUPPORTED_CURRENCIES:
                row = db.query(ExchangeRate).filter(
                    ExchangeRate.currency_code == code,
                    ExchangeRate.base_currency == base_currency,
                ).first()
                if row:
                    row.exchange_rate = rate
                else:
                    db.add(ExchangeRate(base_currency=base_currency, currency_code=code, exchange_rate=rate))
        db.commit()
