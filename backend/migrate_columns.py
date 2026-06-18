import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine
from sqlalchemy import text

COLUMNS = [
    ("is_admin",            "BOOLEAN NOT NULL DEFAULT FALSE"),
    ("is_verified",         "BOOLEAN NOT NULL DEFAULT FALSE"),
    ("verification_token",  "VARCHAR(255)"),
    ("reset_token",         "VARCHAR(255)"),
    ("reset_token_expires", "TIMESTAMP"),
    ("daily_expense_count", "INTEGER NOT NULL DEFAULT 0"),
    ("daily_ai_count",      "INTEGER NOT NULL DEFAULT 0"),
    ("last_reset_date",     "TIMESTAMP"),
]

with engine.connect() as conn:
    result = conn.execute(text(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"
    ))
    existing = {r[0] for r in result}
    print("Existing columns:", sorted(existing))

    added = []
    for col, definition in COLUMNS:
        if col not in existing:
            conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {definition}"))
            added.append(col)
            print(f"  + Added: {col}")

    conn.commit()
    if added:
        print("Done. Added:", added)
    else:
        print("All columns already present.")
