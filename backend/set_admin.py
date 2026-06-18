import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine
from sqlalchemy import text

ADMIN_EMAIL = "denraj1505@gmail.com"

with engine.connect() as conn:
    result = conn.execute(
        text("UPDATE users SET is_admin = TRUE, subscription_status = 'premium' WHERE email = :email"),
        {"email": ADMIN_EMAIL}
    )
    conn.commit()
    print(f"Updated {result.rowcount} row(s) — {ADMIN_EMAIL} is now admin with premium status.")
